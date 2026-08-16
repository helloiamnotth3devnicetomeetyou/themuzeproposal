begin;

select plan(4);

select ok(
  not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'public read business assets'
      and (qual is null or position('[1-8]' in qual) = 0 or position('[1-5]' in qual) > 0)
  ),
  'business asset policy accepts UUID versions 1 through 8'
);

select ok(
  (select count(*) = 2
   from pg_policies
   where schemaname = 'storage'
     and tablename = 'objects'
     and policyname in ('admins read contact attachments', 'admins read protect evidence')
  )
  and not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname in ('admins read contact attachments', 'admins read protect evidence')
      and (qual is null or position('[1-8]' in qual) = 0 or position('[1-5]' in qual) > 0)
  ),
  'private evidence policies use the shared UUID version and variant range'
);

select ok(
  'press-kit/77777777-7777-7777-a777-777777777777.zip' ~*
  '^press-kit/[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}[.]zip$',
  'a version 7 UUID path is valid'
);

select ok(
  not (
    'press-kit/99999999-9999-9999-c999-999999999999.zip' ~*
    '^press-kit/[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}[.]zip$'
  ),
  'version 9 and reserved UUID variant paths are rejected'
);

select * from finish();
rollback;
