begin;

select plan(3);

set local role service_role;

insert into public.asset_registry (
  bucket, path, reserved_by, reservation_id, reserved_at, expires_at
) values (
  'hero-videos', 'lease-test/stale.mp4',
  '60000000-0000-0000-0000-000000000001',
  '60000000-0000-0000-0000-000000000002',
  now() - interval '31 minutes', now() - interval '1 minute'
);

select public.reserve_r2_asset_deletions(
  'hero-videos', array['lease-test/stale.mp4'],
  '60000000-0000-0000-0000-000000000001',
  '60000000-0000-0000-0000-000000000003'
);
select is(
  (select reservation_id from public.asset_registry where bucket = 'hero-videos' and path = 'lease-test/stale.mp4'),
  '60000000-0000-0000-0000-000000000003'::uuid,
  'expired reservation is reclaimed with a fresh token'
);

do $$
begin
  begin
    perform public.reserve_r2_asset_deletions(
      'hero-videos', array['lease-test/stale.mp4'],
      '60000000-0000-0000-0000-000000000001',
      '60000000-0000-0000-0000-000000000004'
    );
    raise exception 'active reservation unexpectedly reclaimed';
  exception when sqlstate '55P03' then null;
  end;
end;
$$;
select ok(
  exists (select 1 from public.asset_registry where reservation_id = '60000000-0000-0000-0000-000000000003'),
  'active reservation remains locked'
);

do $$
begin
  begin
    perform public.release_r2_asset_deletions(
      'hero-videos', array['lease-test/stale.mp4'],
      '60000000-0000-0000-0000-000000000001',
      '60000000-0000-0000-0000-000000000004'
    );
    raise exception 'wrong reservation token unexpectedly released the lock';
  exception when sqlstate '55P03' then null;
  end;
end;
$$;
select ok(
  exists (select 1 from public.asset_registry where reservation_id = '60000000-0000-0000-0000-000000000003'),
  'wrong token cannot release a newer reservation'
);

rollback;
