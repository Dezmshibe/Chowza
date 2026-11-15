# Chowza Customer + Chowza Business Android builds

Both Android apps are built from this project and connect to the same Supabase project.
They have separate launch experiences and separate Android application IDs.

## App identities

- Customer: `za.co.mshibegroup.chowza.customer` (display name: Chowza)
- Business: `za.co.mshibegroup.chowza.business` (display name: Chowza Business)

## Environment

Keep your existing `.env.local` file with the Supabase project URL and public anon/publishable key.
Never put a Supabase service-role key in a Vite environment file.

The repository includes:
- `.env.customer` -> `VITE_APP_TARGET=customer`
- `.env.business` -> `VITE_APP_TARGET=business`

## Build and install both Android apps (Windows PowerShell)

Run these commands from the project root. Ensure Android Studio/SDK and Java are installed.

```powershell
npm install

# 1. Build customer bundle, copy it into Android, and build the customer APK
npm run build:customer
npx cap sync android
cd android
.\gradlew.bat assembleCustomerDebug
cd ..

# Save the customer APK before the next sync overwrites Android web assets
New-Item -ItemType Directory -Force -Path .\release-apks | Out-Null
Copy-Item .\android\app\build\outputs\apk\customer\debug\app-customer-debug.apk .\release-apks\Chowza-Customer-debug.apk

# 2. Build business bundle, copy it into Android, and build the business APK
npm run build:business
npx cap sync android
cd android
.\gradlew.bat assembleBusinessDebug
cd ..

Copy-Item .\android\app\build\outputs\apk\business\debug\app-business-debug.apk .\release-apks\Chowza-Business-debug.apk
```

Install on a connected Android phone (USB debugging enabled):

```powershell
adb install -r .\release-apks\Chowza-Customer-debug.apk
adb install -r .\release-apks\Chowza-Business-debug.apk
```

The two application IDs differ, so both can be installed at the same time.

## Important verification before release

1. Confirm customer app opens on the marketplace and can browse published stores.
2. Confirm business app opens directly on business login/dashboard, not the customer marketplace.
3. Test business sign-in, sign-out, password reset, and role enforcement.
4. Test order creation in customer app and visibility/status updates in business app.
5. Verify Supabase Row Level Security policies isolate each business's data.
6. Verify payment provider redirects and webhook verification on the production domain.
7. Test Android back navigation, network loss, and app resume.
8. Configure Supabase Auth redirect URLs / deep links if password reset or OAuth returns to the installed app.

## Notes

- The regular `npm run build` web marketplace is unchanged.
- The customer build intentionally does not expose the business portal at `/business`; public store pages such as `/business/restaurant-slug` remain available.
- The business build opens the business app directly.
- Android product flavors share one Android Studio project but install as two separate apps.
- No live Supabase schema, RLS policy, payment provider, or production deployment was modified by this change.
- This ZIP does not include `.env.local` or any private credentials.
