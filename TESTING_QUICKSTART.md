# E2E Testing Quick Start Guide

## 🚀 Quick Setup (5 minutes)

### 1. Create Test Environment File

Create a `.env.test` file in the project root:

```bash
# .env.test
E2E_USERNAME=your-test-user@example.com
E2E_PASSWORD=your-test-password
```

**Important:** This user must exist in your Supabase database!

### 2. Install Playwright Browsers (First Time Only)

```bash
npx playwright install chromium
```

### 3. Start Development Server

```bash
npm run dev
```

Keep this terminal open - the dev server must be running for tests.

### 4. Run Tests (in a new terminal)

```bash
npm run test:e2e
```

## ✨ Alternative Test Commands

### Interactive UI Mode (Recommended for Development)
```bash
npm run test:e2e:ui
```
Best for: Writing and debugging tests visually

### Headed Mode (Watch Browser)
```bash
npm run test:e2e:headed
```
Best for: Seeing what's happening in real-time

### Debug Mode (Step Through)
```bash
npm run test:e2e:debug
```
Best for: Investigating failing tests

### Run Specific Test
```bash
npx playwright test manual-flashcard-creation.spec.ts
```

## 📋 What Gets Tested

The test suite covers **US-004: Manual Flashcard Creation**:

✅ Authenticated user can create flashcards  
✅ Success notifications display correctly  
✅ Form validates input properly  
✅ Multiple flashcards can be created in sequence  
✅ Unauthenticated users are redirected to login  

## 🐛 Troubleshooting

### "E2E_USERNAME and E2E_PASSWORD must be set"
➡️ Create `.env.test` file with valid test user credentials

### Tests timeout or fail
➡️ Make sure dev server is running on `http://localhost:3000`

### Authentication fails
➡️ Verify test user exists in Supabase and email is confirmed

## 📚 Full Documentation

For detailed information, see:
- **Comprehensive Guide:** `tests/README.md`
- **Implementation Summary:** `.ai/e2e-tests-implementation-summary.md`
- **Main README:** `README.md` (Testing section)

## 🎯 Next Steps

1. Create your test user in Supabase (if not exists)
2. Set up `.env.test` with credentials
3. Run `npm run test:e2e:ui` for the best experience
4. Write more tests as you build new features!

Happy Testing! 🎉

