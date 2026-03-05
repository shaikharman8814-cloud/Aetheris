
export interface Source {
  title: string;
  url: string;
  favicon?: string;
  thumbnail?: string;
  authorityScore: number; // 1-100
  freshnessScore: number; // 1-100
  agreementScore: number; // 1-100
  trustLevel: 'High' | 'Medium' | 'Low';
}

export type AppMode = 'Search' | 'Research' | 'Debate' | 'Teach' | 'Decide' | 'Code' | 'Agent' | 'Project' | 'Mission';

export interface ReasoningStep {
  label: string;
  status: 'complete' | 'active' | 'pending';
  description?: string;
}

export interface Attachment {
  url: string;
  name: string;
  type: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  attachments?: Attachment[];
  sources?: Source[];
  providerUsed?: 'OpenAI';
  timestamp: number;
  mode?: AppMode;
  confidenceScore?: number;
  confidenceLevel?: 'High' | 'Medium' | 'Low';
  confidenceReason?: string;
  reasoningSteps?: ReasoningStep[];
  isUpdating?: boolean;
  generatedImage?: string;
}

export enum AppStatus {
  IDLE = 'IDLE',
  SEARCHING = 'SEARCHING',
  GENERATING_IMAGE = 'GENERATING_IMAGE',
  THINKING = 'THINKING',
  ERROR = 'ERROR'
}

export interface SearchResult {
  query: string;
  answer: string;
  sources: Source[];
}
