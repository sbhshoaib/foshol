# Foshol - Smart Agriculture Platform 🌱

Foshol is an AI-Powered Smart Agriculture Platform designed specifically for farmers in Bangladesh. It helps farmers manage their lands, track crop growth phases, predict crop prices, detect plant diseases, and get AI-driven recommendations for fertilizers and farming tasks.

## 🚀 Features

- **Crop & Land Management**: Keep track of your fields, currently planted crops, and their growth phases.
- **AI Disease Detection**: Take a picture of a diseased plant, and the AI will analyze it to provide a diagnosis and treatment plan.
- **Smart Fertilizer Recommendation**: Get AI-generated fertilizer advice based on your specific crop and land conditions.
- **Crop Price Prediction**: AI-powered predictions for future crop market prices to help you plan your harvest.
- **Agricultural Chatbot**: A contextual AI assistant that knows about your currently planted crops and tasks, ready to answer any farming questions.
- **Weather & Task Notifications**: Push notifications to remind you of daily tasks and warn you of upcoming rain or adverse weather conditions.
- **Dark Mode Support**: Beautiful, dual-tone UI with full support for Light and Dark modes.

## 🛠️ Technology Stack

- **Backend**: Laravel (PHP), MySQL/SQLite, Artisan Console Commands
- **Frontend**: Next.js (React), Tailwind CSS, Framer Motion (for animations)
- **Mobile Native Wrapper**: Capacitor (Android App export with native Status Bar and FCM Push Notifications)
- **AI Integration**: Google Gemini API for intelligent analysis and conversational features.

## 📦 Project Structure

- `/app`, `/routes`, `/database`: Laravel backend serving the REST API.
- `/frontend`: Next.js web application.
- `/android`: Capacitor-generated native Android Studio project.

## 💻 Setup Instructions

### Backend (Laravel)
1. Navigate to the project root.
2. Run `composer install` to install PHP dependencies.
3. Copy `.env.example` to `.env` and configure your database and `GEMINI_API_KEYS`.
4. Run `php artisan key:generate`.
5. Run `php artisan migrate` to set up the database.
6. Serve the API using `php artisan serve` or your preferred web server (e.g., XAMPP/Apache).

### Frontend (Next.js)
1. Navigate to the `/frontend` directory: `cd frontend`.
2. Run `npm install` to install Node.js dependencies.
3. Configure the `.env.local` file with your API URL (`NEXT_PUBLIC_API_URL`) and Firebase credentials.
4. Run `npm run dev` for local web development.

### Android App (Capacitor)
To build and sync the app for Android:
1. Inside the `/frontend` folder, run `npm run build`.
2. Run `npx cap sync` to copy the static web assets to the Android folder.
3. Open the `/android` folder in Android Studio to build and deploy the APK.

## 📜 Design Patterns

This project heavily utilizes modern software design patterns on both the frontend and backend, including Singleton, Factory, Builder, Observer, Strategy, and Dependency Injection. For a detailed breakdown of how these patterns are implemented, please refer to the `design_patterns_detailed.md` and `design_patterns_used.txt` files included in the repository.

---
*Built to empower the future of farming.*
