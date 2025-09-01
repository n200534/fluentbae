import Redis from 'ioredis';
import { ChatMessage, GiftReminder, Memory } from '@/types';

class RedisClient {
  private client: Redis;

  constructor() {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    this.client = new Redis(redisUrl, {
      enableReadyCheck: false,
      maxRetriesPerRequest: null,
      lazyConnect: true,
    });

    this.client.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });

    this.client.on('connect', () => {
      console.log('Connected to Redis');
    });
  }

  getClient(): Redis {
    return this.client;
  }

  async disconnect(): Promise<void> {
    await this.client.disconnect();
  }
}

// Singleton Redis client
const redisClient = new RedisClient();

export class RedisUtils {
  private client: Redis;

  constructor() {
    this.client = redisClient.getClient();
  }

  // User Data Management
  async setUserData(userId: string, data: { [key: string]: string }): Promise<void> {
    const key = `user:${userId}`;
    await this.client.hset(key, data);
    await this.client.expire(key, 60 * 60 * 24 * 30); // 30 days
  }

  async getUserData(userId: string): Promise<{ [key: string]: string }> {
    const key = `user:${userId}`;
    const data = await this.client.hgetall(key);
    return data;
  }

  async updateUserData(userId: string, updates: { [key: string]: string }): Promise<void> {
    const key = `user:${userId}`;
    await this.client.hset(key, updates);
  }

  // Chat History Management
  async addChatMessage(userId: string, message: ChatMessage): Promise<void> {
    const key = `chat:${userId}`;
    const messageData = JSON.stringify({
      ...message,
      timestamp: message.timestamp.toISOString()
    });
    
    await this.client.lpush(key, messageData);
    await this.client.ltrim(key, 0, 99); // Keep last 100 messages
    await this.client.expire(key, 60 * 60 * 24 * 30); // 30 days
  }

  async getChatHistory(userId: string, limit: number = 20): Promise<ChatMessage[]> {
    const key = `chat:${userId}`;
    const messages = await this.client.lrange(key, 0, limit - 1);
    
    return messages.map(msg => {
      const parsed = JSON.parse(msg);
      return {
        ...parsed,
        timestamp: new Date(parsed.timestamp)
      };
    }).reverse(); // Return in chronological order
  }

  async clearChatHistory(userId: string): Promise<void> {
    const key = `chat:${userId}`;
    await this.client.del(key);
  }

  // Memory Management
  async addMemory(userId: string, memory: Memory): Promise<void> {
    const key = `memory:${userId}`;
    const memoryData = JSON.stringify({
      ...memory,
      createdAt: memory.createdAt.toISOString(),
      lastAccessedAt: memory.lastAccessedAt.toISOString()
    });
    
    await this.client.lpush(key, memoryData);
    await this.client.ltrim(key, 0, 999); // Keep last 1000 memories
    await this.client.expire(key, 60 * 60 * 24 * 90); // 90 days
  }

  async getMemories(userId: string, limit: number = 50): Promise<Memory[]> {
    const key = `memory:${userId}`;
    const memories = await this.client.lrange(key, 0, limit - 1);
    
    return memories.map(mem => {
      const parsed = JSON.parse(mem);
      return {
        ...parsed,
        createdAt: new Date(parsed.createdAt),
        lastAccessedAt: new Date(parsed.lastAccessedAt)
      };
    });
  }

  async getMemoriesByType(userId: string, type: string, limit: number = 20): Promise<Memory[]> {
    const allMemories = await this.getMemories(userId, 200);
    return allMemories
      .filter(memory => memory.type === type)
      .slice(0, limit);
  }

  async updateMemoryAccess(userId: string, memoryId: string): Promise<void> {
    const memories = await this.getMemories(userId, 200);
    const memory = memories.find(m => m.id === memoryId);
    
    if (memory) {
      memory.lastAccessedAt = new Date();
      await this.addMemory(userId, memory);
    }
  }

  // Gift Reminder Management
  async addGiftReminder(userId: string, reminder: GiftReminder): Promise<void> {
    const key = `gifts:${userId}`;
    const reminderData = JSON.stringify({
      ...reminder,
      date: reminder.date.toISOString(),
      createdAt: reminder.createdAt.toISOString()
    });
    
    // Use sorted set with date as score for easy date-based queries
    const score = reminder.date.getTime();
    await this.client.zadd(key, score, reminderData);
    await this.client.expire(key, 60 * 60 * 24 * 365); // 1 year
  }

  async getUpcomingGifts(userId: string, days: number = 30): Promise<GiftReminder[]> {
    const key = `gifts:${userId}`;
    const now = Date.now();
    const futureTime = now + (days * 24 * 60 * 60 * 1000);
    
    const reminders = await this.client.zrangebyscore(key, now, futureTime);
    
    return reminders.map(reminder => {
      const parsed = JSON.parse(reminder);
      return {
        ...parsed,
        date: new Date(parsed.date),
        createdAt: new Date(parsed.createdAt)
      };
    });
  }

  async getAllGiftReminders(userId: string): Promise<GiftReminder[]> {
    const key = `gifts:${userId}`;
    const reminders = await this.client.zrange(key, 0, -1);
    
    return reminders.map(reminder => {
      const parsed = JSON.parse(reminder);
      return {
        ...parsed,
        date: new Date(parsed.date),
        createdAt: new Date(parsed.createdAt)
      };
    });
  }

  async removeGiftReminder(userId: string, reminderId: string): Promise<void> {
    const reminders = await this.getAllGiftReminders(userId);
    const reminder = reminders.find(r => r.id === reminderId);
    
    if (reminder) {
      const key = `gifts:${userId}`;
      const reminderData = JSON.stringify({
        ...reminder,
        date: reminder.date.toISOString(),
        createdAt: reminder.createdAt.toISOString()
      });
      await this.client.zrem(key, reminderData);
    }
  }

  // Session Management
  async createSession(userId: string, sessionData: Record<string, unknown>): Promise<string> {
    const sessionId = `session_${userId}_${Date.now()}`;
    const key = `session:${sessionId}`;
    
    await this.client.hset(key, {
      userId,
      data: JSON.stringify(sessionData),
      createdAt: new Date().toISOString()
    });
    await this.client.expire(key, 60 * 60 * 24); // 24 hours
    
    return sessionId;
  }

  async getSession(sessionId: string): Promise<{userId: string; data: Record<string, unknown>; createdAt: Date} | null> {
    const key = `session:${sessionId}`;
    const data = await this.client.hgetall(key);
    
    if (Object.keys(data).length === 0) {
      return null;
    }
    
    return {
      userId: data.userId,
      data: JSON.parse(data.data || '{}'),
      createdAt: new Date(data.createdAt)
    };
  }

  async deleteSession(sessionId: string): Promise<void> {
    const key = `session:${sessionId}`;
    await this.client.del(key);
  }

  // Analytics and Statistics
  async getUserStats(userId: string): Promise<{
    totalMessages: number;
    totalMemories: number;
    totalGifts: number;
    lastActive: Date | null;
  }> {
    const chatKey = `chat:${userId}`;
    const memoryKey = `memory:${userId}`;
    const giftKey = `gifts:${userId}`;
    
    const [messageCount, memoryCount, giftCount, userData] = await Promise.all([
      this.client.llen(chatKey),
      this.client.llen(memoryKey),
      this.client.zcard(giftKey),
      this.getUserData(userId)
    ]);
    
    return {
      totalMessages: messageCount,
      totalMemories: memoryCount,
      totalGifts: giftCount,
      lastActive: userData.lastActiveAt ? new Date(userData.lastActiveAt) : null
    };
  }

  // Search and Query Functions
  async searchMemories(userId: string, query: string, limit: number = 10): Promise<Memory[]> {
    const memories = await this.getMemories(userId, 200);
    
    // Simple text search (in a real app, you'd use vector search)
    const queryLower = query.toLowerCase();
    const matchingMemories = memories.filter(memory => 
      memory.content.toLowerCase().includes(queryLower) ||
      memory.tags.some(tag => tag.toLowerCase().includes(queryLower))
    );
    
    return matchingMemories.slice(0, limit);
  }

  // Cleanup and Maintenance
  async cleanupExpiredData(): Promise<void> {
    // Redis handles expiration automatically, but we can add manual cleanup here if needed
    console.log('Redis cleanup completed');
  }

  // Health Check
  async healthCheck(): Promise<boolean> {
    try {
      await this.client.ping();
      return true;
    } catch (error) {
      console.error('Redis health check failed:', error);
      return false;
    }
  }

  // Get Redis client for direct access
  getRedisClient(): Redis {
    return this.client;
  }
}

// Export singleton instance
export const redisUtils = new RedisUtils();

// Export the Redis client for direct access if needed
export const getRedisClient = () => redisClient.getClient();
