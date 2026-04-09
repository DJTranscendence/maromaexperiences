# Maroma Experiences - Site Setup & Deployment Guide

Your application code is successfully deployed to Firebase App Hosting. To make it visible at `maromaexperience.com`, follow the DNS configuration steps below.

## 1. Resolving the "Site can't be reached" (NXDOMAIN) Error
The `NXDOMAIN` error indicates that your domain registrar does not yet know to send traffic to your Firebase backend.

### Step-by-Step DNS Setup:
1.  **Open the Firebase Console**: Go to [console.firebase.google.com](https://console.firebase.google.com/).
2.  **Navigate to App Hosting**: Select your project, then find the **App Hosting** section in the left sidebar.
3.  **Find Your Backend**: Click on your project's backend name.
4.  **Custom Domains**: Go to the **Settings** tab and find the **Custom Domains** section.
5.  **Copy Records**: Firebase will provide two `A` records (IP addresses).
6.  **Update Your Registrar (GoDaddy, Namecheap, etc.)**:
    *   Log in to your domain provider's account.
    *   Find the **DNS Management** or **Name Server** settings for `maromaexperience.com`.
    *   **Delete** any old `A` records for the `@` host.
    *   **Add two new `A` records**: Host: `@`, Value: [The IP addresses provided by Firebase].
    *   **Add a `CNAME` record**: Host: `www`, Value: `maromaexperience.com`.
7.  **Propagation**: Wait 1–24 hours for the changes to spread across the internet.

## 2. SEO & Search Optimization
We have implemented a high-performance SEO engine:
*   **Dynamic Sitemap**: Located at `/sitemap.xml` to ensure Google indexes all your tours.
*   **Robots.txt**: Located at `/robots.txt` to guide search crawlers efficiently.
*   **Targeted Metadata**: Roles for Schools, Corporates, and Individuals are baked into every page.
*   **PWA Ready**: A `manifest.json` has been added to allow users to "Install" the app on their phones.

## 3. Technical Stack
*   **Framework**: Next.js 15 (App Router)
*   **Backend**: Firebase (Auth, Firestore, App Hosting)
*   **AI**: Genkit (Gemini 2.5 Flash)
*   **Notifications**: Postmark API integration for group thresholds.

---
*For support with booking thresholds or admin access, please refer to the internal documentation in the /docs folder.*
