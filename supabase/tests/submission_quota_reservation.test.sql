begin;

select plan(10);

set local role service_role;

delete from private.submission_rate_limit_reservations
where scope in ('contact_inquiry', 'protect_report', 'audition_submission')
  and (user_key_hash in (repeat('1', 64), repeat('2', 64), repeat('3', 64))
    or ip_key_hash in (repeat('a', 64), repeat('b', 64), repeat('c', 64)));
delete from private.submission_rate_limits
where scope = 'contact_inquiry'
  and key_hash in (
    repeat('1', 64), repeat('2', 64), repeat('3', 64),
    repeat('a', 64), repeat('b', 64), repeat('c', 64)
  );

create temporary table quota_reservation_result on commit drop as
select * from public.reserve_submission_rate_limit(
  'contact_inquiry', repeat('1', 64), repeat('a', 64), 2, 1, 86400
);

select ok(
  (select reservation_id from quota_reservation_result) is not null,
  'reservation returns a token'
);
select is(
  (select is_allowed from quota_reservation_result),
  true,
  'user and IP quota reserve atomically when both have capacity'
);
select is(
  (select remaining from quota_reservation_result),
  0,
  'active IP reservation is reflected in remaining quota'
);
select is(
  (select remaining from public.get_submission_rate_limit_remaining(
    'contact_inquiry', repeat('1', 64), 2, 86400
  )),
  1,
  'active reservation blocks one user slot'
);

create temporary table blocked_reservation_result on commit drop as
select * from public.reserve_submission_rate_limit(
  'contact_inquiry', repeat('1', 64), repeat('b', 64), 1, 5, 86400
);
select is(
  (select is_allowed from blocked_reservation_result),
  false,
  'a full user quota rejects the whole user plus IP reservation'
);
select is(
  (select count(*) from private.submission_rate_limit_reservations
   where reservation_id = (select reservation_id from blocked_reservation_result)),
  0::bigint,
  'a rejected reservation creates no token row'
);
select is(
  (select count(*) from private.submission_rate_limit_reservations
   where reservation_id = (select reservation_id from quota_reservation_result)
     and status = 'reserved'),
  1::bigint,
  'the first reservation remains active after a rejected contender'
);

perform public.release_submission_rate_limit(
  (select reservation_id from quota_reservation_result)
);
perform public.release_submission_rate_limit(
  (select reservation_id from quota_reservation_result)
);
select is(
  (select remaining from public.get_submission_rate_limit_remaining(
    'contact_inquiry', repeat('1', 64), 2, 86400
  )),
  2,
  'release is idempotent and restores the reserved user slot'
);

perform public.reserve_submission_rate_limit(
  'contact_inquiry', repeat('2', 64), repeat('c', 64), 1, 5, 86400
);
perform public.finalize_submission_rate_limit(
  (select reservation_id from private.submission_rate_limit_reservations
   where scope = 'contact_inquiry' and user_key_hash = repeat('2', 64)
   order by reserved_at desc limit 1)
);
perform public.finalize_submission_rate_limit(
  (select reservation_id from private.submission_rate_limit_reservations
   where scope = 'contact_inquiry' and user_key_hash = repeat('2', 64)
   order by reserved_at desc limit 1)
);
select is(
  (select attempt_count from private.submission_rate_limits
   where scope = 'contact_inquiry' and key_hash = repeat('2', 64)),
  1,
  'finalize is idempotent and consumes exactly one user slot'
);
perform public.release_submission_rate_limit(
  (select reservation_id from private.submission_rate_limit_reservations
   where scope = 'contact_inquiry' and user_key_hash = repeat('2', 64)
   order by reserved_at desc limit 1)
);

select is(
  (select is_allowed from public.consume_submission_rate_limit(
    'contact_inquiry_attempt', repeat('3', 64), 1, 900
  )),
  true,
  'the existing short-window attempt limiter remains available'
);

select * from finish();
rollback;
