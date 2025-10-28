# Dokument wymagań produktu (PRD) - 10xCards

## 1. Przegląd produktu
Produkt 10xCards ma na celu usprawnienie procesu tworzenia fiszek edukacyjnych poprzez automatyzację generowania ich treści za pomocą AI oraz umożliwienie ręcznego tworzenia fiszek. Produkt oferuje również możliwość przeglądania, edycji i usuwania fiszek, a także zarządzania kontami użytkowników z zabezpieczeniami na poziomie pojedynczego usera oraz jego fiszek. Wbudowana integracja z gotowym algorytmem powtórek wspiera metodę spaced repetition, przyczyniając się do efektywniejszej nauki.

## 2. Problem użytkownika
Użytkownicy napotykają problem związany z czasochłonnością ręcznego tworzenia wysokiej jakości fiszek edukacyjnych. Manualne tworzenie treści znacznie obniża efektywność nauki, mimo że metoda spaced repetition jest wyjątkowo skuteczna. Produkt rozwiązuje ten problem dzięki możliwości generowania fiszek przez AI na podstawie wprowadzonego tekstu, co pozwala oszczędzić czas i zwiększyć efektywność nauki.

## 3. Wymagania funkcjonalne
1. Generowanie fiszek przez AI:
   - Umożliwia użytkownikowi wklejenie tekstu, na podstawie którego system generuje propozycje fiszek.
   - Pole tekstowe oczekuje od 1000 do 10 000 znaków.
   - AI musi wygenerować odpowiedzi w czasie do 30 sekund, nawet przy ewentualnym kompromisie na kosztach.
   - System loguje interakcje z LLM, rejestrując metadane takie jak: czas zapytania, czas odpowiedzi, liczba tokenów, unikalny identyfikator oraz informacje o ewentualnych błędach.

2. Ręczne tworzenie fiszek:
   - Umożliwia użytkownikowi definiowanie obu stron fiszki (front i back).

3. Przeglądanie, edycja i usuwanie fiszek:
   - Użytkownik ma możliwość przeglądania listy fiszek, ich edycji oraz usuwania.

4. System kont użytkowników:
   - Umożliwia tworzenie i zarządzanie kontem użytkownika przy użyciu standardowych mechanizmów uwierzytelniania.
   - Zastosowanie Row-Level Security w celu ochrony danych.

5. Integracja z algorytmem powtórek:
   - Integracja fiszek z istniejącym algorytmem spaced repetition, który obsługuje proces nauki na podstawie zaplanowanych powtórek.

6. Struktura bazy danych:
   - Jednolita struktura dla obu typów fiszek (manualnych i generowanych przez AI) z dodatkowym markerem do rozróżnienia ich pochodzenia.

## 4. Granice produktu
1. Elementy wyłączone z zakresu MVP:
   - Zaawansowany, własny algorytm powtórek (np. SuperMemo, Anki).
   - Import fiszek z wielu formatów plików (PDF, DOCX, itp.).
   - Współdzielenie zestawów fiszek między użytkownikami.
   - Integracje z zewnętrznymi platformami edukacyjnymi.
   - Mobilne aplikacje – na początku produkt jest webowy.

2. Ograniczenia funkcjonalne:
   - Czas odpowiedzi AI ustalony na 30-40 sekund, co może wiązać się z kompromisem w kwestii kosztów.

## 5. Historyjki użytkowników

### US-001a: Rejestracja użytkownika
- ID: US-001a
- Tytuł: Rejestracja
- Opis: Użytkownik musi mieć możliwość założenia konta.
- Kryteria akceptacji:
  1. Użytkownik może się zarejestrować podając minimalne dane (np. email, hasło).
  2. Użytkownik musi potwierdzić swój adres email.

### US-001b: Logowanie użytkownika
- ID: US-001b
- Tytuł: Logowanie
- Opis: Użytkownik musi mieć zalogowania się.
- Kryteria akceptacji:
  1. Użytkownik po potwierdzeniu swojego adresu email może się zalogować korzystając z adresu email oraz hasła.

### US-002: Generowanie fiszek przez AI
- ID: US-002
- Tytuł: Generowanie fiszek przez AI
- Opis: Użytkownik wkleja tekst do interfejsu, a system wykorzystuje AI do wygenerowania propozycji fiszek. Propozycje są prezentowane użytkownikowi do akceptacji, odrzucenia lub edycji.
- Kryteria akceptacji:
  1. Użytkownik musi być zalogowany
  2. Po wklejeniu tekstu, AI generuje propozycje fiszek w czasie 30-40 sekund.
  3. Wygenerowane fiszki są wyświetlane użytkownikowi z możliwością akceptacji, odrzucenia lub edycji.
  4. Interakcje z AI są logowane z odpowiednimi metadanymi.

### US-003: Przeglądanie i zarządzanie fiszkami
- ID: US-003
- Tytuł: Przeglądanie i zarządzanie fiszkami
- Opis: Użytkownik może przeglądać wszystkie fiszki, edytować wybrane fiszki oraz je usuwać.
- Kryteria akceptacji:
  1. Zalogowany użytkownik widzi listę fiszek w swoim koncie.
  2. Użytkownik ma możliwość edycji treści fiszki (zarówno front, jak i back).
  3. Użytkownik może usunąć fiszkę

### US-004: Ręczne tworzenie fiszek
- ID: US-004
- Tytuł: Ręczne tworzenie fiszek
- Opis: Użytkownik ma możliwość samodzielnego tworzenia fiszek poprzez wprowadzenie treści obu stron (front i back) oraz zapisanie ich w systemie.
- Kryteria akceptacji:
  1. Zalogowany użytkownik może utworzyć nową fiszkę poprzez wypełnienie pól dla obu stron.
  2. Fiszki są przechowywane w bazie danych z odpowiednim markerem wskazującym na manualne utworzenie.

### US-005: Edycja i usuwanie fiszek
- ID: US-005
- Tytuł: Edycja i usuwanie fiszek
- Opis: Użytkownik ma możliwość wprowadzania zmian w treści fiszek oraz ich usunięcia.
- Kryteria akceptacji:
  1. Zalogowany użytkownik może wybrać fiszkę do edycji i dokonać zmian w treści.
  2. Użytkownik może usunąć fiszkę, a system potwierdza wykonanie operacji.

## 6. Metryki sukcesu
1. Akceptacja fiszek generowanych przez AI:
   - Minimum 75% fiszek wygenerowanych przez AI musi być zatwierdzonych przez użytkownika.

2. Udział AI w tworzeniu fiszek:
   - Użytkownicy powinni tworzyć co najmniej 75% fiszek przy wykorzystaniu funkcji generowania przez AI.

3. Wydajność systemu:
   - AI musi generować propozycje fiszek w czasie 30-40 sekund, co jest krytyczne dla akceptacji użytkowników.

4. Logowanie integracji z LLM:
   - System musi rejestrować wszystkie interakcje z LLM zawierając: czas zapytania, czas odpowiedzi, liczbę tokenów, unikalny identyfikator oraz informacje o błędach.
