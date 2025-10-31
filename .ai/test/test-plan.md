# Plan testów dla projektu 10xCards

## 1. Przegląd projektu

Aplikacja 10xCards umożliwia użytkownikom tworzenie fiszek (kart) zarówno ręcznie, jak i z wsparciem sztucznej inteligencji. Głównym celem aplikacji jest maksymalne uproszczenie procesu tworzenia fiszek, skracając pętlę feedbacku i umożliwiając efektywną naukę. Projekt wykorzystuje Astro 5 do generowania statycznych stron, React 19 dla interaktywnego interfejsu, TypeScript 5 dla statycznego typowania, Tailwind 4 do stylizacji oraz Shadcn/ui jako bibliotekę komponentów UI. Backend oparty jest na Supabase, który zapewnia bazę danych, autentykację oraz szereg funkcjonalności API.

## 2. Analiza architektury

- **Frontend**:
  - Pliki Astro: `./src/layouts`, `./src/pages` (statyczne strony i układy)
  - Komponenty React: `./src/components` (w tym formularze autoryzacyjne, generacja AI, interaktywne elementy)
  - Komponenty UI: `./src/components/ui` (z wykorzystaniem Shadcn/ui)
- **Backend**:
  - Endpointy API: `./src/pages/api` (autentykacja, obsługa fiszek, generacja AI)
  - Logika biznesowa: `./src/lib/services` (obsługa autentykacji, generacji AI, zarządzanie fiszkami)
  - Middleware: `./src/middleware/index.ts` (autentykacja, zarządzanie sesjami)
- **Baza danych**:
  - Supabase: Przechowywanie danych, migracje SQL znajdują się w `supabase/migrations`
  - RLS policies dla bezpieczeństwa danych
  - Triggery i funkcje PostgreSQL


## 3. Strategia testowania

Testowanie zostanie przeprowadzone w oparciu o następujące podejścia:

- **Testy jednostkowe (unit tests)**:
  - Testowanie najmniejszych jednostek funkcjonalności, takich jak funkcje pomocnicze, logika w custom hooks (`useAIGeneration`, `useTheme`, `useCharCount`) oraz walidacja formularzy.
  
- **Testy integracyjne (integration tests)**:
  - Testowanie współdziałania pomiędzy komponentami, integracji API (np. endpointy auth, flashcards) oraz modułów logiki biznesowej (np. generacja AI).
  - Testowanie middleware z rzeczywistym flow autentykacji.
  - Integracja z lokalną instancją Supabase.
  
- **Testy funkcjonalne (E2E tests)**:
  - Symulacja scenariuszy użytkownika, takich jak rejestracja, logowanie, odzyskiwanie hasła, tworzenie i zarządzanie fiszkami, oraz generacja treści przez AI.
  - Przeprowadzane przy użyciu Playwright.
  
## 4. Typy testów do przeprowadzenia

### 4.1 Testy jednostkowe

**Funkcje pomocnicze:**
- `./src/lib/utils.ts` - funkcje utility (cn, formatters, validators)
- `./src/lib/auth-helpers.ts` - funkcje pomocnicze autentykacji

**Custom hooks:**
- `useAIGeneration` - logika generacji AI, zarządzanie stanem
- `useTheme` - zarządzanie motywem aplikacji
- `useCharCount` - licznik znaków

**Komponenty React:**
- Formularze autoryzacyjne: LoginForm, RegisterForm, RecoverPasswordForm, ResetPasswordForm
- Komponenty generacji AI: AIGenerationForm, ProposalCard, ProposalsList
- Komponenty UI: Button, Input, Card, Alert, DropdownMenu
- InlineEditor, StatusBanner, ThemeToggle

**Komponenty Astro:**
- Welcome.astro
- Layout.astro
- Strony auth (login, register, recover-password, reset-password)

**Serwisy (z mockowanymi zależnościami):**
- `authService.ts` - logika autentykacji
- `flashcardService.ts` - zarządzanie fiszkami
- `aiGenerationService.ts` - logika generacji AI
- `openrouterService.ts` - integracja z OpenRouter

### 4.2 Testy integracyjne

**Integracja z Supabase:**
- Operacje CRUD na fiszkach z lokalną bazą danych
- Testowanie RLS policies
- Testowanie triggerów bazy danych
- Testowanie migracji (rollback/rollforward)

**Endpointy API:**
- `./src/pages/api/auth/*` - rejestracja, logowanie, wylogowanie, odzyskiwanie hasła
- `./src/pages/api/flashcards/*` - operacje CRUD, generacja AI

### 4.3 Testy funkcjonalne (E2E)

**Scenariusze autentykacji:**
- Rejestracja nowego użytkownika
- Potwierdzenie email
- Logowanie użytkownika
- Wylogowanie
- Odzyskiwanie hasła
- Resetowanie hasła
- Weryfikacja sesji między odświeżeniami strony

**Scenariusze zarządzania fiszkami:**
- Tworzenie nowej fiszki ręcznie
- Edycja istniejącej fiszki (inline editing)
- Usuwanie fiszki
- Przeglądanie listy fiszek

**Scenariusze generacji AI:**
- Wprowadzanie promptu i generowanie propozycji
- Przeglądanie wygenerowanych propozycji
- Akceptowanie propozycji (zapisanie jako fiszki)
- Odrzucanie propozycji
- Obsługa błędów generacji (timeout, brak odpowiedzi)

## 5. Priorytetowe obszary testowania

**Krytyczne (Priority 1 - must have 90%+ coverage):**
- Autentykacja: rejestracja, logowanie, odzyskiwanie hasła, zarządzanie sesjami
- Middleware autentykacji
- Generacja treści przez AI
- Zarządzanie fiszkami: CRUD operations
- Custom hooks

## 6. Środowiska testowe

### 6.1 Lokalne (Development)

**Konfiguracja:**
- Supabase CLI z lokalną instancją (Docker)
- Lokalna baza PostgreSQL dla testów
- Mock OpenRouter API (fixtures)
- Zmienne środowiskowe: `.env.test.local`

**Izolacja danych:**
- Osobna baza danych dla każdego test suite
- Automatyczne czyszczenie danych po testach
- Seed data dla predictable state

**Uruchamianie:**
```bash
# Start local Supabase
npx supabase start

# Run tests
npm run test           # unit + integration
npm run test:e2e      # E2E tests
npm run test:coverage # with coverage report
```

### 6.2 CI/CD Pipeline

**Pre-commit:**
- ESLint + Prettier
- Type checking (tsc --noEmit)

**Pre-push:**
- Testy jednostkowe
- Testy integracyjne (quick suite)

**Pull Request:**
- Pełne testy jednostkowe
- Pełne testy integracyjne
- Smoke tests E2E (critical paths only)
- Security linting (npm audit)
- Coverage report (with threshold check)

**Merge to main:**
- Full test suite including comprehensive E2E
- Lighthouse CI
- Visual regression tests
- Bundle size check

## 7. Narzędzia testowe

### 7.1 Testy jednostkowe i integracyjne

**Test runner:**
- **Vitest** - szybki test runner zintegrowany z Vite/Astro
  - Wspiera ESM out of the box
  - Kompatybilny z Jest API
  - Built-in coverage z c8/istanbul

**Testowanie komponentów React:**
- **React Testing Library** - testowanie komponentów z perspektywy użytkownika
- **@testing-library/user-event** - symulacja interakcji użytkownika
- **@testing-library/jest-dom** - custom matchers

**Testowanie komponentów Astro:**
- **@astro/test** - oficjalne narzędzie do testowania komponentów Astro
- Renderowanie komponentów .astro do HTML
- Testowanie SSR behavior

**Mockowanie:**
- **vi.mock** (Vitest built-in) - mockowanie modułów
- **MSW (Mock Service Worker)** - mockowanie requestów HTTP/API
- **@supabase/supabase-js mock** - mockowanie klienta Supabase

**Testowanie API:**
- Natywne testowanie endpointów Astro z `astro:testing`
- Alternatywnie: bezpośrednie wywołanie funkcji API handlers

### 7.2 Testy funkcjonalne (E2E)

**Framework:**
- **Playwright** - nowoczesny framework E2E
  - Multi-browser support (Chromium, Firefox, WebKit)
  - Auto-waiting i retry logic
  - Screenshot i video recording
  - Network interception
  - Mobile emulation

**Konfiguracja:**
- Test isolation (każdy test w fresh browser context)
- Parallel execution dla szybszych testów
- Retry logic dla flaky tests (max 2 retries)

### 7.3 Coverage reporting

**Tools:**
- **c8** lub **istanbul** - code coverage
- **Codecov** lub **Coveralls** - coverage hosting i reporting
- Built-in Vitest coverage

## 8. Kryteria akceptacji

### 8.1 Code Coverage

**Backend (Services, API, Middleware):**
- Line coverage: **≥ 80%**
- Branch coverage: **≥ 75%**
- Function coverage: **≥ 85%**

**Frontend (Komponenty React):**
- Line coverage: **≥ 70%**
- Branch coverage: **≥ 65%**

**Krytyczne moduły (Auth, AI Generation, Security):**
- Line coverage: **≥ 90%**
- Branch coverage: **≥ 85%**

**Exclusions:**
- Pliki konfiguracyjne
- Type definitions
- Kod generowany automatycznie

### 8.2 Testy E2E

**Happy paths:**
- **100%** kluczowych ścieżek użytkownika pokrytych testami E2E

**Edge cases:**
- **≥ 70%** istotnych edge cases pokrytych testami

**Critical user journeys:**
1. Rejestracja → Potwierdzenie → Logowanie → Tworzenie fiszki ✅
2. Logowanie → Generacja AI → Akceptacja propozycji ✅
3. Logowanie → Edycja fiszki → Usunięcie fiszki ✅
4. Odzyskiwanie hasła → Reset → Logowanie ✅

### 8.3 Jakość kodu

**Linting:**
- **Zero** błędów ESLint w PR
- **Zero** błędów TypeScript

### 8.4 Tolerancja błędów

**Flaky tests:**
- **≤ 2%** flaky test rate
- Automatic retry dla flaky tests (max 2 retries)

**Test execution time:**
- Unit tests: **≤ 30s** total
- Integration tests: **≤ 2min** total
- E2E tests (full suite): **≤ 15min**
- E2E smoke tests: **≤ 3min**

## 9. Harmonogram testów

### 9.1 Podczas rozwoju (Development phase)

**Continuous (na bieżąco):**
- Testy jednostkowe podczas pisania kodu
- TDD approach dla krytycznej logiki
- Watch mode w Vitest dla instant feedback

**Daily:**
- Pełne testy jednostkowe (local)
- Testy integracyjne (local)
- Type checking

**Code review:**
- Weryfikacja testów w PR
- Coverage diff review
- Test quality review

### 9.2 CI/CD Pipeline

**Pre-commit (git hooks):**
- Lint-staged: ESLint + Prettier
- Type checking dla zmienionych plików

**Pre-push (git hooks):**
- Testy jednostkowe
- Quick integration tests

**Post-merge (Continuous Deployment):**
- Deploy to staging
- Smoke tests on staging
- (Optional) Manual QA approval
- Deploy to production
- Smoke tests on production

## 10. Zarządzanie ryzykiem


## 11. Podsumowanie

Ten plan testowania zapewnia kompleksowe pokrycie wszystkich aspektów aplikacji 10xCards, od testów jednostkowych po E2E, od bezpieczeństwa po wydajność. Kluczowe elementy strategii:

✅ **Wielopoziomowe testowanie**: Unit → Integration → E2E  
✅ **Security-first approach**: Testy bezpieczeństwa jako priority  
✅ **Automated quality gates**: CI/CD z automatycznymi checks  
✅ **Performance monitoring**: Lighthouse CI, bundle size, load testing  
✅ **Accessibility**: Automated + manual a11y testing  
✅ **Realistic test environments**: Lokalny Supabase, MSW dla API  
✅ **Risk management**: Identyfikacja i mitigation ryzyk  
✅ **Continuous improvement**: Monitoring, retrospectives, learning  

Implementacja tego planu zapewni wysoką jakość kodu, minimalizację bugs w produkcji, oraz pewność przy wprowadzaniu zmian.
