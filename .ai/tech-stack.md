# Tech Stack dla 10xCards

Frontend
- Astro 5 – generuje szybkie, wydajne strony z minimalną ilością JavaScript.
- React 19 – zapewnia interaktywność w komponentach, umożliwiając dynamiczne działanie interfejsu.
- TypeScript 5 – zapewnia statyczne typowanie, co podnosi niezawodność kodu i wsparcie narzędzi programistycznych.
- Tailwind 4 – umożliwia wygodne i spójne stylowanie aplikacji.
- Shadcn/ui – biblioteka komponentów React wykorzystywana do budowy interfejsu użytkownika.

Backend
- Supabase – kompleksowe rozwiązanie backendowe oferujące:
  - PostgreSQL jako bazę danych,
  - Wbudowaną autentykację użytkowników,
  - SDK ułatwiające wdrażanie funkcji backendu (Backend-as-a-Service).

AI
- Openrouter.ai – integracja z różnymi modelami (np. OpenAI, Anthropic, Google), co umożliwia:
  - Automatyczne generowanie propozycji fiszek,
  - Ustawianie limitów finansowych dla kluczy API,
  - Optymalizację kosztów przy zachowaniu wysokiej efektywności.

CI/CD
- Github Actions – automatyzacja pipeline'ów CI/CD.

Testowanie
- Vitest – szybki test runner do testów jednostkowych i integracyjnych, zintegrowany z Vite/Astro.
- React Testing Library – testowanie komponentów React z perspektywy użytkownika.
- @testing-library/user-event – symulacja interakcji użytkownika w testach.
- @testing-library/jest-dom – custom matchers do testowania DOM.
- @astro/test – oficjalne narzędzie do testowania komponentów Astro i zachowań SSR.
- MSW (Mock Service Worker) – mockowanie requestów HTTP/API dla niezawodnych testów.
- Playwright – nowoczesny framework do testów E2E z wsparciem dla wielu przeglądarek.
- c8/istanbul – narzędzia do raportowania pokrycia kodu testami.
- Codecov/Coveralls – hosting i raportowanie pokrycia kodu.

Deployments & Releases
- Cloudflare Pages – platforma hostingowa dla aplikacji Astro SSR, wybrana ze względu na:
  - Najlepszy stosunek ceny do wydajności ($20/miesiąc dla całego zespołu, nie per użytkownika),
  - Unlimited requests i dozwolone komercyjne użycie na wszystkich planach,
  - Globalną sieć CDN i edge computing zapewniającą niskie opóźnienia na całym świecie.