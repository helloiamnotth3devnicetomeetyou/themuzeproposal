import { supabase } from './supabase';

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data;
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
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
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
  if (error) throw error;

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

  if (profileError) throw profileError;
  return data.user;
}

export async function updateUserEmail(email: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const { data, error } = await supabase.auth.updateUser({ email: normalizedEmail });
  if (error) throw error;
  return data.user;
}

export class CurrentPasswordError extends Error {
  constructor() {
    super('The current password is incorrect.');
    this.name = 'CurrentPasswordError';
  }
}

export async function verifyCurrentPassword(password: string) {
  const user = await getUser();
  if (!user?.email) throw new Error('The account email could not be found.');

  const { error } = await supabase.auth.signInWithPassword({
    email: user.email,
    password,
  });
  if (error) {
    if (error.code === 'invalid_credentials') throw new CurrentPasswordError();
    throw error;
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
    throw error;
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
  return !!profile?.is_admin;
}
