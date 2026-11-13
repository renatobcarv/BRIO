-- BRIO v13: compras parceladas. Rode no SQL Editor. Pode rodar mais de uma vez.
alter table finance_items add column if not exists inst_group uuid;
alter table finance_items add column if not exists inst_no int;
alter table finance_items add column if not exists inst_total int;
alter table finance_items add column if not exists inst_amount numeric(12,2);
create index if not exists finance_items_inst on finance_items (user_id, inst_group);
