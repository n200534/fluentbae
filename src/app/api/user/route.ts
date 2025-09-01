import { NextRequest, NextResponse } from 'next/server';
import { redisUtils } from '@/lib/redis';
import { User } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'UserId is required' },
        { status: 400 }
      );
    }

    // Check if user exists
    const existingUser = await redisUtils.getUserData(userId);
    
    if (existingUser && Object.keys(existingUser).length > 0) {
      const user = JSON.parse(existingUser.data || '{}');
      const currentMood = JSON.parse(existingUser.currentMood || '{"primary":"neutral","intensity":0.5}');
      
      return NextResponse.json({
        success: true,
        user,
        currentMood,
        isNew: false
      });
    } else {
      // Create new user
      const newUser: User = {
        id: userId,
        name: 'User',
        preferences: {
          likes: [],
          dislikes: [],
          interests: [],
          communicationStyle: 'casual',
          topicsToAvoid: [],
          giftPreferences: {
            occasions: [],
            budget: { min: 10, max: 100 },
            categories: [],
            pastGifts: []
          }
        },
        personality: {
          openness: 0.5,
          conscientiousness: 0.5,
          extraversion: 0.5,
          agreeableness: 0.5,
          neuroticism: 0.5,
          romanticLevel: 0.5,
          humorLevel: 0.5
        },
        createdAt: new Date(),
        lastActiveAt: new Date()
      };
      
      const currentMood = { primary: 'neutral', intensity: 0.5 };
      
      await redisUtils.setUserData(userId, {
        data: JSON.stringify(newUser),
        currentMood: JSON.stringify(currentMood)
      });

      return NextResponse.json({
        success: true,
        user: newUser,
        currentMood,
        isNew: true
      });
    }

  } catch (error) {
    console.error('User API error:', error);
    return NextResponse.json(
      { error: 'Failed to initialize user' },
      { status: 500 }
    );
  }
}

