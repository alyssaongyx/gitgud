# GitGud Backend

Backend API server for the GitGud Chrome extension.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the root directory:
```env
OPENAI_API_KEY=your_openai_api_key_here
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
GITHUB_TOKEN=your_github_token_here  # Optional but recommended
PORT=3000
OPENAI_MODEL=gpt-4o-mini
ALLOWED_ORIGINS=chrome-extension://your-extension-id
```

3. Build the project:
```bash
npm run build
```

4. Start the server:
```bash
npm start
```

Or run in development mode with hot reload:
```bash
npm run dev
```

## API Endpoints

### POST /roast

Generate a roast, advice, and personality profile for a GitHub user.

**Request:**
```json
{
  "username": "octocat",
  "intensity": "mild",
  "includeReadme": false,
  "maxRepos": 5
}
```

**Response:**
```json
{
  "request_id": "uuid",
  "username": "octocat",
  "signals": {
    "profile": {
      "public_repos": 8,
      "followers": 10,
      "created_at": "2011-01-25T18:44:36Z"
    },
    "top_repos": [...]
  },
  "result": {
    "roast": "...",
    "advice": ["..."],
    "profile": {
      "archetype": "...",
      "strengths": ["..."],
      "blind_spots": ["..."]
    }
  }
}
```

### POST /tts

Convert text to speech using ElevenLabs.

**Request:**
```json
{
  "text": "Your roast text here",
  "voiceId": "voice-id",
  "modelId": "eleven_multilingual_v2"
}
```

**Response:**
- Content-Type: `audio/mpeg`
- Body: MP3 audio bytes

### GET /health

Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Features

- **Caching**: GitHub responses cached for 5 minutes, OpenAI results cached for 10 minutes
- **Rate Limiting**: 10 requests per minute per IP address
- **CORS**: Configurable allowed origins
- **Logging**: Request IDs, timing information, and error logging
- **Validation**: Input validation using Zod schemas

## Environment Variables

- `OPENAI_API_KEY` (required): OpenAI API key
- `ELEVENLABS_API_KEY` (required): ElevenLabs API key
- `GITHUB_TOKEN` (optional): GitHub personal access token for higher rate limits
- `PORT` (optional): Server port (default: 3000)
- `OPENAI_MODEL` (optional): OpenAI model to use (default: gpt-4o-mini)
- `ALLOWED_ORIGINS` (optional): Comma-separated list of allowed CORS origins
- `LOG_LEVEL` (optional): Logging level (default: info)
- `NODE_ENV` (optional): Environment (development/production)
