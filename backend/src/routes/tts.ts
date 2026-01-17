import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { TTSRequest } from '../types';
import { ElevenLabsService } from '../services/elevenlabs';
import { ErrorResponse } from '../types';

const TTSRequestSchema = z.object({
  text: z.string().min(1).max(2000),
  voiceId: z.string().min(1),
  modelId: z.string().optional().default('eleven_multilingual_v2'),
});

export async function ttsRoutes(fastify: FastifyInstance, elevenLabsService: ElevenLabsService) {
  fastify.post<{ Body: TTSRequest }>('/tts', async (request: FastifyRequest, reply: FastifyReply) => {
    const startTime = Date.now();

    try {
      // Validate request body
      const validationResult = TTSRequestSchema.safeParse(request.body);
      if (!validationResult.success) {
        const error: ErrorResponse = {
          error: {
            code: 'BAD_REQUEST',
            message: `Validation error: ${validationResult.error.errors.map((e: { message: string }) => e.message).join(', ')}`,
          },
        };
        fastify.log.warn({ error: validationResult.error }, 'Invalid TTS request');
        return reply.code(400).send(error);
      }

      const { text, voiceId, modelId } = validationResult.data;

      // Sanitize text (remove URLs/emails)
      const sanitizedText = elevenLabsService.sanitizeText(text);

      fastify.log.info({ textLength: sanitizedText.length, voiceId, modelId }, 'TTS request received');

      try {
        const audioBuffer = await elevenLabsService.textToSpeech(sanitizedText, voiceId, modelId);
        const duration = Date.now() - startTime;

        fastify.log.info({ duration, audioSize: audioBuffer.length }, 'TTS generation completed');

        return reply
          .code(200)
          .header('Content-Type', 'audio/mpeg')
          .header('Content-Length', audioBuffer.length.toString())
          .send(audioBuffer);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown ElevenLabs error';
        fastify.log.error({ error: errorMessage }, 'ElevenLabs API error');
        const errorResponse: ErrorResponse = {
          error: {
            code: 'INTERNAL_ERROR',
            message: errorMessage,
          },
        };
        return reply.code(500).send(errorResponse);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Internal server error';
      fastify.log.error({ error: errorMessage }, 'Unexpected TTS error');
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
