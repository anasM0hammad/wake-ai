# Wake AI

An intelligent alarm clock app that ensures you wake up by requiring you to solve AI-generated quiz questions before dismissing the alarm. Powered by on-device LLM technology for privacy and offline functionality.

## Features

- **AI-Powered Questions**: Uses WebLLM to generate unique quiz questions on-device
- **Multiple Difficulty Levels**: Easy (1 question), Medium (3 questions), Hard (5 questions)
- **Question Categories**: Math, Patterns, General Knowledge, and Logic puzzles
- **Adaptive Model Selection**: Automatically selects model size based on device RAM
- **Offline Support**: Questions generated and cached locally - no internet required
- **Native Mobile Support**: Built with Capacitor for Android (iOS support planned)
- **Lock Screen Support**: Alarm displays over lock screen
- **Customizable Alarm Tones**: Gentle, Classic, and Intense options
- **Haptic Feedback**: Vibration patterns for alarm alerts
- **Kill Switch**: Emergency PIN-protected alarm dismissal

## Tech Stack

- **Frontend**: React 18 + Vite
- **Styling**: Tailwind CSS
- **Mobile**: Capacitor 6
- **AI/LLM**: [@mlc-ai/web-llm](https://github.com/mlc-ai/web-llm)
- **Audio**: Howler.js
- **Routing**: React Router v7

## Project Structure

```
src/
├── components/
│   ├── alarm/          # Alarm UI components (QuestionCard, AlarmCard, etc.)
│   ├── common/         # Reusable UI components (Button, Modal, Toggle, etc.)
│   ├── onboarding/     # First-time user setup flow
│   └── premium/        # Premium feature upsells
├── hooks/              # React hooks (useAlarm, useLLM, useSettings, etc.)
├── pages/              # Main app pages (Home, Settings, Dashboard, etc.)
├── services/
│   ├── alarm/          # Alarm scheduling, audio, background services
│   ├── llm/            # LLM integration, question generation
│   └── storage/        # LocalStorage wrappers for persistence
└── utils/              # Constants, device info, time utilities
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Android Studio (for mobile builds)

### Installation

```bash
# Clone the repository
git clone https://github.com/anasM0hammad/wake-ai.git
cd wake-ai

# Install dependencies
npm install

# Start development server
npm run dev
```

### Building for Production

```bash
# Build web assets
npm run build

# Preview production build
npm run preview
```

### Android Development

```bash
# Sync Capacitor
npx cap sync android

# Open in Android Studio
npx cap open android

# Run on device/emulator
npx cap run android
```

## Configuration

### Model Selection

The app automatically selects the appropriate LLM model based on device RAM:

| Device RAM | Model | Size |
|------------|-------|------|
| < 6GB | Qwen2.5-0.5B-Instruct | ~300MB |
| >= 6GB | Qwen2.5-1.5B-Instruct | ~900MB |

### Difficulty Modes

| Mode | Questions | Time/Question | Premium |
|------|-----------|---------------|---------|
| Easy | 1 | 60s | No |
| Medium | 3 | 45s | Yes |
| Hard | 5 | 30s | Yes |

## How It Works

1. **Alarm Setup**: User sets alarm time and difficulty
2. **Question Preload**: 30 minutes before alarm, the LLM model loads and generates questions
3. **Alarm Trigger**: At alarm time, audio and vibration start
4. **Question Challenge**: User must correctly answer required questions
5. **Success/Failure**: Alarm dismisses on success; wrong answers accumulate penalties

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |

## Key Components

### LLM Integration

- **webllm.js**: WebLLM engine wrapper with model management
- **questionService.js**: Question generation with retry logic and fallback
- **questionCache.js**: Caches generated questions for reliability
- **preloadManager.js**: Handles question preloading before alarm

### Alarm System

- **alarmScheduler.js**: Native notification scheduling via Capacitor
- **alarmManager.js**: Alarm CRUD operations and session management
- **audioPlayer.js**: Audio playback with Howler.js + Web Audio fallback
- **backgroundService.js**: Handles app state changes and alarm triggers

### Storage

All data persists locally using localStorage:
- Alarm configuration
- User settings
- Generated questions
- Statistics

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is private and proprietary.

## Acknowledgments

- [MLC-AI WebLLM](https://github.com/mlc-ai/web-llm) for on-device LLM inference
- [Capacitor](https://capacitorjs.com/) for native mobile capabilities
- [Howler.js](https://howlerjs.com/) for audio playback
