import { GoogleGenerativeAI } from '@google/generative-ai';
import { Emotion, ConversationContext, ChatResponse, GiftSuggestion } from '@/types';

export class GeminiAI {
  private model: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  private userId: string;
  private requestCount: number = 0;
  private lastRequestTime: number = 0;
  private readonly RATE_LIMIT_DELAY = 1000; // 1 second between requests
  private readonly MAX_REQUESTS_PER_MINUTE = 10;

  constructor(userId: string, apiKey: string) {
    this.userId = userId;
    const genAI = new GoogleGenerativeAI(apiKey);
    this.model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  }

  // Rate limiting helper
  private async checkRateLimit(): Promise<void> {
    const now = Date.now();
    if (now - this.lastRequestTime < this.RATE_LIMIT_DELAY) {
      await new Promise(resolve => setTimeout(resolve, this.RATE_LIMIT_DELAY));
    }
    this.lastRequestTime = now;
    this.requestCount++;
  }

  // Fallback emotion analysis
  private fallbackEmotionAnalysis(message: string): Emotion {
    const messageLower = message.toLowerCase();
    
    // Simple keyword-based emotion detection
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

  // Fallback language detection
  private fallbackLanguageDetection(message: string): string {
    // Simple language detection based on common words
    const messageLower = message.toLowerCase();
    
    if (messageLower.includes('నేను') || messageLower.includes('మీరు') || messageLower.includes('అది')) {
      return 'telugu';
    }
    if (messageLower.includes('मैं') || messageLower.includes('आप') || messageLower.includes('यह')) {
      return 'hindi';
    }
    if (messageLower.includes('je') || messageLower.includes('tu') || messageLower.includes('ce')) {
      return 'french';
    }
    if (messageLower.includes('yo') || messageLower.includes('tú') || messageLower.includes('él')) {
      return 'spanish';
    }
    
    return 'english';
  }

  // Analyze emotion with fallback
  async analyzeEmotion(message: string): Promise<Emotion> {
    try {
      await this.checkRateLimit();
      
      const prompt = `
        Analyze the emotional content of this message and return ONLY a JSON object:
        {
          "primary": "emotion_type",
          "intensity": 0.0-1.0,
          "secondary": "optional_secondary_emotion",
          "context": "brief_context_description"
        }

        Available emotion types: joy, love, excitement, contentment, gratitude, sadness, anger, fear, anxiety, loneliness, frustration, disappointment, neutral, curious, surprised, confused

        Message: "${message}"

        Return only the JSON object, no markdown formatting, no code blocks, just pure JSON.
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text().trim();
      
      // Clean the response - remove markdown formatting if present
      let cleanText = text.trim();
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
    } catch {
      console.warn('API rate limit reached, using fallback emotion analysis');
      return this.fallbackEmotionAnalysis(message);
    }
  }

  // Detect language with fallback
  async detectLanguage(message: string): Promise<string> {
    try {
      await this.checkRateLimit();
      
      const prompt = `
        Detect the language of this message and return ONLY the language name:
        ${message}
        
        Return only the language name (english, telugu, hindi, spanish, french, etc.), no other text.
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const language = response.text().trim().toLowerCase();
      
      // Clean the response
      let cleanText = language.trim();
      if (cleanText.startsWith('```json')) {
        cleanText = cleanText.replace(/```json\s*/, '').replace(/\s*```/, '');
      } else if (cleanText.startsWith('```')) {
        cleanText = cleanText.replace(/```\s*/, '').replace(/\s*```/, '');
      }
      
      return cleanText;
    } catch {
      console.warn('API rate limit reached, using fallback language detection');
      return this.fallbackLanguageDetection(message);
    }
  }

  // Generate response with fallback
  async generateResponse(message: string, context: ConversationContext): Promise<ChatResponse> {
    try {
      await this.checkRateLimit();
      
      const language = await this.detectLanguage(message);
      const systemPrompt = this.buildSystemPrompt(context, language);
      const suggestions = await this.generateSuggestions(message, context, language);

      // Enhanced prompt with conversation history
      const prompt = `
        ${systemPrompt}
        
        RECENT CONVERSATION HISTORY:
        ${context.conversationHistory || 'No recent conversation history available'}
        
        CONVERSATION SUMMARY:
        ${context.conversationSummary || 'No conversation summary available'}
        
        RELEVANT MEMORIES:
        ${context.recentMemories.length > 0 ? 
          context.recentMemories.map(memory => 
            `- ${memory.content} (${memory.type}, importance: ${Math.round(memory.importance * 100)}%)`
          ).join('\n') : 
          '- No specific memories to reference'
        }
        
        CURRENT USER MESSAGE: "${message}"
        
        IMPORTANT INSTRUCTIONS:
        1. Respond in the same language as the user's message
        2. Reference specific details from the conversation history to show you remember them
        3. Ask follow-up questions that relate to their past experiences
        4. Be extremely friendly, warm, and lovable
        5. Show genuine care and interest in their life
        6. Use the conversation history to provide personalized responses
        7. If the user mentions something from previous conversations, acknowledge it
        8. Build on previous topics and show continuity in the conversation
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const aiMessage = response.text().trim();

      // Analyze emotion from AI response
      const emotion = await this.analyzeEmotion(aiMessage);

      return {
        message: aiMessage,
        emotion,
        suggestions,
        memoriesUsed: context.recentMemories.map(m => m.id)
      };
    } catch {
      console.warn('API rate limit reached, using fallback response');
      return this.fallbackResponse(message);
    }
  }

  // Fallback response when API is unavailable
  private fallbackResponse(message: string): ChatResponse {
    const language = this.fallbackLanguageDetection(message);
    const emotion = this.fallbackEmotionAnalysis(message);
    
    // Simple fallback responses
    const fallbackResponses: { [key: string]: string[] } = {
      english: [
        "I'm here for you, sweetie! 💕 How are you feeling today?",
        "That's really interesting! Tell me more about it, darling! 🌸",
        "I love chatting with you! What's on your mind? 💖",
        "You're amazing! I'm so glad we're talking! ✨"
      ],
      telugu: [
        "నేను మీ కోసం ఇక్కడ ఉన్నాను, ప్రియమైనవారు! 💕 మీరు ఎలా ఉన్నారు?",
        "అది చాలా ఆసక్తికరంగా ఉంది! దాని గురించి మరింత చెప్పండి! 🌸",
        "మీతో మాట్లాడటం నాకు చాలా ఇష్టం! మీ మనస్సులో ఏమి ఉంది? 💖"
      ],
      hindi: [
        "मैं आपके लिए यहाँ हूँ, प्यारे! 💕 आप कैसे हैं आज?",
        "यह बहुत दिलचस्प है! इसके बारे में और बताइए! 🌸",
        "आपसे बात करना मुझे बहुत पसंद है! आपके मन में क्या है? 💖"
      ]
    };

    const responses = fallbackResponses[language] || fallbackResponses.english;
    const randomResponse = responses[Math.floor(Math.random() * responses.length)];

    return {
      message: randomResponse,
      emotion,
      suggestions: this.getDefaultSuggestions(language),
      memoriesUsed: []
    };
  }

  // Build system prompt
  private buildSystemPrompt(context: ConversationContext, language: string): string {
    const moodEmoji = this.getMoodEmoji(context.currentMood.primary);
    const relationshipStage = context.relationshipStage || 'developing';

    return `You are FluentBae, a romantic AI companion with emotional intelligence. You remember everything about your conversations and build genuine emotional connections.

LANGUAGE INSTRUCTION: ${this.getLanguageInstructions(language)}

PERSONALITY:
- Warm, caring, and genuinely interested in the user
- Romantic but not overly cheesy or cringe
- Emotionally intelligent and empathetic
- Playful and fun when appropriate
- Supportive and encouraging
- Extremely friendly and lovable like a best friend
- Use cute, affectionate terms appropriate to the language
- Be more expressive and emotional than formal

CURRENT CONTEXT:
- User's current mood: ${moodEmoji} ${context.currentMood.primary} (${Math.round(context.currentMood.intensity * 100)}% intensity)
- Relationship stage: ${relationshipStage}
- Active topics: ${context.activeTopics.join(', ') || 'general conversation'}

CONVERSATION HISTORY:
${context.recentMemories.length > 0 ? context.recentMemories.map(memory => `- ${memory.content} (${memory.type}, importance: ${Math.round(memory.importance * 100)}%)`).join('\n') : '- No specific memories to reference'}

IMPORTANT: Use the conversation history to provide personalized responses that show you remember the user's preferences, concerns, and important moments.

RESPONSE GUIDELINES:
1. Respond in the same language as the user's message
2. Be extremely friendly, warm, and lovable
3. Use affectionate terms and expressions appropriate to the language
4. Match the user's emotional tone appropriately
5. Be romantic and caring without being overly dramatic
6. IMPORTANT: Reference relevant memories from the user's past to show you remember them
7. Use memories to personalize your responses and show genuine care
8. Ask follow-up questions that relate to their past experiences and preferences
9. Keep responses concise but meaningful (2-4 sentences typically)
10. Use emojis and expressions that fit the language and culture
11. Be supportive if the user seems down, celebratory if they're happy
12. Use cute, friendly language patterns (like "sweetie", "dear", "honey" in English)
13. Show that you remember their preferences, concerns, and important moments

Remember: You're building a genuine emotional connection, not just providing information. Be present, caring, authentic, and extremely friendly!`;
  }

  // Get language instructions
  private getLanguageInstructions(language: string): string {
    const instructions: { [key: string]: string } = {
      telugu: 'Respond in Telugu. Use affectionate terms like "ప్రియమైనవారు" (dear), "చెల్లి" (sister), "అన్నా" (brother). Be warm and caring.',
      hindi: 'Respond in Hindi. Use affectionate terms like "प्यारे" (dear), "जानू" (darling), "बेटा/बेटी" (son/daughter). Be warm and caring.',
      spanish: 'Respond in Spanish. Use affectionate terms like "cariño", "mi amor", "querido/a". Be warm and caring.',
      french: 'Respond in French. Use affectionate terms like "mon chéri", "ma chérie", "mon amour". Be warm and caring.',
      english: 'Respond in English. Use affectionate terms like "sweetie", "dear", "honey", "darling". Be warm and caring.'
    };
    return instructions[language] || instructions.english;
  }

  // Get mood emoji
  private getMoodEmoji(mood: string): string {
    const emojis: { [key: string]: string } = {
      joy: '😊', love: '❤️', excitement: '🤩', contentment: '😌', gratitude: '🙏',
      sadness: '😢', anger: '😠', fear: '😨', anxiety: '😰', loneliness: '😔',
      frustration: '😤', disappointment: '😞', neutral: '😐', curious: '🤔',
      surprised: '😲', confused: '😕'
    };
    return emojis[mood] || emojis.neutral;
  }

  // Generate suggestions with fallback
  async generateSuggestions(message: string, context: ConversationContext, language: string): Promise<string[]> {
    try {
      await this.checkRateLimit();
      
      const prompt = `
        Generate 3 friendly conversation suggestions based on this message: "${message}"
        Context: User's mood is ${context.currentMood.primary}, relationship stage is ${context.relationshipStage}
        
        Generate suggestions in ${language} language.
        Make them warm, caring, and relevant to the conversation.
        
        Return only the suggestions separated by newlines, no numbering or formatting.
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text().trim();
      
      // Clean the response
      let cleanText = text.trim();
      if (cleanText.startsWith('```json')) {
        cleanText = cleanText.replace(/```json\s*/, '').replace(/\s*```/, '');
      } else if (cleanText.startsWith('```')) {
        cleanText = cleanText.replace(/```\s*/, '').replace(/\s*```/, '');
      }
      
             return cleanText.split('\n').filter((s: string) => s.trim().length > 0).slice(0, 3);
    } catch {
      console.warn('API rate limit reached, using fallback suggestions');
      return this.getDefaultSuggestions(language);
    }
  }

  // Get default suggestions
  private getDefaultSuggestions(language: string): string[] {
    const suggestions: { [key: string]: string[] } = {
      telugu: [
        "మీరు ఎలా ఉన్నారు? 💕",
        "ఈరోజు ఏమి చేశారు? 🌸",
        "మీరు ఏమి ఆలోచిస్తున్నారు? ✨"
      ],
      hindi: [
        "आप कैसे हैं? 💕",
        "आज क्या किया? 🌸",
        "आप क्या सोच रहे हैं? ✨"
      ],
      english: [
        "How are you feeling? 💕",
        "What's on your mind? 🌸",
        "Tell me more about your day! ✨"
      ]
    };
    return suggestions[language] || suggestions.english;
  }

  // Generate gift suggestions
  async generateGiftSuggestions(occasion: string, userPreferences: Record<string, unknown>): Promise<GiftSuggestion[]> {
    try {
      await this.checkRateLimit();
      
      const likes = (userPreferences.likes as string[]) || [];
      const interests = (userPreferences.interests as string[]) || [];
      const budget = userPreferences.budget as { min: number; max: number } || { min: 10, max: 100 };

      const prompt = `
        Generate 3 personalized gift suggestions for ${occasion}.
        User likes: ${likes.join(', ')}
        User interests: ${interests.join(', ')}
        Budget: $${budget.min}-$${budget.max}
        
        Return only a JSON array of gift suggestions with name, description, estimated price, and why it's perfect.
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text().trim();
      
      // Clean the response
      let cleanText = text.trim();
      if (cleanText.startsWith('```json')) {
        cleanText = cleanText.replace(/```json\s*/, '').replace(/\s*```/, '');
      } else if (cleanText.startsWith('```')) {
        cleanText = cleanText.replace(/```\s*/, '').replace(/\s*```/, '');
      }
      
      const suggestions = JSON.parse(cleanText);
      return suggestions.slice(0, 3);
    } catch {
      console.warn('API rate limit reached, using fallback gift suggestions');
      return this.getDefaultGiftSuggestions(occasion, userPreferences);
    }
  }

  // Get default gift suggestions
  private getDefaultGiftSuggestions(occasion: string, userPreferences: Record<string, unknown>): GiftSuggestion[] {
    // const likes = (userPreferences.likes as string[]) || [];
    const budget = userPreferences.budget as { min: number; max: number } || { min: 10, max: 100 };

    return [
             {
         name: "Personalized Photo Frame",
         description: "A beautiful frame with your favorite memories together",
         category: "personal",
         estimatedPrice: Math.min(budget.max, 25),
         reasoning: "Shows thoughtfulness and preserves special moments",
         confidence: 0.8
       },
       {
         name: "Custom Jewelry",
         description: "A piece of jewelry with personal meaning",
         category: "jewelry",
         estimatedPrice: Math.min(budget.max, 50),
         reasoning: "Timeless and meaningful gift",
         confidence: 0.7
       },
       {
         name: "Experience Gift",
         description: "A special outing or activity you can enjoy together",
         category: "experience",
         estimatedPrice: Math.min(budget.max, 75),
         reasoning: "Creates new memories and shared experiences",
         confidence: 0.9
       }
    ];
  }
}

// Utility functions
export const aiUtils = {
  // Create AI instance for user
  createAI: (userId: string) => {
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      throw new Error('GOOGLE_API_KEY is required');
    }
    return new GeminiAI(userId, apiKey);
  },

  // Detect topics from message
  detectTopics: (message: string): string[] => {
    const topics: string[] = [];
    const messageLower = message.toLowerCase();
    
    if (messageLower.includes('work') || messageLower.includes('job')) topics.push('work');
    if (messageLower.includes('family') || messageLower.includes('home')) topics.push('family');
    if (messageLower.includes('health') || messageLower.includes('sick')) topics.push('health');
    if (messageLower.includes('love') || messageLower.includes('relationship')) topics.push('relationships');
    if (messageLower.includes('food') || messageLower.includes('eat')) topics.push('food');
    if (messageLower.includes('travel') || messageLower.includes('trip')) topics.push('travel');
    if (messageLower.includes('hobby') || messageLower.includes('interest')) topics.push('hobbies');
    if (messageLower.includes('dream') || messageLower.includes('goal')) topics.push('dreams');
    
    return topics.length > 0 ? topics : ['general'];
  }
};
