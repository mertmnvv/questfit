# QuestFit - AI Handover Document

## Project Context
QuestFit is a modern Health, Diet, and Fitness application that combines traditional calorie tracking and workout generation with RPG (Role Playing Game) gamification elements. The app is built using React Native (Expo) and uses Firebase for authentication and database caching. Zustand is used for global state management with offline persistence (`AsyncStorage`). It also utilizes Groq API (Llama models) for AI-powered feature generation.

## Current State & Completed Features
We have successfully built and integrated the core loops of the application. The project is almost ready for production.

### 1. User Profiling & Onboarding
- Detailed onboarding flow capturing Age, Weight, Height, Gender, Body Type (Ectomorph, Mesomorph, Endomorph).
- BMR and TDEE calculations logic implemented in `mathEngine.js`.
- Automatic macro distribution (Protein, Carbs, Fat) based on user goal (Lose, Maintain, Build Muscle).

### 2. Gamification & RPG Mechanics
- Dynamic 2D Avatars: RPG avatars change based on body type, gender, and level.
- Level & XP System: Users gain XP by eating within macro ranges and completing workouts.
- Dynamic Quests System: A pool of 30 different quests (in `src/data/questPool.js`). The system randomly assigns 4 quests every day (`checkDailyReset` in `userStore.js`).
- Dual language support (Turkish and English) via `i18next` for all quests and UI elements.

### 3. Diet & Nutrition
- Food searching with Groq API integration (`foodService.js`). If a food is not in the Firebase cache, Groq AI calculates the calories and macros.
- Barcode Scanner: Integrated `expo-camera` with `OpenFoodFacts API` to scan packaged foods.
- Vision AI: Integrated `expo-image-picker`. Users can upload food images, which are analyzed by Groq Vision (`llama-3.2-11b-vision-preview`) to estimate calories and macros.
- Fasting (IF/OMAD) tracking.

### 4. Workouts & Health
- Pedometer Integration: Using `expo-sensors` to track daily steps (Simulator logic removed, currently depends on real device sensors).
- Custom Workout Builder: Users can create custom routines, define sets, reps, weight, and rest times. A bug causing the keyboard to close during routine naming (`ListHeaderComponent` inline reference) has been fixed.
- AI Workout Generator: Generates equipment-aware and environment-aware workouts using Groq API.
- Fatigue/Recovery System: Tracks muscle fatigue to suggest lighter workouts on rest days.

### 5. Persistence, UI & Stability Fixes
- Android Crash Fix: Handled the `ReactActivityDelegate.onUserLeaveHint` NullPointerException bug by wrapping `super.onUserLeaveHint()` in a try/catch block inside `MainActivity.kt`.
- **00:00 Daily Reset & Background Fix**: Implemented an `AppState` listener in `AppNavigator.js` that ensures midnight rollovers and data resets execute correctly when the app is resumed from the background.
- **Firebase Sync**: `weightHistory` and `stepHistory` now persist directly to Firebase inside `userStore.js`.
- **UI Overhaul**: The application UI was recently modernized to a more "flat" and minimalist premium design. Heavy shadows, unnecessary borders, and excessive glassmorphism gradients were removed (especially in the Tutorial Modal and Quest Levels) to establish a cleaner aesthetic.

## Next Steps for the Incoming AI
The user has decided to implement two main features for the empty **Community Screen**:
1. **Achievement Broadcasts:** Shareable rich cards when a user levels up or hits a streak.
2. **Shareable Workouts:** The ability to share an AI-generated or custom routine to the feed, allowing other users to click "Save Routine" and add it to their profile.
> **Note:** A detailed plan for these two features exists in `docs/ROADMAP.md`. Read it before starting.

### Known Technical Debt / Warnings
- **BROKEN FEATURES:** The **Barcode Scanner** and **Image-to-Calories (Vision AI)** features are currently NOT working. They have been implemented in `MealsScreen.js` and `foodService.js`, but they require debugging in the next session to identify why they fail to scan or return results.
- **Groq API vs Gemini:** The `package.json` contains `@google/generative-ai` but the project actively uses Groq API via standard REST `fetch` calls.
- **Android Build:** The project uses Expo CNG (Continuous Native Generation) but has a prebuilt `android` folder. Ensure `$env:JAVA_HOME` is set to Java 17 when running `npm run android` since Java 8 throws a compatibility error.
- **Firebase Permissions:** Ensure the Firestore rules allow reads/writes for the `v2_` food cache.

## Store Structure (`userStore.js`)
- `profile`: Contains physical attributes, level, xp, bodyType.
- `dailyQuests`: Array of 4 active quests for the day.
- `consumedToday`: Accumulated macros and calories.
- `dailyLog`: Logs of `foods` and `workouts` for the current day.
- `fatigue`: Tracks fatigue for different muscle groups.
