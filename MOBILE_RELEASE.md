# GOAL TCG Mobile Release Guide

This branch is prepared to wrap the existing React/Vite game with Capacitor for Android and iOS store releases.

## Current Mobile Architecture

- Web game: React + Vite, built to `dist/`
- Native wrapper: Capacitor
- App name: `GOAL TCG`
- Bundle ID / package name: `com.apphill.goaltcg`
- Web output directory: `dist`

The gameplay code remains web-first. Native SDKs such as Firebase, AdMob, RevenueCat, Meta, and TikTok should be added behind a small app service layer later, so monetization logic does not leak through game screens.

## First-Time Setup

Install dependencies:

```bash
npm install
```

Add native projects:

```bash
npm run mobile:add:android
npm run mobile:add:ios
```

Build and sync the web app into native projects:

```bash
npm run mobile:sync
```

## Android Release

Prerequisites:

- Android Studio
- JDK configured through Android Studio or `JAVA_HOME`
- Google Play Developer account

Open Android Studio:

```bash
npm run android:open
```

In Android Studio:

1. Set up signing config for release builds.
2. Build an Android App Bundle (`.aab`).
3. Upload the `.aab` to Google Play Console internal testing first.
4. Complete Data safety, content rating, app category, screenshots, icon, privacy policy, and store listing.

## iOS Release

iOS builds require macOS, Xcode, CocoaPods/SPM support, and an Apple Developer account.

Open Xcode on a Mac:

```bash
npm run ios:open
```

In Xcode:

1. Select the Apple Team.
2. Confirm bundle ID `com.apphill.goaltcg`.
3. Enable required capabilities later, especially In-App Purchase and Push Notifications when those features are added.
4. Archive the app and upload it to App Store Connect / TestFlight.
5. Complete privacy nutrition labels, age rating, screenshots, app metadata, and review notes.

## Before Adding Monetization SDKs

Add these foundations first:

1. Consent flow for GDPR/EEA and ad personalization.
2. iOS App Tracking Transparency prompt strategy.
3. Central event taxonomy for analytics and ads attribution.
4. Stable user ID generation and migration from current `localStorage` profile.
5. Remote Config defaults for economy values and ad placement switches.

Recommended SDK order:

1. Firebase Analytics, Crashlytics, Remote Config
2. RevenueCat for IAP
3. AdMob rewarded/interstitial ads
4. AppsFlyer or Adjust for attribution
5. Meta/TikTok direct SDKs if UA campaigns need stronger platform signals

## Useful Scripts

```bash
npm run build
npm run mobile:sync
npm run android:open
npm run ios:open
```
