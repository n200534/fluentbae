'use client';

import { useState, useEffect } from 'react';
import { ChatInterface } from '@/components/chat/ChatInterface';
import { ChatMessage, Emotion, User } from '@/types';
import { v4 as uuidv4 } from 'uuid';

export default function Home() {
  const [userId] = useState(() => uuidv4());
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentMood, setCurrentMood] = useState<Emotion>({ primary: 'neutral', intensity: 0.5 });
  const [user, setUser] = useState<User | null>(null);

  // Initialize user and load chat history
  useEffect(() => {
    const initializeUser = async () => {
      try {
        const response = await fetch('/api/user', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId }),
        });

        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
          setCurrentMood(data.currentMood);
          
          // Load chat history
          const chatResponse = await fetch(`/api/chat?userId=${userId}`);
          if (chatResponse.ok) {
            const chatData = await chatResponse.json();
            setMessages(chatData.messages);
          }
        }
      } catch (error) {
        console.error('Error initializing user:', error);
      }
    };

    initializeUser();
  }, [userId]);

  const handleSendMessage = async (content: string) => {
    if (!user) return;

    setIsLoading(true);
    
    try {
      // Create user message
      const userMessage: ChatMessage = {
        id: uuidv4(),
        userId,
        content,
        role: 'user',
        timestamp: new Date()
      };

      // Add user message to chat immediately
      setMessages(prev => [...prev, userMessage]);

      // Send message to API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: content, userId }),
      });

      if (response.ok) {
        const data = await response.json();
        
        // Add AI response to chat
        setMessages(prev => [...prev, data.response]);
        
        // Update current mood
        setCurrentMood(data.userEmotion);
      } else {
        throw new Error('Failed to get AI response');
      }

    } catch (error) {
      console.error('Error sending message:', error);
      
      // Add error message
      const errorMessage: ChatMessage = {
        id: uuidv4(),
        userId,
        content: "I'm sorry, I'm having trouble responding right now. Please try again.",
        role: 'assistant',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 via-rose-50 to-orange-50 dark:from-purple-900 dark:via-pink-900 dark:to-rose-900">
        <div className="text-center">
          <div className="w-24 h-24 rounded-full bg-gradient-to-r from-pink-400 to-rose-500 flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-pink-500/30 animate-pulse">
            <span className="text-white font-bold text-4xl">💕</span>
          </div>
                       <h2 className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent mb-3">
               Welcome to BabyAI! 💖
             </h2>
             <p className="text-pink-700 dark:text-pink-200 mb-6 text-lg font-medium">Setting up your sweet AI companion...</p>
          <div className="flex justify-center">
            <div className="w-10 h-10 border-4 border-pink-200 border-t-pink-500 rounded-full animate-spin"></div>
          </div>
          <p className="text-pink-500 dark:text-pink-300 mt-4 text-sm">Almost ready to chat! ✨</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full overflow-hidden">
      <ChatInterface
        userId={userId}
        onSendMessage={handleSendMessage}
        messages={messages}
        isLoading={isLoading}
        currentMood={currentMood}
      />
    </div>
  );
}
