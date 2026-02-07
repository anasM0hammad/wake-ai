# CLAUDE.md — Wake AI

## Project Overview

Wake AI is an intelligent alarm clock app that requires users to solve AI-generated quiz questions before dismissing the alarm. It uses on-device LLM technology (WebLLM) for privacy and offline functionality. The app targets Android via Capacitor, with iOS planned.

## Tech Stack

- **Frontend:** React 18 + React Router v7 (JSX, not TypeScript)
- **Build:** Vite 7
- **Styling:** Tailwind CSS 3 + PostCSS + custom CSS variables (dark-mode-first theme)
- **AI/LLM:** @mlc-ai/web-llm with Qwen2.5 models (0.5B and 1.5B)
- **Mobile:** Capacitor 6 (Android native bridge)
- **Audio:** Howler.js + Web Audio API fallback
- **Linting:** ESLint 9 (flat config) with react-hooks and react-refresh plugins
- **No test framework configured**

## Common Commands

```bash
npm run dev          # Start Vite dev server (HMR)
npm run build        # Production build to dist/
npm run lint         # Run ESLint
npm run preview      # Preview production build

npx cap sync android # Sync web assets to Android project
npx cap run android  # Build and run on device/emulator
```

## Project Structure

```
src/
├── components/        # React UI components grouped by feature
│   ├── alarm/         # QuestionCard, AlarmCard, Success/Failure screens
│   ├── common/        # Reusable: Button, Modal, Toggle, TimePicker, etc.
│   ├── dashboard/     # Premium stats dashboard
│   ├── onboarding/    # First-time user setup flow
│   ├── premium/       # Premium feature upsells
│   └── settings/      # User settings UI
├── hooks/             # Custom React hooks (useAlarm, useLLM, useSettings, etc.)
├── pages/             # Route-level pages (Home, Settings, AlarmRingingPage, etc.)
├── services/          # Business logic
│   ├── alarm/         # Alarm lifecycle, scheduling, audio, background service
│   ├── llm/           # WebLLM engine, question generation, caching, fallbacks
│   └── storage/       # localStorage wrappers for alarms, settings, stats
├── utils/             # Constants, device info, permissions, time calculations
├── App.jsx            # Root component with routing
├── main.jsx           # Entry point
└── index.css          # Global styles (Tailwind + CSS variables)
android/               # Capacitor Android native project (Gradle)
public/assets/         # Tones, sounds, icons, images
```

## Architecture & Patterns

- **Service-based architecture:** Business logic lives in `src/services/` organized by domain (alarm, llm, storage), not in components.
- **Custom hooks pattern:** Domain logic is exposed to components via hooks in `src/hooks/` (useAlarm, useLLM, useSettings, useStats, usePremium, useQuestionSession).
- **No global state library:** Uses React local state + custom hooks + localStorage persistence. No Redux/Context.
- **Observer pattern:** WebLLM service uses `addProgressListener`/`_notifyListeners` for model loading progress.
- **Graceful degradation:** Hard-coded fallback questions in `src/services/llm/fallbackQuestions.js` when LLM is unavailable.
- **Preloading strategy:** Questions preloaded 30 minutes before alarm, cached (max 10 per alarm).
- **Error boundaries:** `ErrorBoundary` and `AlarmErrorBoundary` components catch React rendering errors.

## Naming Conventions

- **Components:** PascalCase files (e.g., `AlarmCard.jsx`, `QuestionCard.jsx`)
- **Hooks:** camelCase with `use` prefix (e.g., `useAlarm.js`, `useLLM.js`)
- **Services:** camelCase (e.g., `alarmManager.js`, `questionGenerator.js`)
- **Constants:** UPPER_SNAKE_CASE (e.g., `MAX_WRONG_ANSWERS`, `DIFFICULTY_LEVELS`)
- **All source files are `.js` or `.jsx`** — TypeScript is available but not used

## Key Files

- `src/utils/constants.js` — All app constants: difficulty levels, categories, tones, model configs
- `src/services/llm/webllm.js` — Core LLM engine wrapper (init, generate, unload)
- `src/services/alarm/alarmManager.js` — Alarm CRUD and session lifecycle
- `src/services/llm/questionGenerator.js` — Prompt construction and AI response validation
- `src/App.jsx` — Routing, initialization, and manual testing checklist (in comments)

## LLM Model Selection

Auto-selects based on device RAM:
- **>=6GB RAM:** Qwen2.5-1.5B-Instruct (~900MB)
- **<6GB RAM:** Qwen2.5-0.5B-Instruct (~300MB)

Model is unloaded after question generation to free memory.

## Coding Guidelines

- Write JSX, not TypeScript — the project uses `.js`/`.jsx` files
- Follow the existing service/hook/component separation pattern
- Keep business logic in services, UI logic in hooks, rendering in components
- Use Tailwind CSS utility classes for styling; custom CSS only in `index.css`
- ESLint rule: `no-unused-vars` errors except for UPPER_CASE identifiers
- No Prettier — follow existing code formatting style
- No automated tests exist; manual testing checklist is in `src/App.jsx` comments
- All data persistence uses localStorage via `src/services/storage/`
