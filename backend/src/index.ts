// Load environment variables from .env file FIRST
import dotenv from 'dotenv';
import { resolve } from 'path';

// Explicitly load .env from project root (works regardless of where script is run from)
// process.cwd() returns the current working directory when the process was started
dotenv.config({ path: resolve(process.cwd(), '.env') });

import Fastify, { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import cors from '@fastify/cors';
import { GitHubService } from './services/github';
import { OpenAIService } from './services/openai';
import { ElevenLabsService } from './services/elevenlabs';
import { GitHubCache, OpenAIResultCache } from './utils/cache';
import { RateLimiter } from './utils/rateLimiter';
import { roastRoutes } from './routes/roast';
import { ttsRoutes } from './routes/tts';

// Load environment variables
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const PORT = parseInt(process.env.PORT || '3000', 10);
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS?.split(',').filter(Boolean) || [];
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

// Validate required environment variables
if (!OPENAI_API_KEY) {
  console.error('ERROR: OPENAI_API_KEY is required');
  process.exit(1);
}

if (!ELEVENLABS_API_KEY) {
  console.error('ERROR: ELEVENLABS_API_KEY is required');
  process.exit(1);
}

// Initialize services
const githubService = new GitHubService(GITHUB_TOKEN);
const openAIService = new OpenAIService(OPENAI_API_KEY, OPENAI_MODEL);
const elevenLabsService = new ElevenLabsService(ELEVENLABS_API_KEY);

// Initialize caches
const githubCache = new GitHubCache(5 * 60 * 1000); // 5 minutes
const openAICache = new OpenAIResultCache(10 * 60 * 1000); // 10 minutes

// Initialize rate limiter
const rateLimiter = new RateLimiter(10, 60 * 1000); // 10 requests per minute

// Create Fastify instance
const fastify = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info',
    transport: process.env.NODE_ENV === 'development' ? {
      target: 'pino-pretty',
      options: {
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname',
      },
    } : undefined,
  },
  trustProxy: true, // For getting real IP behind proxy
});

// Register CORS
fastify.register(cors, {
  origin: (origin: string | undefined, cb: (err: Error | null, allow?: boolean) => void) => {
    // Allow requests with no origin (like mobile apps, curl, Postman)
    if (!origin) {
      return cb(null, true);
    }

    // If ALLOWED_ORIGINS is empty, allow all origins (development only)
    if (ALLOWED_ORIGINS.length === 0) {
      if (process.env.NODE_ENV === 'production') {
        console.warn('WARNING: CORS is allowing all origins in production. Set ALLOWED_ORIGINS.');
      }
      return cb(null, true);
    }

    // Check if origin is in allow list
    if (ALLOWED_ORIGINS.includes(origin)) {
      return cb(null, true);
    }

    // Reject origin
    cb(new Error('Not allowed by CORS'), false);
  },
  credentials: true,
});

// Rate limiting middleware
fastify.addHook('onRequest', async (request: FastifyRequest, reply: FastifyReply) => {
  const ip = request.ip || 'unknown';
  const check = rateLimiter.check(ip);

  if (!check.allowed) {
    reply.code(429).send({
      error: {
        code: 'RATE_LIMIT',
        message: `Rate limit exceeded. Try again after ${new Date(check.resetAt).toISOString()}`,
      },
    });
    return;
  }

  reply.header('X-RateLimit-Remaining', check.remaining.toString());
  reply.header('X-RateLimit-Reset', check.resetAt.toString());
});

// Root endpoint - API information
fastify.get('/', async () => {
  return {
    name: 'GitGud Backend API',
    version: '1.0.0',
    description: 'Backend API for GitGud Chrome extension',
    endpoints: {
      'GET /': 'API information (this endpoint)',
      'GET /health': 'Health check endpoint',
      'POST /roast': 'Generate roast, advice, and personality profile for a GitHub user',
      'POST /tts': 'Convert text to speech using ElevenLabs',
    },
    timestamp: new Date().toISOString(),
  };
});

// Health check endpoint
fastify.get('/health', async () => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

// Register routes
fastify.register(async (fastify: FastifyInstance) => {
  await roastRoutes(fastify, githubService, openAIService, githubCache, openAICache);
});

fastify.register(async (fastify: FastifyInstance) => {
  await ttsRoutes(fastify, elevenLabsService);
});

// Start server
const start = async () => {
  try {
    await fastify.listen({ port: PORT, host: '0.0.0.0' });
    console.log(`🚀 GitGud backend server listening on port ${PORT}`);
    console.log(`📝 OpenAI model: ${OPENAI_MODEL}`);
    console.log(`🔒 CORS: ${ALLOWED_ORIGINS.length > 0 ? `Restricted to ${ALLOWED_ORIGINS.length} origin(s)` : 'Allowing all origins (development mode)'}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
