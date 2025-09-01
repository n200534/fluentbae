import { NextRequest, NextResponse } from 'next/server';
import { aiUtils } from '@/lib/gemini';
import { redisUtils } from '@/lib/redis';
import { langChainMemoryUtils } from '@/lib/langchain-memory';
import { v4 as uuidv4 } from 'uuid';
import { ChatMessage, ConversationContext } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const { message, userId } = await request.json();

    if (!message || !userId) {
      return NextResponse.json(
        { error: 'Message and userId are required' },
        { status: 400 }
      );
    }

    // Create user message
    const userMessage: ChatMessage = {
      id: uuidv4(),
      userId,
      content: message,
      role: 'user',
      timestamp: new Date()
    };

    // Add user message to chat history
    await redisUtils.addChatMessage(userId, userMessage);

    // Initialize LangChain memory manager
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      throw new Error('GOOGLE_API_KEY is required');
    }
    
    const memoryManager = langChainMemoryUtils.createManager(userId, apiKey);
    
    // Get conversation context using LangChain
    const conversationContext = await memoryManager.getConversationContext(message);
    
    // Build conversation context with LangChain memory
    const context: ConversationContext = {
      currentMood: conversationContext.currentMood,
      recentMemories: conversationContext.relevantMemories,
      activeTopics: aiUtils.detectTopics(message),
      relationshipStage: 'developing', // Will be enhanced later
      lastInteraction: new Date()
    };

    // Generate AI response
    const ai = aiUtils.createAI(userId);
    const response = await ai.generateResponse(message, context);

    // Create AI message
    const aiMessage: ChatMessage = {
      id: uuidv4(),
      userId,
      content: response.message,
      role: 'assistant',
      emotion: response.emotion,
      timestamp: new Date(),
      memoryIds: response.memoriesUsed
    };

    // Add AI message to chat history
    await redisUtils.addChatMessage(userId, aiMessage);

    // Save conversation context to LangChain memory
    await memoryManager.saveConversationContext(message, response.message, conversationContext.currentMood);

    // Update user's current mood
    await redisUtils.setUserData(userId, {
      currentMood: JSON.stringify(response.emotion)
    });

    return NextResponse.json({
      success: true,
      response: aiMessage,
      userEmotion: conversationContext.currentMood,
      suggestions: response.suggestions
    });

  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'UserId is required' },
        { status: 400 }
      );
    }

    // Get chat history
    const chatHistory = await redisUtils.getChatHistory(userId, 20);
    const messages = chatHistory.map(msg => ({
      ...msg,
      timestamp: new Date(msg.timestamp)
    }));

    // Get current mood
    const userData = await redisUtils.getUserData(userId);
    const currentMood = userData.currentMood 
      ? JSON.parse(userData.currentMood)
      : { primary: 'neutral', intensity: 0.5 };

    return NextResponse.json({
      success: true,
      messages,
      currentMood
    });

  } catch (error) {
    console.error('Chat history API error:', error);
    return NextResponse.json(
      { error: 'Failed to get chat history' },
      { status: 500 }
    );
  }
}

