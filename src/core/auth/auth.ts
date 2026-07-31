import { supabase } from '@/core/supabase/client';

export type AuthErrorCode =
  | 'INVALID_CREDENTIALS'
  | 'RATE_LIMITED'
  | 'SERVICE_UNAVAILABLE'
  | 'SIGNUP_FAILED'
  | 'UPDATE_FAILED';

export class AuthUserError extends Error {
  constructor(
    public readonly code: AuthErrorCode,
    public readonly retryAfterSeconds?: number,
  ) {
    super(code);
    this.name = 'AuthUserError';
  }
}

export async function signIn(email: string, password: string) {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const payload = await response.json().catch(() => ({})) as { code?: AuthErrorCode };
  if (!response.ok) {
    const retryAfterHeader = Number(response.headers.get('Retry-After'));
    const retryAfterSeconds =
      Number.isFinite(retryAfterHeader) && retryAfterHeader > 0
        ? Math.ceil(retryAfterHeader)
        : undefined;
    throw new AuthUserError(
      payload.code || 'SERVICE_UNAVAILABLE',
      retryAfterSeconds,
    );
  }
}

export async function signInWithGoogle(redirectTo = '/') {
  const callbackUrl = new URL('/auth/callback', window.location.origin);
  callbackUrl.searchParams.set('next', redirectTo);

  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: callbackUrl.toString(),
      queryParams: { prompt: 'select_account' },
    },
  });

  if (error) throw new AuthUserError('SERVICE_UNAVAILABLE');
}

export async function signUp(email: string, password: string, name?: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name: name || '',
      },
    },
  });
  if (error) throw new AuthUserError('SIGNUP_FAILED');
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw new AuthUserError('SERVICE_UNAVAILABLE');
}

export async function getUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function updateUserName(name: string) {
  const trimmedName = name.trim();
  if (!trimmedName) throw new Error('Name is required.');

  const { data, error } = await supabase.auth.updateUser({
    data: { name: trimmedName },
  });
  if (error) throw new AuthUserError('UPDATE_FAILED');

  const email = data.user.email;
  if (!email) throw new Error('The account email could not be found.');

  const { error: profileError } = await supabase
    .from('profiles')
    .upsert(
      {
        id: data.user.id,
        email,
        name: trimmedName,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' },
    );

  if (profileError) throw new AuthUserError('UPDATE_FAILED');
  return data.user;
}

export async function updateUserEmail(email: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const { data, error } = await supabase.auth.updateUser({ email: normalizedEmail });
  if (error) throw new AuthUserError('UPDATE_FAILED');
  return data.user;
}

export class CurrentPasswordError extends Error {
  constructor() {
    super('The current password is incorrect.');
    this.name = 'CurrentPasswordError';
  }
}

export async function verifyCurrentPassword(password: string) {
  const response = await fetch('/api/auth/verify-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({})) as { code?: string };
    if (payload.code === 'INVALID_CREDENTIALS') throw new CurrentPasswordError();
    throw new AuthUserError('SERVICE_UNAVAILABLE');
  }
}

export async function updateUserPassword(currentPassword: string, password: string) {
  const { data, error } = await supabase.auth.updateUser({
    current_password: currentPassword,
    password,
  });
  if (error) {
    if (error.code === 'invalid_credentials' || /current password/i.test(error.message)) {
      throw new CurrentPasswordError();
    }
    throw new AuthUserError('UPDATE_FAILED');
  }
  return data.user;
}

export async function getUserProfile() {
  const user = await getUser();
  if (!user) return null;

  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return data;
}

export async function isAdmin(): Promise<boolean> {
  const profile = await getUserProfile();
  return profile?.role === "super_admin" || profile?.role === "editor";
}
