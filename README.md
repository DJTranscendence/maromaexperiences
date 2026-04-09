# Maroma Experiences - Site Setup & Deployment Guide

Your application code is successfully deployed to Firebase App Hosting. To make it visible at `maromaexperience.com`, follow the DNS configuration steps below using the specific records provided.

## 1. Resolving the "Site can't be reached" (NXDOMAIN) Error
The `NXDOMAIN` error indicates that your domain registrar (GoDaddy, Namecheap, etc.) does not yet know to send traffic to your Firebase backend.

### Step-by-Step DNS Setup:
1.  **Open your Domain Registrar**: Log in to your account where you purchased `maromaexperience.com`.
2.  **Navigate to DNS Management**: Find the advanced DNS settings or Name Server settings.
3.  **Update the WWW record**:
    *   **Type**: `CNAME`
    *   **Host/Name**: `www`
    *   **Value/Target**: `ghs.googlehosted.com`
4.  **Update the Root (@) record**:
    *   Firebase App Hosting typically provides two `A` records (IP addresses) in the Firebase Console under **App Hosting > [Your Backend] > Settings > Custom Domains**. 
    *   Add those IP addresses as `A` records for the `@` host.
5.  **Propagation**: Wait 1–24 hours for the changes to spread across the internet.

## 2. SEO & Search Optimization
We have implemented a high-performance SEO engine to target Schools, Corporates, and Individual travelers:
*   **Dynamic Sitemap**: Located at `/sitemap.xml` to ensure Google indexes all your tours and workshops.
*   **Robots.txt**: Located at `/robots.txt` to guide search crawlers efficiently.
*   **Targeted Metadata**: Role-specific keywords (e.g., "Educational Field Trips", "Corporate Team Building") are embedded in the site structure.
*   **PWA Ready**: A `manifest.json` has been added to allow users to "Install" the app on their mobile devices.

## 3. Technical Stack
*   **Framework**: Next.js 15 (App Router)
*   **Backend**: Firebase (Auth, Firestore, App Hosting)
*   **AI**: Genkit (Gemini 2.5 Flash) for intelligent market feedback and notifications.
*   **Notifications**: Postmark API integration for reliable threshold-based group alerts.

---
*For support with booking thresholds or admin access, please refer to the internal documentation in the /docs folder.*
