-- Diário de leitura: uma entrada por livro por dia (resumo do que leu, impressões).
alter table book_notes add column if not exists date date;
alter table book_notes drop constraint if exists book_notes_kind_check;
alter table book_notes add constraint book_notes_kind_check check (kind in ('citacao','anotacao','reflexao','diario'));
create unique index if not exists book_notes_diario_dia on book_notes (book_id, date) where kind = 'diario';
