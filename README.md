# Cloud Sculptor

A cozy single-page cloud drawing app built with Vite, React, TypeScript, and plain CSS.

Users draw fluffy clouds, then Cloud Sculptor turns them into floating cloud creatures with procedural traits. If the serverless OpenAI endpoint is configured, the creature name, mood, and traits can be AI-generated. If no key or endpoint is available, the app automatically falls back to the local procedural generator.

## Run locally

```bash
npm install
npm run dev
```

Open the local URL printed by Vite.

`npm run dev` starts the Vite frontend only. Passcode auth and AI generation require the serverless `api/` routes, so run the app with your deployment platform's local server when testing those features. For Vercel:

```bash
npx vercel dev
```

## OpenAI setup

Do not put `OPENAI_API_KEY` in frontend code. The included `api/generate-creature.ts` route is server-side and expects the key as an environment variable.

Create a local `.env` from `.env.example`:

```bash
cp .env.example .env
```

Then set:

```bash
OPENAI_API_KEY=your_api_key
OPENAI_MODEL=gpt-5.5
APP_PASSCODE=your_shared_passcode
```

The plain Vite dev server does not serve the `/api/*` routes. On Vercel, add `OPENAI_API_KEY` in the project environment variables before deploying.

## App access

Cloud Sculptor includes a lightweight passcode gate for public deployments. The passcode is checked by the serverless `/api/auth` route, which sets a signed HttpOnly session cookie. The OpenAI generation endpoint refuses unauthenticated requests.

Set this environment variable on your host:

```bash
APP_PASSCODE=your_shared_passcode
```

Optionally set `AUTH_SECRET` to a long random value for stable cookie signing across deployments.

## Build

```bash
npm run build
```
