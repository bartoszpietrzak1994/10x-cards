# Schemat bazy danych 10xCards - Plan

## Enum
```sql
CREATE TYPE card_type AS ENUM ('AI-generated', 'AI-edited', 'AI-proposal' 'manual');
```

## Tabele

### 1. roles
```sql
CREATE TABLE roles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL
);
```

### 2. users
Tabela auth.users jest zarządzana przez Supabase Auth.
Schema zawierająca dodatkowe informacje o uzytkowniku zawierajaca referencje do auth.users (Supabase Auth)
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
  role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE RESTRICT
);

-- Indeks dla email
CREATE UNIQUE INDEX idx_users_email ON users(email);

-- Włączenie RLS (Row Level Security)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Przykładowa polityka: użytkownik może odczytywać tylko własne dane lub administratorzy
-- CREATE POLICY user_select_policy ON users
--   USING (id = current_setting('app.current_user_id')::INTEGER OR EXISTS (SELECT 1 FROM roles WHERE id = role_id AND name = 'admin'));
```

### 3. fiszki
```sql
CREATE TABLE flashcards_ai_generation (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  request_time TIMESTAMPTZ NOT NULL,
  response_time TIMESTAMPTZ,
  token_count INTEGER,
  generated_flashcards_count INTEGER,
  model VARCHAR(36)
);

CREATE TABLE flashcards (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ai_generation_id INTEGER UNIQUE REFERENCES flashcards_ai_generation(id),
  front VARCHAR(200) NOT NULL,
  back VARCHAR(500) NOT NULL,
  flashcard_type card_type NOT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Indeksy:
CREATE INDEX idx_flashcards_user_id ON flashcards(user_id);
CREATE INDEX idx_flashcards_typ ON flashcards(flashcard_type);
CREATE INDEX idx_flashcards_ai_generation_id ON flashcards(ai_generation_id);

-- RLS: Włączenie i konfiguracja polityk RLS
ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;

-- Przykładowa polityka:
-- CREATE POLICY flashcards_select_policy ON flashcards
--   USING (user_id = current_setting('app.current_user_id')::INTEGER OR EXISTS (SELECT 1 FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = user_id AND r.name = 'admin'));
```

### 4. ai_logs
```sql
CREATE TABLE ai_logs (
  id SERIAL PRIMARY KEY,
  flashcards_generation_id INTEGER UNIQUE NOT NULL REFERENCES flashcards_ai_generation(id) ON DELETE CASCADE,
  request_time TIMESTAMPTZ NOT NULL,
  response_time TIMESTAMPTZ,
  token_count INTEGER,
  input_length INTEGER NOT NULL CHECK(input_length BETWEEN 1000 and 10000),
  input_text_hash TEXT NOT NULL,
  error_info TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Indeksy:
CREATE INDEX idx_ai_logs_flashcards_generation_id ON ai_logs(flashcards_generation_id);
```

## Relacje między tabelami
- Tabela `users` posiada klucz obcy `role_id` odnoszący się do `roles(id)`. Relacja: jeden-do-wielu (jedna rola może być przypisana do wielu użytkowników).
- Tabela `flashcards_ai_generation` posiada klucz obcy `user_id` odnoszący się do `users(id)`. Relacja: jeden-do-wielu (jeden użytkownik może mieć wiele procesów generacji fiszek)
- Tabela `flashcards` posiada klucz obcy `user_id` odnoszący się do `users(id)`. Relacja: jeden-do-wielu (jeden użytkownik może mieć wiele fiszek).
- Tabela `flashcards` posiada klucz obcy `ai_generation_id` odnoszący się do `flashcards_ai_generation(id)`. Relacja: jeden-do-jednego (jedna fiszka może mieć jeden proces generowania fiszek)
- Tabela `ai_logs` posiada klucz obcy `flashcards_generation_id` odnoszący się do `flashcards_ai_generation(id)`. Relacja: jeden-do-jednego (jedne logi mogą być przypisane do jednej generacji fiszek).

## Indeksy
- `users`: unikalne indeksy na kolumnach `email`.
- `flashcards`: indeksy na kolumnach `user_id`, `flashcard_type`, oraz `ai_generation_id`.
- `ai_logs`: indeks na kolumnie `flashcard_generation_id`.

## Zasady PostreSQL dla zabezpieczeń (RLS)
- RLS jest włączone dla tabel `users` oraz `flashcards`, aby umożliwić dostęp do danych wyłącznie właścicielowi rekordu lub administratorowi.
- Przykładowe polityki (konfiguracja polityk powinna być dostosowana do mechanizmu zarządzania sesją i autoryzacją):
  - Dla tabeli `users`: Polityka umożliwiająca dostęp tylko dla własnych rekordów lub użytkowników o roli `admin`.
  - Dla tabeli `flashcards`: Polityka umożliwiająca dostęp tylko dla rekordów należących do zalogowanego użytkownika lub w przypadku uprawnień administratora.

## Dodatkowe uwagi
- Wszystkie pola krytyczne (np. `email`, `flashcard_type`) są oznaczone jako NOT NULL.
- Unikalność oraz relacje między tabelami są zabezpieczone przez odpowiednie klucze PRIMARY KEY, UNIQUE i FOREIGN KEY.
- Indeksy zostały dodane dla kolumn, które będą często wykorzystywane w zapytaniach, co powinno poprawić wydajność.
- Operacje tworzenia użytkownika powiązanego z rolą oraz tworzenia fiszki łącznie z logiem interakcji powinny być wykonywane w ramach jednej transakcji, aby zapewnić spójność danych.
