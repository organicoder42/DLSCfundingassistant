// types/index.ts

import { Source, CallType, MessageRole } from '@prisma/client';

export { Source, CallType, MessageRole };

export interface FundingCall {
  id: string;
  title: string;
  titleEn?: string | null;
  description: string;
  descriptionEn?: string | null;
  source: Source;
  type: CallType;
  sectors: string[];
  targetAudience: string[];
  minAmount?: number | null;
  maxAmount?: number | null;
  coFinancing?: number | null;
  deMinimis: boolean;
  openDate?: Date | null;
  deadline: Date;
  url: string;
  applicationUrl?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  scrapedAt?: Date | null;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt?: Date;
}

export interface ChatConversation {
  id: string;
  sessionId: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

export interface KnowledgeBase {
  id: string;
  title: string;
  content: string;
  category: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CallFilters {
  search?: string;
  source?: Source[];
  type?: CallType[];
  minAmount?: number;
  maxAmount?: number;
  sectors?: string[];
  deadline_after?: Date;
  deadline_before?: Date;
  page?: number;
  limit?: number;
}

export interface CallsResponse {
  calls: FundingCall[];
  total: number;
  page: number;
  pages: number;
}

export interface SearchResponse {
  calls: FundingCall[];
  relevanceScores: number[];
}

export interface ChatRequest {
  message: string;
  conversationId?: string;
  sessionId: string;
}

export interface ChatResponse {
  conversationId: string;
  content: string;
}
