# Maroma Experiences - Project Overview

Your application is currently live on the Firebase Studio backend. To link your custom domain, follow the instructions below.

## Linking maromaexperience.com

To connect your custom domain to this App Hosting backend, follow these steps in the Firebase Console:

1. **Open the Console**: Go to [console.firebase.google.com](https://console.firebase.google.com/).
2. **Select App Hosting**: In the left sidebar, navigate to the **App Hosting** section.
3. **Select Your Backend**: Click on your active backend (e.g., `studio-139117361-c9162`).
4. **Navigate to Settings**: Click the **Settings** tab at the top of the page.
5. **Add Custom Domain**:
   - Scroll down to the **Custom domains** section.
   - Click **Add domain**.
   - Enter `maromaexperience.com`.
   - You should also repeat this for `www.maromaexperience.com` if you want both to work.
6. **DNS Verification**:
   - Firebase will provide you with a few DNS records (likely `A` and `AAAA` records).
   - Log in to your domain registrar's website (where you bought the domain).
   - Go to the **DNS Management** or **Advanced DNS** settings for your domain.
   - Add the records provided by Firebase.
7. **Wait for Propagation**: It can take anywhere from a few minutes to 24 hours for DNS changes to take effect and for the SSL certificate to be issued.

## Technical Stack
- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS + ShadCN UI
- **Database**: Firebase Firestore
- **Auth**: Firebase Authentication
- **AI**: Genkit (Gemini 2.5 Flash)
- **Domain**: maromaexperience.com