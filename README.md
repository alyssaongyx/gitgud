# GitGud — Technical Requirements (Chrome Extension + Backend)

GitGud is a Chrome extension that analyzes a public GitHub profile and generates:
1) a comedic roast,
2) serious improvement advice,
3) a “developer personality profile,”
and can optionally speak the roast aloud using ElevenLabs TTS.

---

## 1) Goals
- Fast, crowd-pleaser demo: paste a GitHub username → instant roast + actionable feedback.
- Ship as a Manifest V3 Chrome extension with a minimal backend (keys stay server-side).
- No RAG / vector DB. Use only GitHub REST API signals + OpenAI prompt.
- Add TTS playback for the roast (ElevenLabs).

---

## 2) Non-Goals
- No analysis of private repos (unless later adding GitHub OAuth + explicit consent).
- No long-term storage of GitHub content; short caching is allowed.
- No “autonomous agent” actions (opening PRs, editing repos, etc.).

---

## 3) High-Level Architecture

### 3.1 Components
**Chrome Extension (MV3)**
- Popup UI (primary user experience)
- Background service worker (network + orchestration)
- Optional content script for `github.com/*` (prefill username / inject “Roast” button)

**Backend API (server)**
- `/roast`: fetch GitHub signals → call OpenAI Responses API → return structured JSON
- `/tts`: call ElevenLabs Text-to-Speech → return MP3 bytes (`audio/mpeg`) [web:82]

### 3.2 Data Flow
1. Popup (or content script) sends message to background service worker using Chrome message passing [web:58].
2. Background calls backend over HTTPS.
3. Backend calls:
   - GitHub REST API for user + repos (+ optional README snippets) [web:37][web:77][web:39]
   - OpenAI Responses API (`POST /v1/responses`) to generate roast/advice/profile [web:51]
   - ElevenLabs “Create speech” endpoint for TTS [web:82]
4. Background returns results to popup and popup renders + plays audio.

---

## 4) Backend Requirements

### 4.1 Tech Stack
- Node.js 20+
- TypeScript
- Fastify (or Express; Fastify recommended for speed + simplicity)
- CORS enabled (extension calls backend)
- Validation: Zod (or equivalent)
- OpenAI: official Node SDK (`openai`) calling Responses API [web:51]
- GitHub/ElevenLabs: `fetch`

### 4.2 Secrets & Configuration
Environment variables:
- `OPENAI_API_KEY` (required)
- `ELEVENLABS_API_KEY` (required; used via `xi-api-key` header) [web:82]
- `GITHUB_TOKEN` (optional but recommended)
- `PORT`
- `CORS_ALLOW_ORIGINS` (recommended in production; allow-list)

Hard requirements:
- Never return secrets to clients.
- Never log secrets (keys/tokens) in request/response logs.

### 4.3 API Endpoints

#### `POST /roast`
**Purpose:** Generate roast + advice + personality profile.

Request JSON:
```json
{
  "username": "octocat",
  "intensity": "mild|medium|spicy",
  "includeReadme": false,
  "maxRepos": 5
}

