import { fetch } from 'undici';

export class ElevenLabsService {
  private apiKey: string;
  private baseUrl: string = 'https://api.elevenlabs.io/v1';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async textToSpeech(
    text: string,
    voiceId: string,
    modelId: string = 'eleven_multilingual_v2'
  ): Promise<Buffer> {
    const url = `${this.baseUrl}/text-to-speech/${voiceId}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': this.apiKey,
      },
      body: JSON.stringify({
        text,
        model_id: modelId,
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
        },
      }),
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('ElevenLabs API key invalid');
      }
      if (response.status === 429) {
        throw new Error('ElevenLabs rate limit exceeded');
      }
      const errorText = await response.text().catch(() => 'Unknown error');
      throw new Error(`ElevenLabs API error: ${response.status} ${errorText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  sanitizeText(text: string): string {
    // Remove URLs and emails to prevent voice from reading them
    return text
      .replace(/https?:\/\/[^\s]+/g, '[URL]')
      .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL]');
  }
}
