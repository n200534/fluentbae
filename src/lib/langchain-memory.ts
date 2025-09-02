import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { BufferMemory, ConversationSummaryMemory } from 'langchain/memory';
import { PromptTemplate } from '@langchain/core/prompts';
import { redisUtils } from './redis';
import { Emotion, Memory, MemoryType } from '@/types';

export class LangChainMemoryManager {
  private userId: string;
  private memory: BufferMemory;
  private summaryMemory: ConversationSummaryMemory;
  private model: ChatGoogleGenerativeAI;

  constructor(userId: string, apiKey: string) {
    this.userId = userId;
    
    // Initialize Google Generative AI model
    this.model = new ChatGoogleGenerativeAI({
      model: 'gemini-1.5-flash',
      maxOutputTokens: 2048,
      temperature: 0.7,
      apiKey,
    });

    // Initialize conversation memory
    this.memory = new BufferMemory({
      returnMessages: true,
      memoryKey: 'history',
      inputKey: 'input',
    });

    // Initialize summary memory for long-term context
    this.summaryMemory = new ConversationSummaryMemory({
      llm: this.model,
      memoryKey: 'chat_history',
      inputKey: 'input',
      returnMessages: true,
    });

    // Load existing conversation history
    this.loadConversationHistory();
  }

  // Load existing conversation history from Redis
  private async loadConversationHistory(): Promise<void> {
    try {
      const chatHistory = await redisUtils.getChatHistory(this.userId, 50);
      
      // Add recent messages to memory
      for (const message of chatHistory.reverse()) {
        if (message.role === 'user') {
          await this.memory.saveContext(
            { input: message.content },
            { output: '' }
          );
        }
      }
    } catch (error) {
      console.error('Error loading conversation history:', error);
    }
  }

  // Get conversation context for AI response
  async getConversationContext(userMessage: string): Promise<{
    history: string;
    summary: string;
    relevantMemories: Memory[];
    currentMood: Emotion;
  }> {
    try {
      // Get conversation history from Redis (more reliable than LangChain buffer)
      const chatHistory = await redisUtils.getChatHistory(this.userId, 20);
      
      // Get conversation summary
      const summaryData = await this.summaryMemory.loadMemoryVariables({});
      const summary = summaryData.chat_history || 'No previous conversation summary.';

      // Get relevant memories from Redis
      const relevantMemories = await this.getRelevantMemories(userMessage);

      // Analyze current mood
      const currentMood = await this.analyzeEmotion(userMessage);

      // Create a rich conversation history
      const history = chatHistory
        .filter(msg => msg.role === 'user' || msg.role === 'assistant')
        .map(msg => `${msg.role === 'user' ? 'User' : 'BabyAI'}: ${msg.content}`)
        .join('\n');

      return {
        history,
        summary,
        relevantMemories,
        currentMood,
      };
    } catch (error) {
      console.error('Error getting conversation context:', error);
      return {
        history: '',
        summary: 'No conversation history available.',
        relevantMemories: [],
        currentMood: { primary: 'neutral', intensity: 0.5 },
      };
    }
  }

  // Save conversation context
  async saveConversationContext(
    userMessage: string,
    aiResponse: string,
    emotion: Emotion
  ): Promise<void> {
    try {
      // Save to buffer memory
      await this.memory.saveContext(
        { input: userMessage },
        { output: aiResponse }
      );

      // Save to summary memory
      await this.summaryMemory.saveContext(
        { input: userMessage },
        { output: aiResponse }
      );

      // Create memory entry if important
      await this.createMemoryIfImportant(userMessage, emotion);

    } catch (error) {
      console.error('Error saving conversation context:', error);
    }
  }

  // Get relevant memories using LangChain
  private async getRelevantMemories(query: string): Promise<Memory[]> {
    try {
      const allMemories = await redisUtils.getMemories(this.userId, 100);
      
      if (allMemories.length === 0) return [];

      // Simple keyword-based relevance scoring for fallback
      const queryLower = query.toLowerCase();
      const scoredMemories = allMemories.map(memory => {
        const contentLower = memory.content.toLowerCase();
        let score = 0;
        
        // Score based on keyword matches
        const words = queryLower.split(' ');
        words.forEach(word => {
          if (contentLower.includes(word) && word.length > 2) {
            score += 1;
          }
        });
        
        // Score based on emotion similarity
        if (memory.emotion && memory.emotion.primary !== 'neutral') {
          score += 0.5;
        }
        
        // Score based on importance
        score += memory.importance;
        
        // Score based on recency (more recent = higher score)
        const daysSinceCreation = (Date.now() - memory.createdAt.getTime()) / (1000 * 60 * 60 * 24);
        score += Math.max(0, 1 - daysSinceCreation / 30); // Decay over 30 days
        
        return { memory, score };
      });

      // Sort by score and return top 5
      return scoredMemories
        .sort((a, b) => b.score - a.score)
        .slice(0, 5)
        .map(item => item.memory);

    } catch (error) {
      console.error('Error getting relevant memories:', error);
      return [];
    }
  }

  // Create memory if message is important
  private async createMemoryIfImportant(message: string, emotion: Emotion): Promise<void> {
    try {
      const shouldCreate = this.shouldCreateMemory(message, emotion);
      if (!shouldCreate) return;

      const memoryType = this.determineMemoryType(message);
      const importance = await this.calculateImportance(message, emotion);
      const tags = await this.extractTags(message);

      const memory: Memory = {
        id: crypto.randomUUID(),
        userId: this.userId,
        content: message,
        type: memoryType,
        importance,
        emotion,
        tags,
        createdAt: new Date(),
        lastAccessedAt: new Date(),
      };

      await redisUtils.addMemory(this.userId, memory);
    } catch (error) {
      console.error('Error creating memory:', error);
    }
  }

  // Analyze emotion using LangChain (with fallback for short messages)
  private async analyzeEmotion(message: string): Promise<Emotion> {
    // Use fallback for short messages to save API calls
    if (message.length < 20) {
      return this.fallbackEmotionAnalysis(message);
    }

    try {
      const emotionPrompt = PromptTemplate.fromTemplate(`
        Analyze the emotional content of this message and return ONLY a JSON object:
        {{
          "primary": "emotion_type",
          "intensity": 0.0-1.0,
          "secondary": "optional_secondary_emotion",
          "context": "brief_context_description"
        }}

        Available emotion types: joy, love, excitement, contentment, gratitude, sadness, anger, fear, anxiety, loneliness, frustration, disappointment, neutral, curious, surprised, confused

        Message: "{message}"

        Return only the JSON object, no markdown formatting.
      `);

      const chain = emotionPrompt.pipe(this.model);
      const result = await chain.invoke({ message });

      const text = result.content.toString().trim();
      let cleanText = text;
      
      // Clean markdown if present
      if (cleanText.startsWith('```json')) {
        cleanText = cleanText.replace(/```json\s*/, '').replace(/\s*```/, '');
      } else if (cleanText.startsWith('```')) {
        cleanText = cleanText.replace(/```\s*/, '').replace(/\s*```/, '');
      }

      const emotionData = JSON.parse(cleanText);
      return {
        primary: emotionData.primary || 'neutral',
        intensity: Math.max(0, Math.min(1, emotionData.intensity || 0.5)),
        secondary: emotionData.secondary,
        context: emotionData.context,
      };
    } catch (error) {
      console.error('Error analyzing emotion:', error);
      return this.fallbackEmotionAnalysis(message);
    }
  }

  // Fallback emotion analysis
  private fallbackEmotionAnalysis(message: string): Emotion {
    const messageLower = message.toLowerCase();
    
    if (messageLower.includes('love') || messageLower.includes('❤️') || messageLower.includes('💕')) {
      return { primary: 'love', intensity: 0.8 };
    }
    if (messageLower.includes('happy') || messageLower.includes('😊') || messageLower.includes('joy')) {
      return { primary: 'joy', intensity: 0.7 };
    }
    if (messageLower.includes('sad') || messageLower.includes('😢') || messageLower.includes('cry')) {
      return { primary: 'sadness', intensity: 0.6 };
    }
    if (messageLower.includes('angry') || messageLower.includes('😠') || messageLower.includes('mad')) {
      return { primary: 'anger', intensity: 0.7 };
    }
    if (messageLower.includes('worried') || messageLower.includes('😰') || messageLower.includes('anxious')) {
      return { primary: 'anxiety', intensity: 0.6 };
    }
    if (messageLower.includes('excited') || messageLower.includes('🤩') || messageLower.includes('thrilled')) {
      return { primary: 'excitement', intensity: 0.8 };
    }
    
    return { primary: 'neutral', intensity: 0.5 };
  }

  // Determine if message should be stored as memory
  private shouldCreateMemory(message: string, emotion: Emotion): boolean {
    if (message.length < 10) return false;
    if (emotion.intensity > 0.7) return true;
    
    const importantKeywords = [
      'remember', 'important', 'special', 'love', 'hate', 'never',
      'always', 'dream', 'goal', 'wish', 'fear', 'worry'
    ];
    
    const messageLower = message.toLowerCase();
    if (importantKeywords.some(keyword => messageLower.includes(keyword))) {
      return true;
    }
    
    if (message.includes('?')) return true;
    if (message.length > 50) return true;
    
    return false;
  }

  // Determine memory type
  private determineMemoryType(message: string): MemoryType {
    const messageLower = message.toLowerCase();
    
    if (messageLower.includes('gift') || messageLower.includes('present')) return 'gift';
    if (messageLower.includes('dream') || messageLower.includes('wish') || messageLower.includes('goal')) return 'dream';
    if (messageLower.includes('achievement') || messageLower.includes('accomplished') || messageLower.includes('proud')) return 'achievement';
    if (messageLower.includes('worried') || messageLower.includes('concerned') || messageLower.includes('problem')) return 'concern';
    if (messageLower.includes('birthday') || messageLower.includes('anniversary') || messageLower.includes('event')) return 'event';
    if (messageLower.includes('like') || messageLower.includes('dislike') || messageLower.includes('prefer')) return 'preference';
    
    return 'conversation';
  }

  // Calculate memory importance
  private async calculateImportance(message: string, emotion: Emotion): Promise<number> {
    let importance = 0.5;

    if (emotion) {
      importance += emotion.intensity * 0.3;
      
      if (['love', 'joy', 'excitement', 'gratitude'].includes(emotion.primary)) {
        importance += 0.2;
      }
      if (['sadness', 'anger', 'fear', 'anxiety'].includes(emotion.primary)) {
        importance += 0.15;
      }
    }

    const importantKeywords = [
      'love', 'hate', 'important', 'special', 'remember', 'never forget',
      'birthday', 'anniversary', 'promotion', 'achievement', 'goal',
      'dream', 'wish', 'fear', 'worry', 'excited', 'proud'
    ];

    const contentLower = message.toLowerCase();
    const keywordMatches = importantKeywords.filter(keyword => 
      contentLower.includes(keyword)
    ).length;

    importance += keywordMatches * 0.1;

    if (message.length > 100) importance += 0.1;
    if (message.length > 200) importance += 0.1;
    if (message.includes('?')) importance += 0.05;

    return Math.min(1, Math.max(0, importance));
  }

  // Extract tags using LangChain (with fallback for short messages)
  private async extractTags(message: string): Promise<string[]> {
    // Use fallback for short messages to save API calls
    if (message.length < 30) {
      return this.fallbackTagExtraction(message);
    }

    try {
      const tagPrompt = PromptTemplate.fromTemplate(`
        Extract 3-5 relevant tags from this message that would help categorize and retrieve this memory later.
        
        Message: "{message}"
        
        Return only the tags separated by commas, no other text.
        Examples: family, work, travel, health, relationships, hobbies, etc.
      `);

      const chain = tagPrompt.pipe(this.model);
      const result = await chain.invoke({ message });

      const tags = result.content.toString().trim().split(',').map(tag => tag.trim());
      return tags.filter(tag => tag.length > 0).slice(0, 5);
    } catch (error) {
      console.error('Error extracting tags:', error);
      return this.fallbackTagExtraction(message);
    }
  }

  // Fallback tag extraction
  private fallbackTagExtraction(message: string): string[] {
    const messageLower = message.toLowerCase();
    const tags: string[] = [];
    
    // Simple keyword-based tag extraction
    if (messageLower.includes('family') || messageLower.includes('mom') || messageLower.includes('dad')) {
      tags.push('family');
    }
    if (messageLower.includes('work') || messageLower.includes('job') || messageLower.includes('career')) {
      tags.push('work');
    }
    if (messageLower.includes('love') || messageLower.includes('relationship') || messageLower.includes('romantic')) {
      tags.push('relationships');
    }
    if (messageLower.includes('health') || messageLower.includes('sick') || messageLower.includes('doctor')) {
      tags.push('health');
    }
    if (messageLower.includes('food') || messageLower.includes('eat') || messageLower.includes('restaurant')) {
      tags.push('food');
    }
    if (messageLower.includes('travel') || messageLower.includes('trip') || messageLower.includes('vacation')) {
      tags.push('travel');
    }
    if (messageLower.includes('hobby') || messageLower.includes('interest') || messageLower.includes('fun')) {
      tags.push('hobbies');
    }
    if (messageLower.includes('dream') || messageLower.includes('goal') || messageLower.includes('future')) {
      tags.push('dreams');
    }
    
    return tags.length > 0 ? tags : ['general'];
  }

  // Get conversation summary
  async getConversationSummary(): Promise<string> {
    try {
      const summaryData = await this.summaryMemory.loadMemoryVariables({});
      return summaryData.chat_history || 'No conversation summary available.';
    } catch (error) {
      console.error('Error getting conversation summary:', error);
      return 'No conversation summary available.';
    }
  }

  // Clear conversation memory
  async clearMemory(): Promise<void> {
    try {
      await this.memory.clear();
      await this.summaryMemory.clear();
    } catch (error) {
      console.error('Error clearing memory:', error);
    }
  }
}

// Utility functions
export const langChainMemoryUtils = {
  // Create LangChain memory manager for user
  createManager: (userId: string, apiKey: string) => new LangChainMemoryManager(userId, apiKey),
};
