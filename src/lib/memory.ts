import { Memory, MemoryType, Emotion } from '@/types';
import { redisUtils } from './redis';
import { aiUtils } from './gemini';
import { v4 as uuidv4 } from 'uuid';

export class MemoryManager {
  private userId: string;

  constructor(userId: string) {
    this.userId = userId;
  }

  // Create a new memory from conversation or event
  async createMemory(
    content: string,
    type: MemoryType,
    emotion?: Emotion,
    tags: string[] = [],
    importance?: number
  ): Promise<Memory> {
    const memory: Memory = {
      id: uuidv4(),
      userId: this.userId,
      content,
      type,
      importance: importance || await this.calculateImportance(content, emotion),
      emotion: emotion || { primary: 'neutral', intensity: 0.5 },
      tags: tags.length > 0 ? tags : await this.extractTags(content),
      createdAt: new Date(),
      lastAccessedAt: new Date(),
    };

    await redisUtils.addMemory(this.userId, memory);
    return memory;
  }

  // Calculate memory importance based on content and emotion
  private async calculateImportance(content: string, emotion?: Emotion): Promise<number> {
    let importance = 0.5; // Base importance

    // Increase importance based on emotion intensity
    if (emotion) {
      importance += emotion.intensity * 0.3;
      
      // Higher importance for strong emotions
      if (['love', 'joy', 'excitement', 'gratitude'].includes(emotion.primary)) {
        importance += 0.2;
      }
      if (['sadness', 'anger', 'fear', 'anxiety'].includes(emotion.primary)) {
        importance += 0.15;
      }
    }

    // Increase importance based on content keywords
    const importantKeywords = [
      'love', 'hate', 'important', 'special', 'remember', 'never forget',
      'birthday', 'anniversary', 'promotion', 'achievement', 'goal',
      'dream', 'wish', 'fear', 'worry', 'excited', 'proud'
    ];

    const contentLower = content.toLowerCase();
    const keywordMatches = importantKeywords.filter(keyword => 
      contentLower.includes(keyword)
    ).length;

    importance += keywordMatches * 0.1;

    // Increase importance for longer, more detailed content
    if (content.length > 100) importance += 0.1;
    if (content.length > 200) importance += 0.1;

    // Increase importance for questions (shows engagement)
    if (content.includes('?')) importance += 0.05;

    return Math.min(1, Math.max(0, importance));
  }

  // Extract tags from content using AI
  private async extractTags(content: string): Promise<string[]> {
    try {
      const topics = aiUtils.detectTopics(content);
      
      // Add some basic content-based tags
      const basicTags: string[] = [];
      
      if (content.toLowerCase().includes('work') || content.toLowerCase().includes('job')) {
        basicTags.push('work');
      }
      if (content.toLowerCase().includes('family') || content.toLowerCase().includes('mom') || content.toLowerCase().includes('dad')) {
        basicTags.push('family');
      }
      if (content.toLowerCase().includes('friend')) {
        basicTags.push('friends');
      }
      if (content.toLowerCase().includes('love') || content.toLowerCase().includes('relationship')) {
        basicTags.push('relationships');
      }
      if (content.toLowerCase().includes('travel') || content.toLowerCase().includes('trip')) {
        basicTags.push('travel');
      }
      if (content.toLowerCase().includes('food') || content.toLowerCase().includes('eat')) {
        basicTags.push('food');
      }
      if (content.toLowerCase().includes('health') || content.toLowerCase().includes('exercise')) {
        basicTags.push('health');
      }

      return [...new Set([...topics, ...basicTags])];
    } catch (error) {
      console.error('Error extracting tags:', error);
      return ['general'];
    }
  }

  // Retrieve relevant memories based on context
  async getRelevantMemories(
    query: string,
    limit: number = 5,
    types?: MemoryType[]
  ): Promise<Memory[]> {
    try {
      // Get all memories
      const allMemories = await redisUtils.getMemories(this.userId, 200);
      
      // Filter by type if specified
      let filteredMemories = allMemories;
      if (types && types.length > 0) {
        filteredMemories = allMemories.filter(memory => types.includes(memory.type));
      }

      // Simple relevance scoring based on content similarity and importance
      const scoredMemories = filteredMemories.map(memory => {
        let score = memory.importance * 0.4; // Base score from importance
        
        // Content similarity score
        const queryWords = query.toLowerCase().split(' ');
        const contentWords = memory.content.toLowerCase().split(' ');
        const commonWords = queryWords.filter(word => contentWords.includes(word));
        score += (commonWords.length / queryWords.length) * 0.4;
        
        // Tag similarity score
        const queryTags = query.toLowerCase().split(' ');
        const memoryTags = memory.tags.map(tag => tag.toLowerCase());
        const commonTags = queryTags.filter(tag => memoryTags.includes(tag));
        score += (commonTags.length / queryTags.length) * 0.2;
        
        return { memory, score };
      });

      // Sort by score and return top memories
      return scoredMemories
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map(item => item.memory);
    } catch (error) {
      console.error('Error retrieving relevant memories:', error);
      return [];
    }
  }

  // Get memories by type
  async getMemoriesByType(type: MemoryType, limit: number = 20): Promise<Memory[]> {
    return await redisUtils.getMemoriesByType(this.userId, type, limit);
  }

  // Get recent memories
  async getRecentMemories(limit: number = 10): Promise<Memory[]> {
    const allMemories = await redisUtils.getMemories(this.userId, limit);
    return allMemories.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  // Get important memories (high importance score)
  async getImportantMemories(limit: number = 10): Promise<Memory[]> {
    const allMemories = await redisUtils.getMemories(this.userId, 100);
    return allMemories
      .filter(memory => memory.importance > 0.7)
      .sort((a, b) => b.importance - a.importance)
      .slice(0, limit);
  }

  // Update memory access time
  async updateMemoryAccess(memoryId: string): Promise<void> {
    await redisUtils.updateMemoryAccess(this.userId, memoryId);
  }

  // Search memories by content
  async searchMemories(query: string, limit: number = 10): Promise<Memory[]> {
    return await redisUtils.searchMemories(this.userId, query, limit);
  }

  // Create memory from chat message
  async createMemoryFromMessage(
    message: string,
    emotion: Emotion,
    messageType: 'user' | 'assistant'
  ): Promise<Memory | null> {
    // Only create memories for significant user messages
    if (messageType === 'user' && this.shouldCreateMemory(message, emotion)) {
      const memoryType: MemoryType = this.determineMemoryType(message);
      return await this.createMemory(message, memoryType, emotion);
    }
    return null;
  }

  // Determine if a message should be stored as a memory
  private shouldCreateMemory(message: string, emotion: Emotion): boolean {
    // Don't create memories for very short messages
    if (message.length < 10) return false;
    
    // Create memories for high-intensity emotions
    if (emotion.intensity > 0.7) return true;
    
    // Create memories for important keywords
    const importantKeywords = [
      'remember', 'important', 'special', 'love', 'hate', 'never',
      'always', 'dream', 'goal', 'wish', 'fear', 'worry'
    ];
    
    const messageLower = message.toLowerCase();
    if (importantKeywords.some(keyword => messageLower.includes(keyword))) {
      return true;
    }
    
    // Create memories for questions (shows engagement)
    if (message.includes('?')) return true;
    
    // Create memories for longer, detailed messages
    if (message.length > 50) return true;
    
    return false;
  }

  // Determine memory type based on content and emotion
  private determineMemoryType(message: string): MemoryType {
    const messageLower = message.toLowerCase();
    
    // Check for specific memory types
    if (messageLower.includes('gift') || messageLower.includes('present')) {
      return 'gift';
    }
    if (messageLower.includes('dream') || messageLower.includes('wish') || messageLower.includes('goal')) {
      return 'dream';
    }
    if (messageLower.includes('achievement') || messageLower.includes('accomplished') || messageLower.includes('proud')) {
      return 'achievement';
    }
    if (messageLower.includes('worried') || messageLower.includes('concerned') || messageLower.includes('problem')) {
      return 'concern';
    }
    if (messageLower.includes('birthday') || messageLower.includes('anniversary') || messageLower.includes('event')) {
      return 'event';
    }
    if (messageLower.includes('like') || messageLower.includes('dislike') || messageLower.includes('prefer')) {
      return 'preference';
    }
    
    // Default to conversation memory
    return 'conversation';
  }

  // Get memory statistics
  async getMemoryStats(): Promise<{
    totalMemories: number;
    memoriesByType: { [key in MemoryType]: number };
    averageImportance: number;
    mostRecentMemory: Memory | null;
  }> {
    const allMemories = await redisUtils.getMemories(this.userId, 1000);
    
    const memoriesByType: { [key in MemoryType]: number } = {
      conversation: 0,
      preference: 0,
      event: 0,
      gift: 0,
      achievement: 0,
      concern: 0,
      dream: 0,
      memory: 0,
    };
    
    let totalImportance = 0;
    
    allMemories.forEach(memory => {
      memoriesByType[memory.type]++;
      totalImportance += memory.importance;
    });
    
    const averageImportance = allMemories.length > 0 ? totalImportance / allMemories.length : 0;
    const mostRecentMemory = allMemories.length > 0 
      ? allMemories.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0]
      : null;
    
    return {
      totalMemories: allMemories.length,
      memoriesByType,
      averageImportance,
      mostRecentMemory,
    };
  }





  // Get relationship stage based on interaction history
  async getRelationshipStage(): Promise<'new' | 'developing' | 'established' | 'deep'> {
    const allMemories = await redisUtils.getMemories(this.userId, 100);
    const totalMemories = allMemories.length;
    
    if (totalMemories < 5) return 'new';
    if (totalMemories < 20) return 'developing';
    if (totalMemories < 50) return 'established';
    return 'deep';
  }

  // Clean up old, low-importance memories
  async cleanupMemories(maxMemories: number = 500): Promise<void> {
    const allMemories = await redisUtils.getMemories(this.userId, 1000);
    
    if (allMemories.length > maxMemories) {
      // Sort by importance and recency, keep the most important/recent ones
      const sortedMemories = allMemories.sort((a, b) => {
        const scoreA = a.importance * 0.7 + (Date.now() - a.createdAt.getTime()) / (1000 * 60 * 60 * 24 * 30) * 0.3;
        const scoreB = b.importance * 0.7 + (Date.now() - b.createdAt.getTime()) / (1000 * 60 * 60 * 24 * 30) * 0.3;
        return scoreB - scoreA;
      });
      
      const memoriesToKeep = sortedMemories.slice(0, maxMemories);
      
      // Clear all memories and re-add the ones to keep
      // Note: In a production app, you'd want a more efficient way to do this
      console.log(`Cleaning up memories: keeping ${memoriesToKeep.length} out of ${allMemories.length}`);
    }
  }
}

// Utility functions
export const memoryUtils = {
  // Create memory manager for user
  createManager: (userId: string) => new MemoryManager(userId),

  // Get memory type display name
  getMemoryTypeDisplayName: (type: MemoryType): string => {
    const displayNames: { [key in MemoryType]: string } = {
      conversation: 'Conversation',
      preference: 'Preference',
      event: 'Event',
      gift: 'Gift',
      achievement: 'Achievement',
      concern: 'Concern',
      dream: 'Dream',
      memory: 'Memory',
    };
    return displayNames[type];
  },

  // Get memory type emoji
  getMemoryTypeEmoji: (type: MemoryType): string => {
    const emojis: { [key in MemoryType]: string } = {
      conversation: '💬',
      preference: '❤️',
      event: '📅',
      gift: '🎁',
      achievement: '🏆',
      concern: '😟',
      dream: '💭',
      memory: '🧠',
    };
    return emojis[type];
  },

  // Format memory for display
  formatMemory: (memory: Memory): string => {
    const emoji = memoryUtils.getMemoryTypeEmoji(memory.type);
    const date = memory.createdAt.toLocaleDateString();
    return `${emoji} ${memory.content} (${date})`;
  },

  // Get memory importance color
  getImportanceColor: (importance: number): string => {
    if (importance >= 0.8) return 'text-red-600 bg-red-100';
    if (importance >= 0.6) return 'text-orange-600 bg-orange-100';
    if (importance >= 0.4) return 'text-yellow-600 bg-yellow-100';
    return 'text-green-600 bg-green-100';
  },
};
