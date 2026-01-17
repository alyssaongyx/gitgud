export interface RoastRequest {
  username: string;
  intensity: 'mild' | 'medium' | 'spicy';
  includeReadme?: boolean;
  maxRepos?: number;
}

export interface GitHubProfile {
  login: string;
  public_repos: number;
  followers: number;
  following: number;
  created_at: string;
  bio?: string | null;
  location?: string | null;
  company?: string | null;
}

export interface GitHubRepo {
  name: string;
  full_name: string;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  updated_at: string;
  description: string | null;
  default_branch: string;
  readme_content?: string | null;
}

export interface GitHubSignals {
  profile: {
    public_repos: number;
    followers: number;
    created_at: string;
    bio?: string | null;
    location?: string | null;
    company?: string | null;
  };
  top_repos: Array<{
    name: string;
    language: string | null;
    stars: number;
    forks: number;
    updated_at: string;
    description?: string | null;
    readme_snippet?: string | null;
  }>;
}

export interface RoastResult {
  roast: string;
  advice: string[];
  profile: {
    archetype: string;
    strengths: string[];
    blind_spots: string[];
  };
}

export interface RoastResponse {
  request_id: string;
  username: string;
  signals: GitHubSignals;
  result: RoastResult;
}

export interface ErrorResponse {
  error: {
    code: 'BAD_REQUEST' | 'GITHUB_ERROR' | 'OPENAI_ERROR' | 'RATE_LIMIT' | 'INTERNAL_ERROR';
    message: string;
  };
}

export interface TTSRequest {
  text: string;
  voiceId: string;
  modelId?: string;
}
