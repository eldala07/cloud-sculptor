# Cloud Sculptor

A cozy single-page cloud drawing app built with Vite, React, TypeScript, and plain CSS.

Users draw fluffy clouds, then Cloud Sculptor turns them into floating cloud creatures with procedural traits. If the serverless OpenAI endpoint is configured, the creature name, mood, and traits can be AI-generated. If no key or endpoint is available, the app automatically falls back to the local procedural generator.

## Run locally

```bash
npm install
npm run dev
```

Open the local URL printed by Vite.

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
```

The plain Vite dev server will still run the app, but it will use the local procedural fallback unless your host/dev environment also serves the `/api/generate-creature` serverless route. On Vercel, add `OPENAI_API_KEY` in the project environment variables before deploying.

## Build

```bash
npm run build
```
