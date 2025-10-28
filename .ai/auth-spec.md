# Specyfikacja techniczna systemu uwierzytelniania - 10xCards

## 1. ARCHITEKTURA INTERFEJSU UŻYTKOWNIKA

### 1.1. Struktura stron i komponentów

#### 1.1.1. Nowe strony Astro (SSR)

**`/src/pages/auth/register.astro`**
- **Odpowiedzialność**: Strona rejestracji nowego użytkownika
- **Tryb renderowania**: Server-side rendering (SSR) - prerender: false
- **Struktura**:
  - Używa layoutu `Layout.astro`
  - Renderuje komponent React `RegisterForm` z dyrektywą `client:load`
  - Po stronie serwera sprawdza czy użytkownik jest już zalogowany (poprzez session z cookies)
  - Jeśli użytkownik jest zalogowany - przekierowanie do `/` (strona główna)
- **Integracja z backendem**: Pobiera session z `Astro.cookies` i weryfikuje przez `supabase.auth.getSession()`
- **Nawigacja**: Link do strony logowania (`/auth/login`)

**`/src/pages/auth/login.astro`**
- **Odpowiedzialność**: Strona logowania użytkownika
- **Tryb renderowania**: Server-side rendering (SSR) - prerender: false
- **Struktura**:
  - Używa layoutu `Layout.astro`
  - Renderuje komponent React `LoginForm` z dyrektywą `client:load`
  - Po stronie serwera sprawdza czy użytkownik jest już zalogowany
  - Jeśli użytkownik jest zalogowany - przekierowanie do `/`
- **Integracja z backendem**: Pobiera session z `Astro.cookies` i weryfikuje przez `supabase.auth.getSession()`
- **Nawigacja**: Linki do strony rejestracji (`/auth/register`) i odzyskiwania hasła (`/auth/recover-password`)

**`/src/pages/auth/recover-password.astro`**
- **Odpowiedzialność**: Strona inicjująca proces odzyskiwania hasła
- **Tryb renderowania**: Server-side rendering (SSR) - prerender: false
- **Struktura**:
  - Używa layoutu `Layout.astro`
  - Renderuje komponent React `RecoverPasswordForm` z dyrektywą `client:load`
  - Po stronie serwera sprawdza czy użytkownik jest już zalogowany
  - Jeśli użytkownik jest zalogowany - przekierowanie do `/`
- **Integracja z backendem**: Wysyła email z linkiem resetującym przez API Supabase Auth
- **Nawigacja**: Link do strony logowania (`/auth/login`)

**`/src/pages/auth/reset-password.astro`**
- **Odpowiedzialność**: Strona ustawiania nowego hasła (docelowa dla linku z emaila)
- **Tryb renderowania**: Server-side rendering (SSR) - prerender: false
- **Struktura**:
  - Używa layoutu `Layout.astro`
  - Renderuje komponent React `ResetPasswordForm` z dyrektywą `client:load`
  - Po stronie serwera waliduje token z URL (parametry query)
  - Jeśli token jest nieprawidłowy - pokazuje błąd lub przekierowuje do `/auth/recover-password`
- **Integracja z backendem**: Weryfikuje token i aktualizuje hasło przez API Supabase Auth
- **Nawigacja**: Po sukcesie przekierowanie do `/auth/login`

**`/src/pages/auth/confirm-email.astro`**
- **Odpowiedzialność**: Strona potwierdzenia adresu email (docelowa dla linku z emaila po rejestracji)
- **Tryb renderowania**: Server-side rendering (SSR) - prerender: false
- **Struktura**:
  - Używa layoutu `Layout.astro`
  - Po stronie serwera waliduje token z URL
  - Automatycznie potwierdza email przez API Supabase Auth
  - Wyświetla komunikat o sukcesie lub błędzie (komponent Astro statyczny)
- **Integracja z backendem**: Weryfikuje token przez `supabase.auth.verifyOtp()`
- **Nawigacja**: Link do strony logowania po potwierdzeniu

#### 1.1.2. Nowe komponenty React (interaktywne)

**`/src/components/auth/RegisterForm.tsx`**
- **Odpowiedzialność**: Formularz rejestracji z walidacją i obsługą błędów
- **Stan lokalny**:
  - `email: string` - adres email użytkownika
  - `password: string` - hasło użytkownika
  - `confirmPassword: string` - potwierdzenie hasła
  - `isLoading: boolean` - stan ładowania podczas wysyłania formularza
  - `errors: Record<string, string>` - błędy walidacji dla poszczególnych pól
  - `generalError: string | null` - ogólny błąd operacji (np. email już istnieje)
  - `successMessage: string | null` - komunikat sukcesu (email wysłany)
- **Walidacja front-end** (przed wysłaniem):
  - Email: format email, wymagane pole
  - Hasło: min. 6 znaków (zgodnie z konfiguracją Supabase), wymagane pole
  - Potwierdzenie hasła: musi być identyczne z hasłem, wymagane pole
- **Logika wysyłania**:
  - Wywołanie `POST /api/auth/register` z danymi: `{ email, password }`
  - Obsługa odpowiedzi:
    - Sukces (201): Pokazanie komunikatu o wysłaniu emaila potwierdzającego
    - Błąd (400): Walidacja niepoprawna - wyświetlenie błędów z backendu
    - Błąd (409): Email już istnieje - wyświetlenie komunikatu
    - Błąd (500): Błąd serwera - wyświetlenie ogólnego komunikatu
- **Komponenty UI**: Input (Shadcn), Button (Shadcn), Alert (Shadcn)
- **Accessibility**: 
  - Wszystkie pola z labelami
  - aria-invalid i aria-describedby dla pól z błędami
  - role="alert" dla komunikatów błędów
  - Automatyczny focus na pierwszym polu z błędem

**`/src/components/auth/LoginForm.tsx`**
- **Odpowiedzialność**: Formularz logowania z walidacją i obsługą błędów
- **Stan lokalny**:
  - `email: string` - adres email użytkownika
  - `password: string` - hasło użytkownika
  - `isLoading: boolean` - stan ładowania podczas wysyłania formularza
  - `errors: Record<string, string>` - błędy walidacji dla poszczególnych pól
  - `generalError: string | null` - ogólny błąd operacji (niepoprawne dane)
- **Walidacja front-end**:
  - Email: format email, wymagane pole
  - Hasło: wymagane pole
- **Logika wysyłania**:
  - Wywołanie `POST /api/auth/login` z danymi: `{ email, password }`
  - Obsługa odpowiedzi:
    - Sukces (200): Przekierowanie do `/` (lub do URL z parametru `redirect`)
    - Błąd (400): Walidacja niepoprawna - wyświetlenie błędów
    - Błąd (401): Niepoprawne dane logowania - wyświetlenie komunikatu
    - Błąd (403): Email niepotwierdzony - wyświetlenie komunikatu z opcją ponownego wysłania emaila
    - Błąd (500): Błąd serwera - wyświetlenie ogólnego komunikatu
- **Komponenty UI**: Input (Shadcn), Button (Shadcn), Alert (Shadcn)
- **Accessibility**: Podobnie jak w RegisterForm

**`/src/components/auth/RecoverPasswordForm.tsx`**
- **Odpowiedzialność**: Formularz inicjujący proces odzyskiwania hasła
- **Stan lokalny**:
  - `email: string` - adres email użytkownika
  - `isLoading: boolean` - stan ładowania
  - `errors: Record<string, string>` - błędy walidacji
  - `successMessage: string | null` - komunikat sukcesu (email wysłany)
- **Walidacja front-end**:
  - Email: format email, wymagane pole
- **Logika wysyłania**:
  - Wywołanie `POST /api/auth/recover-password` z danymi: `{ email }`
  - Obsługa odpowiedzi:
    - Sukces (200): Pokazanie komunikatu o wysłaniu emaila z instrukcjami
    - Błąd (400): Walidacja niepoprawna
    - Błąd (404): Email nie istnieje - z powodów bezpieczeństwa pokazujemy taki sam komunikat jak przy sukcesie
    - Błąd (500): Błąd serwera
- **Komponenty UI**: Input (Shadcn), Button (Shadcn), Alert (Shadcn)
- **Accessibility**: Podobnie jak w RegisterForm

**`/src/components/auth/ResetPasswordForm.tsx`**
- **Odpowiedzialność**: Formularz ustawiania nowego hasła
- **Props**: 
  - `token: string` - token weryfikacyjny z URL
- **Stan lokalny**:
  - `password: string` - nowe hasło
  - `confirmPassword: string` - potwierdzenie nowego hasła
  - `isLoading: boolean` - stan ładowania
  - `errors: Record<string, string>` - błędy walidacji
  - `generalError: string | null` - ogólny błąd operacji
  - `successMessage: string | null` - komunikat sukcesu
- **Walidacja front-end**:
  - Hasło: min. 6 znaków, wymagane pole
  - Potwierdzenie hasła: musi być identyczne z hasłem, wymagane pole
- **Logika wysyłania**:
  - Wywołanie `POST /api/auth/reset-password` z danymi: `{ token, password }`
  - Obsługa odpowiedzi:
    - Sukces (200): Pokazanie komunikatu i przekierowanie do `/auth/login` po 3 sekundach
    - Błąd (400): Walidacja niepoprawna lub token wygasł
    - Błąd (500): Błąd serwera
- **Komponenty UI**: Input (Shadcn), Button (Shadcn), Alert (Shadcn)
- **Accessibility**: Podobnie jak w RegisterForm

**`/src/components/auth/UserMenu.tsx`**
- **Odpowiedzialność**: Menu użytkownika wyświetlane w headerze dla zalogowanych użytkowników
- **Props**:
  - `user: { email: string, id: string }` - dane zalogowanego użytkownika
- **Stan lokalny**:
  - `isOpen: boolean` - czy menu jest rozwinięte
  - `isLoggingOut: boolean` - stan podczas wylogowywania
- **Funkcjonalność**:
  - Wyświetla email użytkownika
  - Dropdown z opcjami:
    - Moje fiszki (link do `/flashcards`)
    - Generuj fiszki AI (link do `/flashcards/ai-generation`)
    - Ustawienia (link do `/settings` - przyszła funkcjonalność)
    - Wyloguj się (akcja)
- **Logika wylogowania**:
  - Wywołanie `POST /api/auth/logout`
  - Po sukcesie: przekierowanie do `/auth/login`
  - Błąd: wyświetlenie komunikatu toast
- **Komponenty UI**: DropdownMenu (Shadcn), Button (Shadcn)
- **Accessibility**: 
  - aria-expanded dla dropdown
  - aria-label dla przycisków
  - Obsługa klawiatury (Enter, Space, Escape, strzałki)

#### 1.1.3. Rozszerzenie istniejących komponentów

**`/src/layouts/Layout.astro` - modyfikacje**
- **Nowe funkcjonalności**:
  - Po stronie serwera pobiera session użytkownika z `Astro.cookies`
  - Weryfikuje session przez `supabase.auth.getSession()`
  - Przekazuje dane użytkownika do headera
- **Modyfikacje headera**:
  - Jeśli użytkownik zalogowany: wyświetla `UserMenu` (React, client:load)
  - Jeśli użytkownik niezalogowany: wyświetla przyciski "Zaloguj się" i "Zarejestruj się"
  - Zachowuje istniejący `ThemeToggle`
- **Struktura nawigacji** (dla zalogowanych):
  - Logo/nazwa aplikacji (link do `/`)
  - Link "Generuj fiszki" (do `/flashcards/ai-generation`)
  - UserMenu (po prawej stronie)
  - ThemeToggle (po prawej stronie)

**Istniejące strony wymagające zabezpieczenia uwierzytelnianiem:**

**`/src/pages/flashcards/ai-generation.astro` - modyfikacje**
- **Nowa logika SSR** (na początku strony):
  - Sprawdza czy użytkownik jest zalogowany (session z cookies)
  - Jeśli NIE jest zalogowany: przekierowanie do `/auth/login?redirect=/flashcards/ai-generation`
  - Jeśli jest zalogowany: renderuje stronę normalnie
- **Bez zmian w komponencie**: `AIGenerationView` pozostaje bez zmian

**`/src/pages/index.astro` - modyfikacje**
- **Nowa logika SSR**:
  - Sprawdza czy użytkownik jest zalogowany
  - Jeśli jest zalogowany: pokazuje spersonalizowany widok z listą fiszek lub przekierowanie do `/flashcards`
  - Jeśli NIE jest zalogowany: pokazuje widok powitalny z przyciskami CTA (Zarejestruj się / Zaloguj się)
- **Komponent Welcome.astro** - zostaje rozszerzony o przyciski CTA kierujące do rejestracji/logowania

### 1.2. Walidacja i komunikaty o błędach

#### 1.2.1. Walidacja front-end

**Rejestracja:**
- Email:
  - Wymagane: "Email address is required"
  - Format: "Invalid email address format"
- Hasło:
  - Wymagane: "Password is required"
  - Min. długość: "Password must be at least 6 characters long"
- Potwierdzenie hasła:
  - Wymagane: "Password confirmation is required"
  - Zgodność: "Passwords must match"

**Logowanie:**
- Email:
  - Wymagane: "Email address is required"
  - Format: "Invalid email address format"
- Hasło:
  - Wymagane: "Password is required"

**Odzyskiwanie hasła:**
- Email:
  - Wymagane: "Email address is required"
  - Format: "Invalid email address format"

**Resetowanie hasła:**
- Hasło:
  - Wymagane: "Password is required"
  - Min. długość: "Password must be at least 6 characters long"
- Potwierdzenie hasła:
  - Wymagane: "Password confirmation is required"
  - Zgodność: "Passwords must match"

#### 1.2.2. Komunikaty błędów z backendu

**Rejestracja:**
- 400: "The data is invalid. Please check the form and try again."
- 409: "This email address is already registered. Please log in or use a different email."
- 500: "A server error occurred. Please try again later."

**Logowanie:**
- 400: "The data is invalid. Please check the form and try again."
- 401: "Invalid email or password."
- 403: "Your account has not been confirmed yet. Please check your email inbox."
- 500: "A server error occurred. Please try again later."

**Odzyskiwanie hasła:**
- 400: "The email address is invalid."
- 200/404: "If the provided email address exists in our system, we will send password reset instructions to it." (for security reasons)
- 500: "An error occurred while sending the email. Please try again later."

**Resetowanie hasła:**
- 400 (walidacja): "The password is invalid. It must be at least 6 characters long."
- 400 (token): "The password reset link is invalid or has expired. Please request a new link."
- 500: "A server error occurred. Please try again later."

#### 1.2.3. Komunikaty sukcesu

**Rejestracja:**
- "Account created successfully! Please check your email inbox and confirm your address to log in."

**Logowanie:**
- No message - direct redirect

**Potwierdzenie email:**
- "Your email address has been confirmed. You can now log in."

**Odzyskiwanie hasła:**
- "If the provided email address exists in our system, we will send password reset instructions to it."

**Resetowanie hasła:**
- "Password has been changed successfully. We will redirect you to the login page shortly."

**Wylogowanie:**
- Toast: "You have been logged out."

### 1.3. Scenariusze użytkownika

#### 1.3.1. Scenariusz: Rejestracja nowego użytkownika

1. Użytkownik wchodzi na stronę główną (`/`)
2. Widzi widok powitalny z przyciskiem "Zarejestruj się"
3. Klika "Zarejestruj się" - przekierowanie do `/auth/register`
4. Wypełnia formularz: email, hasło, potwierdzenie hasła
5. Walidacja front-end w czasie rzeczywistym (onBlur + onSubmit)
6. Klika "Zarejestruj się"
7. Formularz wysyła request do `POST /api/auth/register`
8. Backend:
   - Waliduje dane (Zod schema)
   - Tworzy użytkownika w Supabase Auth
   - Wysyła email potwierdzający
   - Tworzy rekord w tabeli `users` (po otrzymaniu webhook od Supabase Auth)
9. Frontend otrzymuje sukces (201)
10. Wyświetla komunikat: "Please check your email inbox..."
11. Użytkownik otwiera email i klika link potwierdzający
12. Link prowadzi do `/auth/confirm-email?token=...`
13. Backend weryfikuje token i aktywuje konto
14. Użytkownik widzi komunikat sukcesu i link do logowania

#### 1.3.2. Scenariusz: Logowanie użytkownika

1. Użytkownik wchodzi na `/auth/login` (lub jest przekierowany z chronionej strony)
2. Wypełnia formularz: email, hasło
3. Klika "Zaloguj się"
4. Formularz wysyła request do `POST /api/auth/login`
5. Backend:
   - Waliduje dane
   - Weryfikuje credentials przez Supabase Auth
   - Tworzy session
   - Ustawia ciasteczka (access_token, refresh_token)
6. Frontend otrzymuje sukces (200)
7. Przekierowanie do strony docelowej (parametr `redirect` lub `/`)
8. Header pokazuje UserMenu z emailem użytkownika

#### 1.3.3. Scenariusz: Dostęp do chronionej strony (niezalogowany)

1. Użytkownik niezalogowany próbuje wejść na `/flashcards/ai-generation`
2. SSR sprawdza session - użytkownik nie jest zalogowany
3. Przekierowanie do `/auth/login?redirect=/flashcards/ai-generation`
4. Użytkownik loguje się
5. Po sukcesie - automatyczne przekierowanie do `/flashcards/ai-generation`

#### 1.3.4. Scenariusz: Odzyskiwanie hasła

1. Użytkownik na stronie logowania klika "Nie pamiętasz hasła?"
2. Przekierowanie do `/auth/recover-password`
3. Wpisuje email i klika "Wyślij instrukcje"
4. Request do `POST /api/auth/recover-password`
5. Backend wysyła email z linkiem (niezależnie czy email istnieje - bezpieczeństwo)
6. Frontend pokazuje komunikat sukcesu: "If the email exists, we will send instructions..."
7. Użytkownik otwiera email i klika link
8. Link prowadzi do `/auth/reset-password?token=...`
9. Użytkownik wpisuje nowe hasło i potwierdza
10. Request do `POST /api/auth/reset-password`
11. Backend weryfikuje token i aktualizuje hasło
12. Frontend pokazuje sukces i przekierowuje do logowania

#### 1.3.5. Scenariusz: Wylogowanie użytkownika

1. Zalogowany użytkownik klika na UserMenu w headerze
2. Z dropdown wybiera "Wyloguj się"
3. Request do `POST /api/auth/logout`
4. Backend usuwa session
5. Frontend czyści ciasteczka i localStorage
6. Przekierowanie do `/auth/login`
7. Wyświetlenie toast: "You have been logged out"

## 2. LOGIKA BACKENDOWA

### 2.1. Struktura endpointów API

#### 2.1.1. POST /api/auth/register

**Plik**: `/src/pages/api/auth/register.ts`

**Odpowiedzialność**: Rejestracja nowego użytkownika

**Metoda**: POST

**Typ**: APIRoute z `export const prerender = false`

**Request Body**:
```typescript
{
  email: string;      // Format email, wymagane
  password: string;   // Min. 6 znaków, wymagane
}
```

**Walidacja** (Zod schema):
```typescript
const registerSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});
```

**Logika**:
1. Parsowanie request body (JSON)
2. Walidacja przez Zod schema
3. Wywołanie serwisu `authService.registerUser(supabase, { email, password })`
4. Obsługa błędów:
   - `AuthServiceError` z kodem `USER_ALREADY_EXISTS` → 409 Conflict
   - `AuthServiceError` z kodem `WEAK_PASSWORD` → 400 Bad Request
   - `AuthServiceError` z kodem `EMAIL_SEND_FAILED` → 500 Internal Server Error
   - Inne błędy → 500 Internal Server Error

**Response sukces (201 Created)**:
```typescript
{
  message: "Registration successful. Please check your email to confirm your account.",
  user: {
    id: string;
    email: string;
  }
}
```

**Response błąd**:
```typescript
{
  error: string;           // Opis błędu
  code?: string;           // Kod błędu (opcjonalnie)
  details?: string[];      // Szczegóły walidacji (opcjonalnie)
}
```

#### 2.1.2. POST /api/auth/login

**Plik**: `/src/pages/api/auth/login.ts`

**Odpowiedzialność**: Logowanie użytkownika

**Metoda**: POST

**Request Body**:
```typescript
{
  email: string;
  password: string;
}
```

**Walidacja** (Zod schema):
```typescript
const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});
```

**Logika**:
1. Parsowanie request body
2. Walidacja przez Zod schema
3. Wywołanie serwisu `authService.loginUser(supabase, { email, password })`
4. Ustawienie ciasteczek sesji:
   - `sb-access-token` (httpOnly, secure, sameSite: lax)
   - `sb-refresh-token` (httpOnly, secure, sameSite: lax)
5. Obsługa błędów:
   - `AuthServiceError` z kodem `INVALID_CREDENTIALS` → 401 Unauthorized
   - `AuthServiceError` z kodem `EMAIL_NOT_CONFIRMED` → 403 Forbidden
   - Inne błędy → 500 Internal Server Error

**Response sukces (200 OK)**:
```typescript
{
  message: "Login successful",
  user: {
    id: string;
    email: string;
    role: string;
  }
}
```

**Ustawiane cookies**:
- `sb-access-token`: JWT token (expires: za 1 godzinę)
- `sb-refresh-token`: refresh token (expires: za 7 dni)

**Response błąd**: Jak w `/register`

#### 2.1.3. POST /api/auth/logout

**Plik**: `/src/pages/api/auth/logout.ts`

**Odpowiedzialność**: Wylogowanie użytkownika

**Metoda**: POST

**Request Body**: Brak (opcjonalnie pusty JSON)

**Wymagana autentykacja**: Tak (sprawdza obecność session)

**Logika**:
1. Pobiera session z ciasteczek przez `getSessionFromCookies(request)`
2. Jeśli brak session → 401 Unauthorized
3. Wywołanie `authService.logoutUser(supabase, session.access_token)`
4. Usunięcie ciasteczek:
   - `sb-access-token` (set z expired date)
   - `sb-refresh-token` (set z expired date)

**Response sukces (200 OK)**:
```typescript
{
  message: "Logout successful"
}
```

#### 2.1.4. POST /api/auth/recover-password

**Plik**: `/src/pages/api/auth/recover-password.ts`

**Odpowiedzialność**: Inicjowanie procesu odzyskiwania hasła

**Metoda**: POST

**Request Body**:
```typescript
{
  email: string;
}
```

**Walidacja** (Zod schema):
```typescript
const recoverPasswordSchema = z.object({
  email: z.string().email("Invalid email format"),
});
```

**Logika**:
1. Parsowanie request body
2. Walidacja przez Zod schema
3. Wywołanie `authService.recoverPassword(supabase, { email, redirectTo: "https://domain.com/auth/reset-password" })`
4. Z powodów bezpieczeństwa ZAWSZE zwraca sukces (nawet jeśli email nie istnieje)

**Response sukces (200 OK)**:
```typescript
{
  message: "If the email exists, password recovery instructions have been sent."
}
```

**Note**: Backend (Supabase) wysyła email z linkiem zawierającym token

#### 2.1.5. POST /api/auth/reset-password

**Plik**: `/src/pages/api/auth/reset-password.ts`

**Odpowiedzialność**: Ustawienie nowego hasła

**Metoda**: POST

**Request Body**:
```typescript
{
  token: string;        // Token z linku w emailu
  password: string;     // Nowe hasło
}
```

**Walidacja** (Zod schema):
```typescript
const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});
```

**Logika**:
1. Parsowanie request body
2. Walidacja przez Zod schema
3. Wywołanie `authService.resetPassword(supabase, { token, password })`
4. Obsługa błędów:
   - `AuthServiceError` z kodem `INVALID_TOKEN` → 400 Bad Request
   - `AuthServiceError` z kodem `TOKEN_EXPIRED` → 400 Bad Request
   - Inne błędy → 500 Internal Server Error

**Response sukces (200 OK)**:
```typescript
{
  message: "Password has been reset successfully"
}
```

#### 2.1.6. GET /api/auth/session (opcjonalny, do rozważenia)

**Plik**: `/src/pages/api/auth/session.ts`

**Odpowiedzialność**: Sprawdzenie aktualnej sesji użytkownika (dla client-side)

**Metoda**: GET

**Wymagana autentykacja**: Opcjonalna

**Logika**:
1. Pobiera session z ciasteczek
2. Jeśli brak session → zwraca `{ user: null }`
3. Jeśli jest session → zwraca dane użytkownika

**Response sukces (200 OK)**:
```typescript
{
  user: {
    id: string;
    email: string;
    role: string;
  } | null
}
```

### 2.2. Modele danych i typy

#### 2.2.1. Istniejące typy w `/src/types.ts` - użycie

Aplikacja już posiada zdefiniowane typy uwierzytelniania:
- `RegisterUserCommand` - do użycia w serwisie
- `LoginUserCommand` - do użycia w serwisie
- `UserDTO` - do zwracania danych użytkownika
- `AuthResponseDTO` - opcjonalnie do zwracania pełnej odpowiedzi (obecnie nie używany zgodnie z API Plan)

#### 2.2.2. Nowe typy do dodania w `/src/types.ts`

```typescript
/* ====================== Auth Commands & DTOs - rozszerzenie ====================== */

/**
 * Command Model for password recovery.
 */
export interface RecoverPasswordCommand {
  email: string;
  redirectTo: string; // URL to reset password page
}

/**
 * Command Model for resetting password.
 */
export interface ResetPasswordCommand {
  token: string;
  password: string;
}

/**
 * DTO for logout response.
 */
export interface LogoutResponseDTO {
  message: string;
}

/**
 * DTO for password recovery response.
 */
export interface RecoverPasswordResponseDTO {
  message: string;
}

/**
 * DTO for password reset response.
 */
export interface ResetPasswordResponseDTO {
  message: string;
}

/**
 * DTO for registration response.
 */
export interface RegisterResponseDTO {
  message: string;
  user: Pick<UserDTO, "id" | "email">;
}

/**
 * DTO for login response.
 */
export interface LoginResponseDTO {
  message: string;
  user: UserDTO;
}

/**
 * DTO for session data.
 */
export interface SessionDTO {
  user: UserDTO | null;
}
```

### 2.3. Warstwy serwisowa - authService

#### 2.3.1. Struktura pliku `/src/lib/services/authService.ts`

```typescript
import type { SupabaseClient } from "@/db/supabase.client";
import type { 
  RegisterUserCommand, 
  LoginUserCommand,
  RecoverPasswordCommand,
  ResetPasswordCommand,
  UserDTO,
  RegisterResponseDTO,
  LoginResponseDTO 
} from "@/types";

/**
 * Custom error class for authentication service errors
 */
export class AuthServiceError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly originalError?: unknown
  ) {
    super(message);
    this.name = "AuthServiceError";
  }
}

/**
 * Error codes:
 * - USER_ALREADY_EXISTS: Email already registered
 * - WEAK_PASSWORD: Password does not meet requirements
 * - EMAIL_SEND_FAILED: Failed to send email
 * - INVALID_CREDENTIALS: Invalid login credentials
 * - EMAIL_NOT_CONFIRMED: Email has not been confirmed
 * - INVALID_TOKEN: Token is invalid
 * - TOKEN_EXPIRED: Token has expired
 * - AUTH_ERROR: General Supabase Auth error
 * - DATABASE_ERROR: Database error
 */
```

#### 2.3.2. Funkcja `registerUser`

```typescript
/**
 * Rejestruje nowego użytkownika w systemie.
 * 
 * Proces:
 * 1. Tworzy użytkownika w Supabase Auth (auth.users)
 * 2. Supabase automatycznie wysyła email potwierdzający
 * 3. Webhook Supabase (po potwierdzeniu) tworzy rekord w tabeli users
 * 
 * @param supabase - Klient Supabase
 * @param command - Dane rejestracji (email, password)
 * @returns Promise z danymi utworzonego użytkownika
 * @throws AuthServiceError
 */
export async function registerUser(
  supabase: SupabaseClient,
  command: RegisterUserCommand
): Promise<RegisterResponseDTO>
```

**Implementacja**:
1. Wywołanie `supabase.auth.signUp({ email, password, options: { emailRedirectTo } })`
2. Obsługa błędów Supabase:
   - Sprawdzenie `error.message` dla user already exists → `USER_ALREADY_EXISTS`
   - Sprawdzenie dla weak password → `WEAK_PASSWORD`
   - Inne błędy → `AUTH_ERROR`
3. Zwrócenie danych użytkownika (id, email) bez session (wymaga potwierdzenia email)

**Note**: Tabela `users` jest wypełniana przez database trigger lub webhook po potwierdzeniu emaila

#### 2.3.3. Funkcja `loginUser`

```typescript
/**
 * Loguje użytkownika do systemu.
 * 
 * @param supabase - Klient Supabase
 * @param command - Dane logowania (email, password)
 * @returns Promise z danymi zalogowanego użytkownika i session
 * @throws AuthServiceError
 */
export async function loginUser(
  supabase: SupabaseClient,
  command: LoginUserCommand
): Promise<LoginResponseDTO & { session: Session }>
```

**Implementacja**:
1. Wywołanie `supabase.auth.signInWithPassword({ email, password })`
2. Obsługa błędów:
   - Invalid credentials → `INVALID_CREDENTIALS`
   - Email not confirmed → `EMAIL_NOT_CONFIRMED`
   - Inne błędy → `AUTH_ERROR`
3. Pobranie danych użytkownika z tabeli `users` (łącznie z rolą)
4. Zwrócenie: user (UserDTO), session

#### 2.3.4. Funkcja `logoutUser`

```typescript
/**
 * Wylogowuje użytkownika z systemu.
 * 
 * @param supabase - Klient Supabase
 * @param accessToken - Token dostępu użytkownika
 * @throws AuthServiceError
 */
export async function logoutUser(
  supabase: SupabaseClient,
  accessToken: string
): Promise<void>
```

**Implementacja**:
1. Wywołanie `supabase.auth.signOut()` z odpowiednim scope
2. Obsługa błędów → `AUTH_ERROR`

#### 2.3.5. Funkcja `recoverPassword`

```typescript
/**
 * Inicjuje proces odzyskiwania hasła.
 * 
 * @param supabase - Klient Supabase
 * @param command - Email użytkownika i URL przekierowania
 * @throws AuthServiceError
 */
export async function recoverPassword(
  supabase: SupabaseClient,
  command: RecoverPasswordCommand
): Promise<void>
```

**Implementacja**:
1. Wywołanie `supabase.auth.resetPasswordForEmail(email, { redirectTo })`
2. Supabase automatycznie wysyła email z linkiem
3. Obsługa błędów → `EMAIL_SEND_FAILED`
4. Nie ujawnia czy email istnieje (zawsze sukces)

#### 2.3.6. Funkcja `resetPassword`

```typescript
/**
 * Resetuje hasło użytkownika na podstawie tokenu.
 * 
 * @param supabase - Klient Supabase
 * @param command - Token i nowe hasło
 * @throws AuthServiceError
 */
export async function resetPassword(
  supabase: SupabaseClient,
  command: ResetPasswordCommand
): Promise<void>
```

**Implementacja**:
1. Weryfikacja tokenu przez `supabase.auth.verifyOtp({ token_hash: token, type: 'recovery' })`
2. Jeśli token poprawny → `supabase.auth.updateUser({ password: newPassword })`
3. Obsługa błędów:
   - Invalid token → `INVALID_TOKEN`
   - Expired token → `TOKEN_EXPIRED`
   - Inne błędy → `AUTH_ERROR`

#### 2.3.7. Funkcja pomocnicza `getUserFromSession`

```typescript
/**
 * Pobiera pełne dane użytkownika na podstawie session.
 * 
 * @param supabase - Klient Supabase
 * @param userId - ID użytkownika z auth.users
 * @returns Promise z danymi użytkownika (UserDTO)
 * @throws AuthServiceError
 */
export async function getUserFromSession(
  supabase: SupabaseClient,
  userId: string
): Promise<UserDTO>
```

**Implementacja**:
1. Query do tabeli `users` z join do `roles`:
```typescript
const { data, error } = await supabase
  .from('users')
  .select('id, email, roles(name)')
  .eq('id', userId)
  .single();
```
2. Transformacja do UserDTO
3. Obsługa błędów → `DATABASE_ERROR`

### 2.4. Walidacja danych wejściowych

Wszystkie endpointy API używają **Zod** do walidacji request body zgodnie z obecną praktyką w projekcie (patrz: `/src/pages/api/flashcards/index.ts`).

**Przykładowe schematy walidacji** (w plikach endpointów):

```typescript
// /src/pages/api/auth/register.ts
const registerSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

// /src/pages/api/auth/login.ts
const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

// /src/pages/api/auth/recover-password.ts
const recoverPasswordSchema = z.object({
  email: z.string().email("Invalid email format"),
});

// /src/pages/api/auth/reset-password.ts
const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});
```

**Proces walidacji** (identyczny jak w istniejących endpointach):
1. Parsowanie JSON: `await request.json()` z obsługą błędów
2. Walidacja: `schema.safeParse(body)`
3. W przypadku błędu: response 400 z szczegółami błędów
4. W przypadku sukcesu: kontynuacja z `validatedData`

### 2.5. Obsługa wyjątków

Wszystkie endpointy używają jednolitego wzorca obsługi błędów zgodnego z istniejącymi endpointami (patrz: `/src/pages/api/flashcards/index.ts`):

```typescript
try {
  // ... logika endpointu
} catch (error) {
  console.error("Unexpected error in [nazwa endpointu]:", error);

  // Obsługa AuthServiceError z mapowaniem kodów
  if (error instanceof AuthServiceError) {
    const statusCodeMap: Record<string, number> = {
      USER_ALREADY_EXISTS: 409,
      INVALID_CREDENTIALS: 401,
      EMAIL_NOT_CONFIRMED: 403,
      WEAK_PASSWORD: 400,
      INVALID_TOKEN: 400,
      TOKEN_EXPIRED: 400,
      EMAIL_SEND_FAILED: 500,
      AUTH_ERROR: 500,
      DATABASE_ERROR: 500,
    };

    const statusCode = statusCodeMap[error.code] || 500;

    return new Response(
      JSON.stringify({
        error: error.message,
        code: error.code,
      }),
      {
        status: statusCode,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  // Obsługa ogólnych błędów
  if (error instanceof Error) {
    return new Response(
      JSON.stringify({
        error: "Operation failed",
        message: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  // Fallback dla nieznanych błędów
  return new Response(
    JSON.stringify({
      error: "Internal server error",
      message: "An unexpected error occurred",
    }),
    {
      status: 500,
      headers: { "Content-Type": "application/json" },
    }
  );
}
```

### 2.6. Server-side rendering i ochrona tras

#### 2.6.1. Modyfikacja middleware `/src/middleware/index.ts`

**Obecna funkcjonalność**: Dodaje `supabaseClient` do `context.locals`

**Rozszerzenie funkcjonalności**:
1. Pobiera session z ciasteczek
2. Weryfikuje session przez Supabase
3. Jeśli session jest ważna - pobiera dane użytkownika
4. Dodaje dane użytkownika do `context.locals.user`
5. Odświeża token jeśli to konieczne

**Implementacja**:

```typescript
import { defineMiddleware } from "astro:middleware";
import { supabaseClient } from "../db/supabase.client.ts";
import type { UserDTO } from "../types.ts";

export const onRequest = defineMiddleware(async (context, next) => {
  // Dodaj supabase client do context (istniejąca funkcjonalność)
  context.locals.supabase = supabaseClient;

  // Pobierz tokeny z ciasteczek
  const accessToken = context.cookies.get("sb-access-token")?.value;
  const refreshToken = context.cookies.get("sb-refresh-token")?.value;

  // Jeśli brak tokenów - użytkownik niezalogowany
  if (!accessToken) {
    context.locals.user = null;
    return next();
  }

  try {
    // Weryfikuj session przez Supabase
    const { data, error } = await supabaseClient.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken || "",
    });

    if (error || !data.session) {
      // Session nieprawidłowa - usuń ciasteczka
      context.cookies.delete("sb-access-token");
      context.cookies.delete("sb-refresh-token");
      context.locals.user = null;
      return next();
    }

    // Session prawidłowa - pobierz dane użytkownika z tabeli users
    const { data: userData, error: userError } = await supabaseClient
      .from("users")
      .select("id, email, roles(name)")
      .eq("id", data.session.user.id)
      .single();

    if (userError || !userData) {
      context.locals.user = null;
      return next();
    }

    // Utwórz UserDTO
    const user: UserDTO = {
      id: userData.id,
      email: userData.email,
      role: userData.roles?.name || "user",
    };

    // Dodaj użytkownika do context
    context.locals.user = user;

    // Jeśli token został odświeżony - zaktualizuj ciasteczka
    if (data.session.access_token !== accessToken) {
      context.cookies.set("sb-access-token", data.session.access_token, {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60, // 1 godzina
      });

      if (data.session.refresh_token) {
        context.cookies.set("sb-refresh-token", data.session.refresh_token, {
          httpOnly: true,
          secure: true,
          sameSite: "lax",
          path: "/",
          maxAge: 60 * 60 * 24 * 7, // 7 dni
        });
      }
    }

  } catch (error) {
    console.error("Error in auth middleware:", error);
    context.locals.user = null;
  }

  return next();
});
```

**Aktualizacja `/src/env.d.ts`**:

```typescript
/// <reference types="astro/client" />

import type { SupabaseClient } from "./db/supabase.client.ts";
import type { UserDTO } from "./types.ts";

declare global {
  namespace App {
    interface Locals {
      supabase: SupabaseClient;
      user: UserDTO | null;  // NOWE
    }
  }
}

// ... reszta bez zmian
```

#### 2.6.2. Helper do ochrony tras

**Plik**: `/src/lib/auth-helpers.ts` (nowy)

```typescript
import type { AstroGlobal } from "astro";

/**
 * Sprawdza czy użytkownik jest zalogowany.
 * Jeśli nie - przekierowuje do strony logowania z parametrem redirect.
 * 
 * Użycie w .astro:
 * ---
 * import { requireAuth } from "@/lib/auth-helpers";
 * requireAuth(Astro);
 * ---
 */
export function requireAuth(Astro: AstroGlobal): void {
  if (!Astro.locals.user) {
    const currentPath = Astro.url.pathname;
    return Astro.redirect(`/auth/login?redirect=${encodeURIComponent(currentPath)}`);
  }
}

/**
 * Sprawdza czy użytkownik jest zalogowany i zwraca true/false.
 * Nie wykonuje przekierowania.
 * 
 * Użycie: const isAuthenticated = checkAuth(Astro);
 */
export function checkAuth(Astro: AstroGlobal): boolean {
  return Astro.locals.user !== null;
}

/**
 * Sprawdza czy użytkownik jest gościem (niezalogowany).
 * Jeśli jest zalogowany - przekierowuje do strony głównej.
 * 
 * Użycie w stronach auth (login, register):
 * ---
 * import { requireGuest } from "@/lib/auth-helpers";
 * requireGuest(Astro);
 * ---
 */
export function requireGuest(Astro: AstroGlobal): void {
  if (Astro.locals.user) {
    return Astro.redirect("/");
  }
}
```

**Przykład użycia w chronionych stronach**:

```astro
---
// /src/pages/flashcards/ai-generation.astro
import { requireAuth } from "@/lib/auth-helpers";
import Layout from "@/layouts/Layout.astro";
import AIGenerationView from "@/components/AIGenerationView";

// Sprawdź autentykację - jeśli niezalogowany, przekieruj
requireAuth(Astro);
---

<Layout title="AI Flashcards Generation">
  <AIGenerationView client:load />
</Layout>
```

**Przykład użycia w stronach auth**:

```astro
---
// /src/pages/auth/login.astro
import { requireGuest } from "@/lib/auth-helpers";
import Layout from "@/layouts/Layout.astro";
import LoginForm from "@/components/auth/LoginForm";

// Sprawdź czy użytkownik NIE jest zalogowany
requireGuest(Astro);
---

<Layout title="Logowanie">
  <LoginForm client:load />
</Layout>
```

### 2.7. Zarządzanie ciasteczkami sesji

**Ustawiane przez endpointy**:

**POST /api/auth/login** - ustawia:
```typescript
// Access token
context.cookies.set("sb-access-token", session.access_token, {
  httpOnly: true,
  secure: import.meta.env.PROD,  // true w produkcji
  sameSite: "lax",
  path: "/",
  maxAge: 60 * 60, // 1 godzina
});

// Refresh token
context.cookies.set("sb-refresh-token", session.refresh_token, {
  httpOnly: true,
  secure: import.meta.env.PROD,
  sameSite: "lax",
  path: "/",
  maxAge: 60 * 60 * 24 * 7, // 7 dni
});
```

**POST /api/auth/logout** - usuwa:
```typescript
context.cookies.delete("sb-access-token", { path: "/" });
context.cookies.delete("sb-refresh-token", { path: "/" });
```

**Middleware** - odświeża gdy potrzeba (patrz: sekcja 2.6.1)

## 3. SYSTEM UWIERZYTELNIANIA

### 3.1. Integracja z Supabase Auth

#### 3.1.1. Konfiguracja Supabase Auth

**Plik konfiguracyjny**: `/supabase/config.toml` (już istnieje)

**Ustawienia do wykorzystania**:
- `enable_signup = true` - włączone rejestracje
- `minimum_password_length = 6` - minimalna długość hasła
- `jwt_expiry = 3600` - czas ważności JWT (1 godzina)
- `enable_refresh_token_rotation = true` - rotacja refresh tokenów
- `site_url = "http://127.0.0.1:3000"` - URL aplikacji (dev)

**W produkcji trzeba zaktualizować**:
- `site_url` → URL produkcyjny
- `additional_redirect_urls` → URLe produkcyjne

#### 3.1.2. Email Templates (Supabase Dashboard)

**Supabase automatically sends emails**. They need to be configured in Dashboard:

**1. Confirmation Email (registration confirmation)**
- **Subject**: "Confirm your email address - 10xCards"
- **Template**: Contains link with token to `/auth/confirm-email`
- **Redirect URL**: `{{ .SiteURL }}/auth/confirm-email?token_hash={{ .TokenHash }}&type=signup`

**2. Password Recovery Email (password recovery)**
- **Subject**: "Password Reset - 10xCards"
- **Template**: Contains link with token to `/auth/reset-password`
- **Redirect URL**: `{{ .SiteURL }}/auth/reset-password?token_hash={{ .TokenHash }}&type=recovery`

**Configuration in Supabase Dashboard**:
1. Authentication → Email Templates
2. Edit each template with English content
3. Set redirect URLs

#### 3.1.3. Database Triggers / Webhooks

**Problem**: Po rejestracji użytkownik istnieje w `auth.users`, ale nie w `public.users`

**Rozwiązanie 1: Database Trigger (zalecane)**

**Nowa migracja**: `/supabase/migrations/[timestamp]_auth_user_trigger.sql`

```sql
-- Function do tworzenia rekordu w public.users po rejestracji
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  default_role_id integer;
BEGIN
  -- Pobierz ID domyślnej roli "user"
  SELECT id INTO default_role_id FROM public.roles WHERE name = 'user';
  
  -- Jeśli rola nie istnieje, utwórz ją
  IF default_role_id IS NULL THEN
    INSERT INTO public.roles (name) VALUES ('user') RETURNING id INTO default_role_id;
  END IF;
  
  -- Utwórz rekord w public.users
  INSERT INTO public.users (id, email, role_id)
  VALUES (NEW.id, NEW.email, default_role_id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger uruchamiany po potwierdzeniu emaila
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  WHEN (NEW.email_confirmed_at IS NOT NULL)
  EXECUTE FUNCTION public.handle_new_user();

-- Trigger dla użytkowników już potwierdzonych (update)
CREATE TRIGGER on_auth_user_confirmed
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  WHEN (OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL)
  EXECUTE FUNCTION public.handle_new_user();
```

**Rozwiązanie 2: Webhook (alternatywne)**

Jeśli preferowane są webhooks:
1. Konfiguracja w Supabase Dashboard: Database → Webhooks
2. Event: `INSERT` on `auth.users`
3. Endpoint: `https://your-domain.com/api/webhooks/auth-user-created`
4. Implementacja endpointu `/src/pages/api/webhooks/auth-user-created.ts`

**Zalecenie**: Database Trigger jest prostszy i bardziej niezawodny dla tego use case.

#### 3.1.4. Row Level Security (RLS) - aktualizacja

**Obecny stan**: RLS jest już włączone dla tabeli `flashcards` i `ai_logs`

**Problem z obecnymi polisami**: Używają `current_setting('app.current_user_id')::uuid`, co wymaga ręcznego ustawiania

**Zalecana aktualizacja polis**: Użycie funkcji Supabase `auth.uid()`

**Nowa migracja**: `/supabase/migrations/[timestamp]_update_rls_policies.sql`

```sql
-- Usuń stare polisy dla flashcards
DROP POLICY IF EXISTS flashcards_select_anon ON flashcards;
DROP POLICY IF EXISTS flashcards_select_authenticated ON flashcards;
DROP POLICY IF EXISTS flashcards_insert_policy ON flashcards;
DROP POLICY IF EXISTS flashcards_update_policy ON flashcards;
DROP POLICY IF EXISTS flashcards_delete_policy ON flashcards;

-- Nowe polisy używające auth.uid()
CREATE POLICY flashcards_select_policy ON flashcards
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY flashcards_insert_policy ON flashcards
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY flashcards_update_policy ON flashcards
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY flashcards_delete_policy ON flashcards
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Aktualizuj polisy dla ai_logs
DROP POLICY IF EXISTS ai_logs_select_policy ON ai_logs;

CREATE POLICY ai_logs_select_policy ON ai_logs
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM flashcards_ai_generation 
    WHERE id = flashcards_generation_id AND user_id = auth.uid()
  ));

-- Dodaj polisy dla flashcards_ai_generation
ALTER TABLE flashcards_ai_generation ENABLE ROW LEVEL SECURITY;

CREATE POLICY flashcards_ai_generation_select_policy ON flashcards_ai_generation
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY flashcards_ai_generation_insert_policy ON flashcards_ai_generation
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Dodaj polisy dla users (tylko odczyt własnego rekordu)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY users_select_own ON users
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- Polisy dla roles (publiczny odczyt)
CREATE POLICY roles_select_all ON roles
  FOR SELECT
  TO authenticated
  USING (true);
```

**Efekt**: 
- RLS automatycznie używa `auth.uid()` z JWT tokenu
- Nie ma potrzeby ręcznego ustawiania `current_user_id`
- Bezpieczeństwo na poziomie bazy danych

#### 3.1.5. Aktualizacja Supabase Client

**Modyfikacja `/src/db/supabase.client.ts`**:

```typescript
import { createClient, type SupabaseClient as SupabaseClientBase } from "@supabase/supabase-js";
import type { Database } from "./database.types.ts";

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.SUPABASE_KEY;
const supabaseServiceKey = import.meta.env.SUPABASE_SERVICE_KEY; // ZMIANA: osobna zmienna

// Klient dla użytkowników (z RLS)
export const supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,      // Zarządzamy manualnie
    persistSession: false,         // Nie używamy localStorage
    detectSessionInUrl: false,     // Nie używamy URL dla session
  }
});

// Klient Service Role (pomija RLS) - tylko dla zaufanych operacji serwerowych
export const supabaseServiceClient = supabaseServiceKey 
  ? createClient<Database>(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : supabaseClient;

export type SupabaseClient = SupabaseClientBase<Database>;

// USUNIĘCIE: DEFAULT_USER_ID nie jest już potrzebny
```

**Aktualizacja zmiennych środowiskowych**:

**`/src/env.d.ts`**:
```typescript
interface ImportMetaEnv {
  readonly SUPABASE_URL: string;
  readonly SUPABASE_KEY: string;
  readonly SUPABASE_SERVICE_KEY: string;  // NOWE
  readonly OPENROUTER_API_KEY: string;
}
```

**`.env.example`** (trzeba utworzyć):
```
SUPABASE_URL=your-supabase-url
SUPABASE_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-role-key
OPENROUTER_API_KEY=your-openrouter-key
```

### 3.2. Przepływ rejestracji

**Sekwencja kroków**:

1. **User**: Wypełnia formularz na `/auth/register` i wysyła
2. **Frontend**: Walidacja → POST `/api/auth/register`
3. **Backend Endpoint**: 
   - Walidacja Zod schema
   - Wywołanie `authService.registerUser()`
4. **Auth Service**:
   - `supabase.auth.signUp({ email, password, emailRedirectTo })`
   - Supabase tworzy rekord w `auth.users` (email_confirmed_at = NULL)
   - Supabase wysyła email z linkiem potwierdzającym
5. **Backend Endpoint**: Zwraca sukces (201) z komunikatem
6. **Frontend**: Wyświetla "Please check your email inbox..."
7. **User**: Otwiera email i klika link
8. **Link**: Prowadzi do `/auth/confirm-email?token_hash=...&type=signup`
9. **SSR (`/auth/confirm-email.astro`)**:
   - Wyciąga token z URL
   - Wywołuje `supabase.auth.verifyOtp({ token_hash, type: 'signup' })`
   - Supabase aktualizuje `auth.users.email_confirmed_at`
10. **Database Trigger**: Automatycznie tworzy rekord w `public.users`
11. **SSR**: Wyświetla komunikat sukcesu z linkiem do logowania

### 3.3. Przepływ logowania

**Sekwencja kroków**:

1. **User**: Wypełnia formularz na `/auth/login` i wysyła
2. **Frontend**: Walidacja → POST `/api/auth/login`
3. **Backend Endpoint**:
   - Walidacja Zod schema
   - Wywołanie `authService.loginUser()`
4. **Auth Service**:
   - `supabase.auth.signInWithPassword({ email, password })`
   - Weryfikacja credentials przez Supabase
   - Sprawdzenie `email_confirmed_at` (jeśli NULL → błąd)
   - Pobranie session (access_token, refresh_token)
   - Pobranie danych użytkownika z `public.users` (join z `roles`)
5. **Backend Endpoint**:
   - Ustawia ciasteczka: `sb-access-token`, `sb-refresh-token`
   - Zwraca sukces (200) z UserDTO
6. **Frontend**: 
   - Przekierowanie do strony docelowej (parametr `redirect` lub `/`)
7. **Każde kolejne request**:
   - Middleware pobiera tokeny z ciasteczek
   - Weryfikuje session przez Supabase
   - Dodaje `user` do `Astro.locals`
   - Chronione strony mają dostęp do `Astro.locals.user`

### 3.4. Przepływ wylogowania

**Sekwencja kroków**:

1. **User**: Klika "Wyloguj się" w UserMenu
2. **Frontend**: POST `/api/auth/logout`
3. **Backend Endpoint**:
   - Pobiera access_token z ciasteczek
   - Wywołanie `authService.logoutUser(supabase, access_token)`
4. **Auth Service**:
   - `supabase.auth.signOut()`
   - Supabase unieważnia session
5. **Backend Endpoint**:
   - Usuwa ciasteczka (sb-access-token, sb-refresh-token)
   - Zwraca sukces (200)
6. **Frontend**:
   - Przekierowanie do `/auth/login`
   - Wyświetlenie toast "You have been logged out"

### 3.5. Przepływ odzyskiwania hasła

**Sekwencja kroków**:

1. **User**: Wchodzi na `/auth/recover-password` i podaje email
2. **Frontend**: POST `/api/auth/recover-password`
3. **Backend Endpoint**:
   - Walidacja email
   - Wywołanie `authService.recoverPassword()`
4. **Auth Service**:
   - `supabase.auth.resetPasswordForEmail(email, { redirectTo })`
   - Supabase wysyła email z linkiem resetującym
5. **Backend Endpoint**: Zwraca sukces (200) - zawsze, bez względu na istnienie email
6. **Frontend**: Wyświetla "If the email exists, we will send instructions..."
7. **User**: Otwiera email i klika link
8. **Link**: Prowadzi do `/auth/reset-password?token_hash=...&type=recovery`
9. **SSR (`/auth/reset-password.astro`)**:
   - Wyciąga token z URL
   - Renderuje komponent `ResetPasswordForm` z tokenem
10. **User**: Wpisuje nowe hasło i wysyła
11. **Frontend**: POST `/api/auth/reset-password` z { token, password }
12. **Backend Endpoint**:
    - Wywołanie `authService.resetPassword()`
13. **Auth Service**:
    - Weryfikacja tokenu przez `supabase.auth.verifyOtp()`
    - Aktualizacja hasła przez `supabase.auth.updateUser({ password })`
14. **Backend Endpoint**: Zwraca sukces (200)
15. **Frontend**: Wyświetla komunikat i przekierowuje do `/auth/login`

### 3.6. Bezpieczeństwo

#### 3.6.1. Zabezpieczenia implementowane

**1. HTTP-Only Cookies**
- Tokeny przechowywane w `httpOnly` cookies
- Zabezpieczenie przed XSS (JavaScript nie ma dostępu)
- Ustawienie `secure: true` w produkcji (tylko HTTPS)
- `sameSite: "lax"` - ochrona przed CSRF

**2. Row Level Security (RLS)**
- Wszystkie tabele z danymi użytkowników mają RLS
- Automatyczna weryfikacja `auth.uid()` przez PostgreSQL
- Zabezpieczenie na poziomie bazy - nawet przy błędzie w aplikacji

**3. Walidacja danych wejściowych**
- Walidacja po stronie frontendu (UX)
- Walidacja po stronie backendu przez Zod (bezpieczeństwo)
- Ochrona przed injection attacks

**4. Rate Limiting (Supabase)**
- Konfiguracja w `supabase/config.toml`:
  - Email: 2 na godzinę
  - Token refresh: 150 per 5 minut per IP
  - Sign up/in: limitowane per IP
- Ochrona przed brute force

**5. Token Management**
- Access token: 1 godzina ważności (krótki czas)
- Refresh token: 7 dni ważności
- Automatyczna rotacja refresh tokenów
- Middleware automatycznie odświeża wygasłe tokeny

**6. Password Requirements**
- Minimum 6 znaków (konfiguracja Supabase)
- Możliwość rozszerzenia o bardziej złożone wymagania

**7. Email Confirmation**
- Wymagane potwierdzenie emaila przed logowaniem
- Weryfikacja własności adresu email

**8. HTTPS w produkcji**
- Wymuszenie `secure: true` dla cookies
- DigitalOcean z SSL certificate

#### 3.6.2. Best practices stosowane

**1. Error Handling**
- Early returns w endpointach
- Guard clauses dla walidacji
- Szczegółowe logowanie błędów (console.error)
- Ogólne komunikaty dla użytkowników (nie ujawniamy szczegółów implementacji)

**2. Service Layer Pattern**
- Oddzielenie logiki biznesowej od endpointów
- Reużywalność kodu
- Łatwiejsze testowanie
- Custom error classes (AuthServiceError) dla konsystentnej obsługi błędów

**3. Type Safety**
- TypeScript w całym stacku
- Zod schemas dla runtime validation
- Database types z Supabase
- DTO dla API contracts

**4. No Secrets in Frontend**
- Service key tylko w zmiennych środowiskowych serwerowych
- Anon key w kliencie (publiczny, ograniczone uprawnienia)
- Wszystkie wrażliwe operacje na serwerze

**5. Consistent API Design**
- Jednolite formaty odpowiedzi
- Konsystentne kody statusu HTTP
- Przewidywalna struktura błędów
- Zgodność z REST principles

## 4. PODSUMOWANIE I WNIOSKI

### 4.1. Komponenty do implementacji

**Nowe pliki do utworzenia**:

**Strony (Astro)**:
1. `/src/pages/auth/register.astro`
2. `/src/pages/auth/login.astro`
3. `/src/pages/auth/recover-password.astro`
4. `/src/pages/auth/reset-password.astro`
5. `/src/pages/auth/confirm-email.astro`

**Komponenty (React)**:
6. `/src/components/auth/RegisterForm.tsx`
7. `/src/components/auth/LoginForm.tsx`
8. `/src/components/auth/RecoverPasswordForm.tsx`
9. `/src/components/auth/ResetPasswordForm.tsx`
10. `/src/components/auth/UserMenu.tsx`

**API Endpoints**:
11. `/src/pages/api/auth/register.ts`
12. `/src/pages/api/auth/login.ts`
13. `/src/pages/api/auth/logout.ts`
14. `/src/pages/api/auth/recover-password.ts`
15. `/src/pages/api/auth/reset-password.ts`
16. `/src/pages/api/auth/session.ts` (opcjonalny)

**Services & Helpers**:
17. `/src/lib/services/authService.ts`
18. `/src/lib/auth-helpers.ts`

**Migracje bazy danych**:
19. `/supabase/migrations/[timestamp]_auth_user_trigger.sql`
20. `/supabase/migrations/[timestamp]_update_rls_policies.sql`

**Pliki do modyfikacji**:
21. `/src/middleware/index.ts` - rozszerzenie o weryfikację session
22. `/src/env.d.ts` - dodanie `user` do `Locals`, dodanie `SUPABASE_SERVICE_KEY`
23. `/src/db/supabase.client.ts` - osobna zmienna dla service key, usunięcie DEFAULT_USER_ID
24. `/src/types.ts` - dodanie nowych DTOs i Commands dla auth
25. `/src/layouts/Layout.astro` - dodanie UserMenu / przyciski auth
26. `/src/pages/flashcards/ai-generation.astro` - dodanie `requireAuth()`
27. `/src/pages/index.astro` - warunkowy widok dla zalogowanych/niezalogowanych
28. `/src/components/Welcome.astro` - dodanie CTA do rejestracji/logowania

**Konfiguracja**:
29. Supabase Dashboard: Email templates (Confirmation, Password Recovery)
30. `.env.example` - dokumentacja zmiennych środowiskowych

### 4.2. Kompatybilność z istniejącą funkcjonalnością

**Zachowanie zgodności**:

1. **Istniejące endpointy API** (`/api/flashcards/*`):
   - Będą działać po dodaniu `requireAuth()` w middleware lub na poziomie endpointu
   - Obecnie używają `DEFAULT_USER_ID` - po implementacji auth użyją `Astro.locals.user.id`
   - Modyfikacja: zamiana `DEFAULT_USER_ID` na `Astro.locals.user?.id` z guard clause

2. **RLS polisy**:
   - Aktualizacja do `auth.uid()` sprawia, że są zgodne z Supabase Auth
   - Automatyczna weryfikacja na poziomie bazy - zwiększone bezpieczeństwo
   - Nie zmienia logiki aplikacji - tylko mechanizm weryfikacji

3. **Supabase Client w `locals`**:
   - Pozostaje bez zmian - middleware nadal dodaje do context
   - Dodatkowa funkcjonalność: weryfikacja session i dodanie `user`

4. **Komponenty UI** (Shadcn):
   - Używamy istniejących komponentów: Button, Input, Alert, Card
   - Spójny design system
   - Możliwe rozszerzenie o nowe komponenty (DropdownMenu dla UserMenu)

5. **Routing i nawigacja**:
   - Dodanie nowych tras `/auth/*` nie wpływa na istniejące
   - View Transitions API działa dla wszystkich stron
   - Parametr `redirect` w URL umożliwia płynną nawigację po logowaniu

### 4.3. Kolejność implementacji (sugerowana)

**Faza 1: Backend Foundation**
1. Utworzenie migracji (triggers, RLS update)
2. Aktualizacja `/src/types.ts` (DTOs, Commands)
3. Implementacja `/src/lib/services/authService.ts`
4. Aktualizacja `/src/db/supabase.client.ts`
5. Konfiguracja Email Templates w Supabase Dashboard

**Faza 2: API Endpoints**
6. Implementacja `/api/auth/register`
7. Implementacja `/api/auth/login`
8. Implementacja `/api/auth/logout`
9. Implementacja `/api/auth/recover-password`
10. Implementacja `/api/auth/reset-password`

**Faza 3: Middleware & Helpers**
11. Rozszerzenie `/src/middleware/index.ts`
12. Aktualizacja `/src/env.d.ts`
13. Implementacja `/src/lib/auth-helpers.ts`

**Faza 4: UI Components**
14. Komponent `RegisterForm.tsx`
15. Komponent `LoginForm.tsx`
16. Komponent `RecoverPasswordForm.tsx`
17. Komponent `ResetPasswordForm.tsx`
18. Komponent `UserMenu.tsx`

**Faza 5: Pages**
19. Strona `/auth/register.astro`
20. Strona `/auth/login.astro`
21. Strona `/auth/recover-password.astro`
22. Strona `/auth/reset-password.astro`
23. Strona `/auth/confirm-email.astro`

**Faza 6: Integration & Protection**
24. Modyfikacja `/src/layouts/Layout.astro` (UserMenu)
25. Zabezpieczenie `/src/pages/flashcards/ai-generation.astro`
26. Aktualizacja `/src/pages/index.astro`
27. Modyfikacja istniejących endpointów (zamiana DEFAULT_USER_ID)

**Faza 7: Testing & Polish**
28. Testowanie pełnych przepływów (rejestracja, logowanie, odzyskiwanie hasła)
29. Testowanie ochrony tras
30. Dostosowanie komunikatów i walidacji

### 4.4. Zmienne środowiskowe wymagane

**Development**:
```
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_KEY=your-local-anon-key
SUPABASE_SERVICE_KEY=your-local-service-key
OPENROUTER_API_KEY=your-openrouter-key
```

**Production**:
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-production-anon-key
SUPABASE_SERVICE_KEY=your-production-service-key
OPENROUTER_API_KEY=your-openrouter-key
```

### 4.5. Metryki sukcesu implementacji

Implementacja będzie uznana za udaną, jeśli spełnione zostaną następujące kryteria:

**Funkcjonalne**:
1. ✅ Użytkownik może się zarejestrować, otrzymać email potwierdzający i aktywować konto
2. ✅ Użytkownik może się zalogować i zostaje przekierowany do chronionej strony
3. ✅ Użytkownik może zresetować hasło poprzez email
4. ✅ Użytkownik może się wylogować
5. ✅ Niezalogowany użytkownik nie ma dostępu do chronionych stron (przekierowanie do logowania)
6. ✅ Zalogowany użytkownik widzi swoje dane w headerze (UserMenu)
7. ✅ Istniejące funkcjonalności (generowanie fiszek AI) działają poprawnie z nowym systemem auth

**Bezpieczeństwo**:
1. ✅ Tokeny przechowywane w HTTP-Only cookies
2. ✅ RLS działa poprawnie - użytkownik widzi tylko swoje fiszki
3. ✅ Walidacja danych zarówno po stronie frontendu jak i backendu
4. ✅ Hasła spełniają minimalne wymagania bezpieczeństwa

**Użyteczność**:
1. ✅ Walidacja w czasie rzeczywistym w formularzach
2. ✅ Czytelne komunikaty błędów w języku angielskim
3. ✅ Płynna nawigacja z parametrem redirect
4. ✅ Responsywny design na wszystkich urządzeniach

**Techniczne**:
1. ✅ TypeScript bez błędów kompilacji
2. ✅ Linter bez błędów
3. ✅ Zgodność z istniejącymi konwencjami kodu (service pattern, error handling, itd.)
4. ✅ Dokumentacja kodu (JSDoc comments)

---

## DODATEK: Diagramy przepływów

### A. Diagram przepływu rejestracji

```
User                 Frontend              API Endpoint          Auth Service          Supabase
 |                      |                        |                      |                    |
 |--[Fill form]-------->|                        |                      |                    |
 |                      |--[POST /register]----->|                      |                    |
 |                      |                        |--[registerUser]----->|                    |
 |                      |                        |                      |--[signUp]--------->|
 |                      |                        |                      |                    |--[Send email]
 |                      |                        |                      |<--[user + null session]
 |                      |                        |<--[201 Created]------|                    |
 |<--[Show success]----|                        |                      |                    |
 |                      |                        |                      |                    |
 |--[Open email]----------------------------------------------------------------------->|
 |                      |                        |                      |                    |
 |--[Click link]------->|                        |                      |                    |
 |                      |                        |                      |                    |
 |                      | GET /confirm-email     |                      |                    |
 |                      |  ?token=...            |                      |                    |
 |                      |------------------------------------[verifyOtp]----------------->|
 |                      |                        |                      |                    |--[Confirm email]
 |                      |                        |                      |                    |--[Trigger: create user]
 |<--[Confirmed]--------|                        |                      |                    |
```

### B. Diagram przepływu logowania

```
User                 Frontend              API Endpoint          Auth Service          Supabase
 |                      |                        |                      |                    |
 |--[Fill form]-------->|                        |                      |                    |
 |                      |--[POST /login]-------->|                      |                    |
 |                      |                        |--[loginUser]-------->|                    |
 |                      |                        |                      |--[signInWithPassword]->|
 |                      |                        |                      |<--[session + user]----|
 |                      |                        |                      |--[getUserData]---->|
 |                      |                        |                      |<--[user + role]----|
 |                      |                        |<--[Set cookies]------|                    |
 |                      |<--[200 OK + UserDTO]---|                      |                    |
 |<--[Redirect]---------|                        |                      |                    |
```

### C. Diagram middleware i ochrony tras

```
Request              Middleware                   Astro Page            Protected Component
   |                     |                             |                         |
   |--[GET /flashcards/ai-generation]---------------->|                         |
   |                     |                             |                         |
   |                     |--[Get cookies]              |                         |
   |                     |--[Verify session w/ Supabase]                         |
   |                     |--[Get user data]            |                         |
   |                     |--[Set locals.user]--------->|                         |
   |                     |                             |                         |
   |                     |                             |--[requireAuth()]        |
   |                     |                             |--[Check locals.user]    |
   |                     |                             |                         |
   |                     |                             | IF user NULL:           |
   |<--[Redirect /auth/login?redirect=...]------------|                         |
   |                     |                             |                         |
   |                     |                             | IF user EXISTS:         |
   |                     |                             |--[Render page]--------->|
   |<--[200 OK + HTML]----------------------------------------[Render component]--|
```

---

**Koniec specyfikacji technicznej systemu uwierzytelniania 10xCards**

Data utworzenia: 2025-10-28
Wersja: 1.0

