// Core Types for BabyAI

export interface User {
  id: string;
  name: string;
  preferences: UserPreferences;
  personality: PersonalityTraits;
  createdAt: Date;
  lastActiveAt: Date;
}

export interface UserPreferences {
  likes: string[];
  dislikes: string[];
  interests: string[];
  communicationStyle: 'casual' | 'formal' | 'romantic' | 'playful';
  topicsToAvoid: string[];
  giftPreferences: GiftPreferences;
}

export interface GiftPreferences {
  occasions: string[];
  budget: {
    min: number;
    max: number;
  };
  categories: string[];
  pastGifts: Gift[];
}

export interface Gift {
  id: string;
  name: string;
  description: string;
  occasion: string;
  date: Date;
  reaction: 'loved' | 'liked' | 'neutral' | 'disliked';
  notes?: string;
}

export interface PersonalityTraits {
  openness: number; // 0-1
  conscientiousness: number; // 0-1
  extraversion: number; // 0-1
  agreeableness: number; // 0-1
  neuroticism: number; // 0-1
  romanticLevel: number; // 0-1
  humorLevel: number; // 0-1
}

export interface Memory {
  id: string;
  userId: string;
  content: string;
  type: MemoryType;
  importance: number; // 0-1
  emotion: Emotion;
  tags: string[];
  createdAt: Date;
  lastAccessedAt: Date;
  embedding?: number[];
}

export type MemoryType = 
  | 'conversation'
  | 'preference'
  | 'event'
  | 'gift'
  | 'achievement'
  | 'concern'
  | 'dream'
  | 'memory';

export interface Emotion {
  primary: EmotionType;
  intensity: number; // 0-1
  secondary?: EmotionType;
  context?: string;
}

export type EmotionType = 
  | 'joy'
  | 'love'
  | 'excitement'
  | 'contentment'
  | 'gratitude'
  | 'sadness'
  | 'anger'
  | 'fear'
  | 'anxiety'
  | 'loneliness'
  | 'frustration'
  | 'disappointment'
  | 'neutral'
  | 'curious'
  | 'surprised'
  | 'confused';

export interface ChatMessage {
  id: string;
  userId: string;
  content: string;
  role: 'user' | 'assistant';
  emotion?: Emotion;
  timestamp: Date;
  memoryIds?: string[]; // Associated memories
}

export interface ChatSession {
  id: string;
  userId: string;
  messages: ChatMessage[];
  mood: Emotion;
  startedAt: Date;
  lastMessageAt: Date;
}

export interface MoodTracking {
  userId: string;
  date: Date;
  overallMood: Emotion;
  moodHistory: EmotionEntry[];
  triggers: string[];
  notes?: string;
}

export interface EmotionEntry {
  emotion: EmotionType;
  intensity: number;
  timestamp: Date;
  context?: string;
}

export interface GiftReminder {
  id: string;
  userId: string;
  occasion: string;
  date: Date;
  suggestedGifts: GiftSuggestion[];
  isCompleted: boolean;
  notes?: string;
  createdAt: Date;
}

export interface GiftSuggestion {
  name: string;
  description: string;
  category: string;
  estimatedPrice: number;
  reasoning: string;
  confidence: number; // 0-1
}

export interface ConversationContext {
  currentMood: Emotion;
  recentMemories: Memory[];
  activeTopics: string[];
  relationshipStage: 'new' | 'developing' | 'established' | 'deep';
  lastInteraction: Date;
  conversationHistory?: string;
  conversationSummary?: string;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ChatResponse {
  message: string;
  emotion: Emotion;
  memoriesUsed: string[];
  suggestions?: string[];
}

// Configuration Types
export interface AppConfig {
  maxMemoriesPerUser: number;
  memoryRetentionDays: number;
  emotionTrackingEnabled: boolean;
  giftRemindersEnabled: boolean;
  maxChatHistory: number;
}

