# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Google sign-in

Google sign-in uses Google Identity Services to return an ID token to the frontend.
The backend verifies that token with Google's public signing keys and issues the
same AIQuizCraft JWT used by email/password sign-in. Google access tokens and ID
tokens are not saved in browser storage.

1. In [Google Cloud Console](https://console.cloud.google.com/), select or create
   a project and configure the OAuth consent screen under **Google Auth Platform**.
2. Under **Clients**, create an OAuth client with application type **Web application**.
3. Add each frontend site under **Authorized JavaScript origins**:
   - Local Vite development: `http://localhost:5173`
   - Production: `https://your-frontend-domain.example`
   - Add a separate origin if you also use `http://127.0.0.1:5173`.
4. Copy the Web client **Client ID** to both environment files below. The GIS
   popup flow used here does not need an authorized redirect URI.
5. The Client Secret is not used by this ID-token flow. Never put it in a
   frontend environment variable or source file. If a secret has been exposed,
   revoke it and create a replacement in Google Cloud Console.

Copy `.env.example` to `.env.local` in this frontend project and set:

```dotenv
VITE_API_URL=http://localhost:5000
VITE_GOOGLE_CLIENT_ID=your_google_oauth_web_client_id.apps.googleusercontent.com
```

Set the matching client ID on the backend in `AiQuizCraft-Backend/.env`:

```dotenv
GOOGLE_CLIENT_ID=your_google_oauth_web_client_id.apps.googleusercontent.com
```

Keep the backend `JWT_SECRET` private and set it through the backend deployment's
secret environment settings. The Google Client ID is public; the backend still
requires it to validate the token audience. Restart both development servers
after changing environment variables. In production, use the exact HTTPS frontend
origin in Google Cloud Console and set `VITE_API_URL` to the deployed backend API.

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript and enable type-aware lint rules. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
