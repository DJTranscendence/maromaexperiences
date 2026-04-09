# Maroma Experiences - Project Overview

Your application is currently live on the Firebase Studio backend. To resolve the "Site can't be reached" error, you must verify your DNS configuration.

## Resolving DNS_PROBE_FINISHED_NXDOMAIN

The `NXDOMAIN` error means your domain registrar (e.g., GoDaddy, Namecheap) doesn't know where to send traffic for `maromaexperience.com`. Follow these steps:

1. **Open the Console**: Go to [console.firebase.google.com](https://console.firebase.google.com/).
2. **Navigate to App Hosting**: Select your project and find the **App Hosting** section.
3. **Check Custom Domains**: Click on your backend and find the **Settings** or **Custom Domains** tab.
4. **Copy DNS Records**: Firebase will provide two `A` records (IP addresses).
5. **Update your Registrar**:
   - Go to your domain provider's DNS Management.
   - Add two `@` (root) records of type `A` with the IP addresses provided.
   - Add a `www` record of type `CNAME` pointing to `maromaexperience.com`.
6. **Wait for Propagation**: It can take 1–24 hours for DNS changes to take effect globally.

## SEO Configuration
We have implemented:
- **Dynamic Sitemap**: Located at `/sitemap.xml` to index all tours.
- **Robots.txt**: Located at `/robots.txt` for crawler guidance.
- **Role-Specific Metadata**: Optimized for Schools, Corporates, and Individuals.

## Technical Stack
- **Framework**: Next.js 15 (App Router)
- **Database**: Firebase Firestore
- **Auth**: Firebase Authentication
- **AI**: Genkit (Gemini 2.5 Flash)
- **Domain**: maromaexperience.com
