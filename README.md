<div align="center">
  <img src="./client/assets/logo.png" alt="Dollay-Shollay Logo" width="120" />
  <h1>🏋️‍♂️ Dollay-Shollay</h1>
  <p><strong>A Premium, AI-Powered Fitness & Nutrition Tracking App</strong></p>

  [![React Native](https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactnative.dev/)
  [![Expo](https://img.shields.io/badge/Expo-1B1F23?style=for-the-badge&logo=expo&logoColor=white)](https://expo.dev/)
  [![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
  [![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
  [![Groq](https://img.shields.io/badge/AI-Groq-F55036?style=for-the-badge)](https://groq.com/)
</div>

<br />

Dollay-Shollay is a full-stack, state-of-the-art mobile application designed to help users achieve their fitness goals. With a sleek OLED-friendly dark UI, advanced local-first syncing architecture, and personalized AI coaching, it serves as the ultimate companion for workouts and nutrition tracking.

## ✨ Features

- 🎨 **Premium UI/UX:** Stunning "Zinc 950 & Indigo" color palette with smooth micro-animations using `react-native-reanimated`.
- 📴 **Offline-First Architecture:** Powered by local SQLite databases. Work out without internet; the app syncs silently with MongoDB when you're back online.
- 🤖 **AI Coach Integration:** Uses the blazing-fast Groq API to provide real-time, context-aware fitness and diet advice.
- 📊 **Dynamic Progress Tracking:** Calculates workout volumes, personal records (PRs), and maintains a highly intelligent daily streak system.
- 🥗 **Custom Nutrition Goals:** Track macros (Protein, Carbs, Fats) and Calories. Use AI-calculated targets or set your own custom manual overrides.
- 🔐 **Secure Authentication:** JSON Web Tokens (JWT) for secure login and data isolation.

---

## 🛠 Tech Stack

### Frontend (Mobile App)
- **Framework:** React Native (Expo SDK)
- **Navigation:** React Navigation (Bottom Tabs & Stack)
- **Styling:** Custom StyleSheet (Premium Dark Theme)
- **Animations:** React Native Reanimated
- **Local Storage:** Expo SQLite & Expo Secure Store

### Backend (REST API)
- **Server:** Node.js with Express.js
- **Database:** MongoDB Atlas (Mongoose ORM)
- **Authentication:** bcrypt & jsonwebtoken
- **AI Integration:** Groq SDK

---

## 🚀 Quick Start (Local Development)

### 1. Prerequisites
- Node.js (v18+)
- MongoDB Atlas Account (or local MongoDB)
- Expo CLI
- Groq API Key

### 2. Backend Setup
```bash
cd server
npm install

# Create a .env file based on the environment variables mentioned below
# Start the development server
npm run dev
```

### 3. Frontend Setup
```bash
cd client
npm install

# Create a .env file and set your API URL
# EXPO_PUBLIC_API_URL=http://<YOUR_LOCAL_IP>:5000/api

# Start the Expo Metro Bundler
npx expo start
```

---

## 🌍 Deployment

### Backend (Vercel)
The backend is fully configured to run serverless on Vercel. 
1. Link your GitHub repo to Vercel.
2. Add your `.env` variables to Vercel's Environment Settings.
3. Deploy! The `vercel.json` file handles routing automatically.

### Frontend (Expo EAS)
Generate a free, shareable Android APK using Expo Application Services (EAS):
```bash
cd client
eas build -p android --profile preview --clear-cache
```

---

## 🔑 Environment Variables

### Server (`server/.env`)
```env
PORT=5000
MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/dollay-shollay
JWT_SECRET=your_super_secret_jwt_key
GROQ_API_KEY=gsk_your_groq_api_key_here
```

### Client (`client/.env`)
```env
EXPO_PUBLIC_API_URL=https://your-vercel-deployment-url.vercel.app/api
```

---

## 📱 Screenshots & UI Showcase
*The application features a dark OLED aesthetic. Progress rings, dynamic cards, and gradient buttons create a deeply immersive experience.*

---

## 🤝 Contributing
Contributions, issues, and feature requests are welcome!
1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📜 License
Distributed under the MIT License. See `LICENSE` for more information.

<br/>
<div align="center">
  <b>Built with ❤️ by Hussain Jamal</b>
</div>
