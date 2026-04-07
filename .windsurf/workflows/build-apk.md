---
description: How to build APK for Android
---

# Build APK Android - LinkUp

## Prerequisites

- Node.js 18+ installed
- EAS CLI installed globally: `npm install -g eas-cli`
- Expo account (create at https://expo.dev/signup)
- Logged in to EAS: `eas login`

## Build Commands

### 1. Install Dependencies
```bash
npm install
```

### 2. Login to EAS (if not already logged in)
```bash
eas login
```

### 3. Configure EAS Project (first time only)
```bash
eas build:configure
```

### 4. Build APK for Android

#### Development Build (with debugging)
```bash
eas build --platform android --profile development
```

#### Preview Build (internal testing APK)
```bash
eas build --platform android --profile preview
```

#### Production Build (for Play Store)
```bash
eas build --platform android --profile production
```

### 5. Local Build (requires Android SDK)
```bash
eas build --platform android --profile preview --local
```

## Build Outputs

- APK files will be available for download from the Expo dashboard
- URL will be provided in the CLI after build completion
- Builds typically take 10-20 minutes

## Configuration Files

- `app.json` - Expo configuration with Android settings
- `eas.json` - EAS Build profiles
- Package name: `com.linkup.app`

## Troubleshooting

### Build fails with memory issues
Increase Node.js memory limit:
```bash
export NODE_OPTIONS=--max-old-space-size=4096
```

### Clear cache and rebuild
```bash
eas build --platform android --profile preview --clear-cache
```

### Check build logs
Visit the build URL provided by EAS CLI to view detailed logs.

## Quick Build (One Command)

// turbo
```bash
eas build -p android --profile preview
```

This will:
1. Build the Android APK
2. Upload to EAS
3. Provide download URL when complete
