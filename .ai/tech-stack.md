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

CI/CD i Hosting
- Github Actions – automatyzacja pipeline’ów CI/CD.
- DigitalOcean – hosting aplikacji za pomocą kontenerów Docker, gwarantujący skalowalność i niezawodność.