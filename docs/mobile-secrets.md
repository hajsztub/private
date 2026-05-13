# Mobile Release Secrets

Use these GitHub repository secrets when you are ready to produce a signed Android App Bundle for Google Play.

## Android Signing

Required secrets:

- `ANDROID_KEYSTORE_BASE64`
- `ANDROID_KEYSTORE_PASSWORD`
- `ANDROID_KEY_ALIAS`
- `ANDROID_KEY_PASSWORD`

Create an upload keystore locally:

```bash
keytool -genkeypair -v -keystore upload-keystore.jks -storetype JKS -keyalg RSA -keysize 2048 -validity 10000 -alias upload
```

Convert it to base64:

```bash
base64 -i upload-keystore.jks
```

Paste the result into `ANDROID_KEYSTORE_BASE64`.

The GitHub Actions workflow will decode the keystore and build:

- debug APK
- release AAB

For Google Play, upload the `.aab` from the workflow artifacts.

## iOS Signing Later

iOS App Store signing requires an Apple Developer account plus certificates and provisioning profiles. The recommended next step is to set up TestFlight from a Mac first, then automate with Fastlane or GitHub Actions once the Apple signing assets are confirmed.
