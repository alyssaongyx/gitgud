import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { RoastRequest, ErrorResponse } from '../types';
import { GitHubService } from '../services/github';
import { OpenAIService } from '../services/openai';
import { GitHubCache, OpenAIResultCache } from '../utils/cache';

const RoastRequestSchema = z.object({
  username: z.string().min(1).max(39), // GitHub username max length
  intensity: z.enum(['mild', 'medium', 'spicy']),
  includeReadme: z.boolean().optional().default(false),
  maxRepos: z.number().int().min(1).max(20).optional().default(5),
});

export async function roastRoutes(
  fastify: FastifyInstance,
  githubService: GitHubService,
  openAIService: OpenAIService,
  githubCache: GitHubCache,
  openAICache: OpenAIResultCache
) {
  fastify.post<{ Body: RoastRequest }>('/roast', async (request: FastifyRequest, reply: FastifyReply) => {
    const requestId = uuidv4();
    const startTime = Date.now();
    const clientIp = request.ip || 'unknown';

    try {
      // Validate request body
      const validationResult = RoastRequestSchema.safeParse(request.body);
      if (!validationResult.success) {
        const error: ErrorResponse = {
          error: {
            code: 'BAD_REQUEST',
            message: `Validation error: ${validationResult.error.errors.map((e: { message: string }) => e.message).join(', ')}`,
          },
        };
        fastify.log.warn({ requestId, error: validationResult.error }, 'Invalid request');
        return reply.code(400).send(error);
      }

      const { username, intensity, includeReadme, maxRepos } = validationResult.data;

      fastify.log.info({ requestId, username, intensity, clientIp }, 'Roast request received');

      // Check cache for GitHub signals
      let signals = githubCache.get(username, maxRepos, includeReadme);
      let githubFetchTime = 0;

      if (!signals) {
        const githubStart = Date.now();
        try {
          signals = await githubService.getSignals(username, maxRepos, includeReadme);
          githubCache.set(username, maxRepos, includeReadme, signals);
          githubFetchTime = Date.now() - githubStart;
          fastify.log.info({ requestId, username, duration: githubFetchTime }, 'GitHub data fetched');
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown GitHub error';
          fastify.log.error({ requestId, username, error: errorMessage }, 'GitHub API error');
          const errorResponse: ErrorResponse = {
            error: {
              code: 'GITHUB_ERROR',
              message: errorMessage,
            },
          };
          return reply.code(500).send(errorResponse);
        }
      } else {
        fastify.log.info({ requestId, username }, 'GitHub data served from cache');
      }

      // Check cache for OpenAI result
      let result = openAICache.get(username, intensity);
      let openAIFetchTime = 0;

      if (!result) {
        const openAIStart = Date.now();
        try {
          result = await openAIService.generateRoast(signals, intensity);
          openAICache.set(username, intensity, result);
          openAIFetchTime = Date.now() - openAIStart;
          fastify.log.info({ requestId, username, intensity, duration: openAIFetchTime }, 'OpenAI response generated');
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown OpenAI error';
          fastify.log.error({ requestId, username, error: errorMessage }, 'OpenAI API error');
          const errorResponse: ErrorResponse = {
            error: {
              code: 'OPENAI_ERROR',
              message: errorMessage,
            },
          };
          return reply.code(500).send(errorResponse);
        }
      } else {
        fastify.log.info({ requestId, username, intensity }, 'OpenAI result served from cache');
      }

      const totalTime = Date.now() - startTime;
      fastify.log.info(
        {
          requestId,
          username,
          intensity,
          totalTime,
          githubFetchTime,
          openAIFetchTime,
        },
        'Roast request completed'
      );

      return reply.send({
        request_id: requestId,
        username,
        signals,
        result,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Internal server error';
      fastify.log.error({ requestId, error: errorMessage }, 'Unexpected error');
      const errorResponse: ErrorResponse = {
        error: {
          code: 'INTERNAL_ERROR',
          message: errorMessage,
        },
      };
      return reply.code(500).send(errorResponse);
    }
  });
}
