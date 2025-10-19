-- 20251016120000_initial_schema.sql
--
-- migration for creating the initial schema for 10xcards.
-- this migration creates:
--   - an enum: card_type with values ('ai-generated', 'ai-edited', 'manual')
--   - table roles: for user roles (unique values)
--   - table users: additional user data referencing auth.users and table roles.
--   - table flashcards_ai_generation: stores ai generation process details.
--   - table flashcards: stores flashcards created manually or via ai.
--   - table ai_logs: stores logs of ai generation process.
--
-- for each new table, row-level security is enabled.
-- separate rls policies are created for select, insert, update, and delete operations.
--
-- note: policies provided are sample implementations.

-- create enum type for card_type
create type card_type as enum (
  'ai-generated',
  'ai-edited',
  'ai-proposal',
  'manual'
);

-- create table roles
create table roles (
  id serial primary key,
  name varchar(50) unique not null
);

-- enable row-level security on roles
alter table roles enable row level security;
-- policies for roles are to be defined as needed.

-- create table flashcards_ai_generation
create table flashcards_ai_generation (
  id serial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  request_time timestamptz not null,
  response_time timestamptz,
  token_count integer,
  generated_flashcards_count integer,
  model varchar(36)
);

-- alter table flashcards_ai_generation enable row level security;

-- create table flashcards
create table flashcards (
  id serial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  ai_generation_id integer unique references flashcards_ai_generation(id),
  front varchar(200) not null,
  back varchar(500) not null,
  flashcard_type card_type not null,
  created_at timestamptz default current_timestamp not null
);

create index idx_flashcards_user_id on flashcards(user_id);
create index idx_flashcards_typ on flashcards(flashcard_type);
create index idx_flashcards_ai_generation_id on flashcards(ai_generation_id);

alter table flashcards enable row level security;

create policy flashcards_select_anon on flashcards
  for select
  to anon
  using (user_id = current_setting('app.current_user_id')::uuid);

create policy flashcards_select_authenticated on flashcards
  for select
  to authenticated
  using (user_id = current_setting('app.current_user_id')::uuid);

create policy flashcards_insert_policy on flashcards
  for insert
  to authenticated
  with check (user_id = current_setting('app.current_user_id')::uuid);

create policy flashcards_update_policy on flashcards
  for update
  to authenticated
  using (user_id = current_setting('app.current_user_id')::uuid);

create policy flashcards_delete_policy on flashcards
  for delete
  to authenticated
  using (user_id = current_setting('app.current_user_id')::uuid);

-- create table ai_logs
create table ai_logs (
  id serial primary key,
  flashcards_generation_id integer unique not null references flashcards_ai_generation(id) on delete cascade,
  request_time timestamptz not null,
  response_time timestamptz,
  token_count integer,
  input_length integer not null check (input_length between 1000 and 10000),
  input_text_hash text not null,
  error_info text,
  created_at timestamptz default current_timestamp not null
);

create index idx_ai_logs_flashcards_generation_id on ai_logs(flashcards_generation_id);

alter table ai_logs enable row level security;

create policy ai_logs_select_policy on ai_logs
  for select
  to authenticated
  using (exists (
    select 1 from flashcards_ai_generation where id = flashcards_generation_id and user_id = current_setting('app.current_user_id')::uuid
  ));