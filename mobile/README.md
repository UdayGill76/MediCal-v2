# MediCal Patient Mobile App

React Native mobile application for patients to view and track medications.

## 🚀 Getting Started

### Prerequisites
- Node.js installed
- Expo CLI (or use npx)
- Expo Go app on your phone (for testing)

### Installation

1. Navigate to mobile folder:
   ```bash
   cd mobile
   ```

2. Install dependencies (already done):
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

### Running on Device

1. **Using Expo Go (Easiest)**:
   - Install "Expo Go" app on your phone (iOS/Android)
   - Scan the QR code from terminal
   - App will load on your device

2. **Using Emulator**:
   - Android: `npm run android` (requires Android Studio)
   - iOS: `npm run ios` (requires macOS + Xcode)

## 📱 Development

### Project Structure

```
mobile/
├── screens/          # App screens (Login, Calendar, etc.)
├── components/       # Reusable components
├── lib/             # Utilities, API client
├── hooks/           # Custom React hooks
├── App.tsx          # Main app entry point
└── package.json     # Dependencies
```

### API Configuration

Update `lib/config.ts` with your backend URL:
- For physical device testing: Use your computer's local IP (not localhost)
- Find your IP: `ipconfig` (Windows) or `ifconfig` (Mac/Linux)
- Example: `http://192.168.1.100:3000`

### Key Features (To Be Implemented)

- ✅ Basic app structure
- ✅ Navigation setup
- ✅ Auth context
- ⏳ Patient login
- ⏳ Calendar view
- ⏳ Medication tracking
- ⏳ Push notifications

## 🔧 Troubleshooting

### App won't connect to backend
- Make sure Next.js dev server is running (`pnpm dev` in main project)
- Update API URL in `lib/config.ts` to your local IP (not localhost)
- Check firewall settings

### Dependencies issues
- Delete `node_modules` and `package-lock.json`
- Run `npm install` again

## 📝 Notes

- This app connects to the Next.js backend at `http://localhost:3000`
- For physical device testing, replace `localhost` with your computer's IP address
- All API endpoints are in `lib/api.ts`

