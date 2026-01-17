import OpenAI from 'openai';
import { GitHubSignals, RoastResult } from '../types';

export class OpenAIService {
  private client: OpenAI;
  private model: string;

  constructor(apiKey: string, model: string = 'gpt-4o-mini') {
    this.client = new OpenAI({ apiKey });
    this.model = model;
  }

  private buildPrompt(signals: GitHubSignals, intensity: 'mild' | 'medium' | 'spicy'): string {
    const intensityInstructions = {
      mild: 'light-hearted and friendly',
      medium: 'playfully critical but constructive',
      spicy: 'sharp and witty but still respectful',
    };

    const repoList = signals.top_repos
      .map(
        (repo) =>
          `- ${repo.name} (${repo.language || 'No language'}, ${repo.stars} stars, ${repo.forks} forks, updated ${repo.updated_at})${repo.description ? ` - ${repo.description}` : ''}${repo.readme_snippet ? `\n  README snippet: ${repo.readme_snippet.substring(0, 300)}...` : ''}`
      )
      .join('\n');

    return `You are analyzing a GitHub developer profile. Generate a ${intensityInstructions[intensity]} roast, serious improvement advice, and a developer personality profile.

GitHub Profile Data:
- Public repos: ${signals.profile.public_repos}
- Followers: ${signals.profile.followers}
- Account created: ${signals.profile.created_at}
${signals.profile.bio ? `- Bio: ${signals.profile.bio}` : ''}
${signals.profile.location ? `- Location: ${signals.profile.location}` : ''}
${signals.profile.company ? `- Company: ${signals.profile.company}` : ''}

Top Repositories:
${repoList}

IMPORTANT CONSTRAINTS:
1. Output MUST be valid JSON only, no markdown formatting, no code blocks.
2. The roast should be tech-focused and avoid guessing personal attributes or doxxing.
3. Advice must reference only observed signals (repos, languages, recency, activity patterns).
4. Keep roast length to 2-4 sentences.
5. Provide 3-7 improvement advice bullets.
6. Personality profile should be based on code patterns, not personal traits.

Output format (JSON only):
{
  "roast": "string",
  "advice": ["string", "string", ...],
  "profile": {
    "archetype": "string (e.g., 'The Experimentalist', 'The Maintainer', 'The Specialist', etc.)",
    "strengths": ["string", "string", ...],
    "blind_spots": ["string", "string", ...]
  }
}`;
  }

  async generateRoast(
    signals: GitHubSignals,
    intensity: 'mild' | 'medium' | 'spicy'
  ): Promise<RoastResult> {
    const prompt = this.buildPrompt(signals, intensity);

    try {
      // Use Responses API (chat completions endpoint)
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that analyzes GitHub profiles and provides roasts, advice, and personality insights. Always respond with valid JSON only.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        response_format: { type: 'json_object' },
        temperature: intensity === 'spicy' ? 0.9 : intensity === 'medium' ? 0.7 : 0.5,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('Empty response from OpenAI');
      }

      // Parse JSON response
      const parsed = JSON.parse(content) as RoastResult;

      // Validate structure
      if (!parsed.roast || !Array.isArray(parsed.advice) || !parsed.profile) {
        throw new Error('Invalid response structure from OpenAI');
      }

      return parsed;
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error(`OpenAI returned invalid JSON: ${error.message}`);
      }
      if (error instanceof Error && error.message.includes('rate_limit')) {
        throw new Error('OpenAI rate limit exceeded');
      }
      throw new Error(`OpenAI API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
