import { GiftReminder, GiftSuggestion, User, Gift } from '@/types';
import { redisUtils } from '@/lib/redis';
import { aiUtils } from '@/lib/gemini';
import { v4 as uuidv4 } from 'uuid';

export class GiftReminderManager {
  private userId: string;

  constructor(userId: string) {
    this.userId = userId;
  }

  // Create a new gift reminder
  async createGiftReminder(
    occasion: string,
    date: Date,
    notes?: string
  ): Promise<GiftReminder> {
    const reminder: GiftReminder = {
      id: uuidv4(),
      userId: this.userId,
      occasion,
      date,
      suggestedGifts: [],
      isCompleted: false,
      notes,
      createdAt: new Date(),
    };

    // Generate gift suggestions
    const user = await this.getUser();
    if (user) {
      reminder.suggestedGifts = await this.generateGiftSuggestions(
        occasion,
        user.preferences.giftPreferences as unknown as Record<string, unknown>
      );
    }

    // Save reminder
    await redisUtils.addGiftReminder(this.userId, reminder);
    
    return reminder;
  }

  // Generate personalized gift suggestions
  private async generateGiftSuggestions(
    occasion: string,
    giftPreferences: Record<string, unknown>
  ): Promise<GiftSuggestion[]> {
    const ai = aiUtils.createAI(this.userId);
    
    try {
      const suggestions = await ai.generateGiftSuggestions(
        occasion,
        giftPreferences
      );

      return suggestions.map((suggestion: GiftSuggestion) => {
        return {
          name: suggestion.name,
          description: suggestion.description,
          category: suggestion.category,
          estimatedPrice: suggestion.estimatedPrice,
          reasoning: suggestion.reasoning,
          confidence: suggestion.confidence
        };
      });
    } catch (error) {
      console.error('Error generating gift suggestions:', error);
      return this.getDefaultGiftSuggestions(occasion, giftPreferences);
    }
  }

  // Get default gift suggestions when AI fails
  private getDefaultGiftSuggestions(
    occasion: string,
    giftPreferences: Record<string, unknown>
  ): GiftSuggestion[] {
    const defaultGifts: { [key: string]: GiftSuggestion[] } = {
      birthday: [
        {
          name: 'Personalized Photo Book',
          description: 'A custom photo book with your favorite memories together',
          category: 'Personal',
          estimatedPrice: 25,
          reasoning: 'A thoughtful, personal gift that shows you care',
          confidence: 0.8,
        },
        {
          name: 'Gourmet Chocolate Box',
          description: 'Premium chocolates from their favorite brand',
          category: 'Food & Treats',
          estimatedPrice: 35,
          reasoning: 'Everyone loves good chocolate, especially on special occasions',
          confidence: 0.7,
        },
      ],
      anniversary: [
        {
          name: 'Custom Jewelry',
          description: 'A piece of jewelry with a personal touch or engraving',
          category: 'Jewelry',
          estimatedPrice: 75,
          reasoning: 'Jewelry is a classic romantic gift for anniversaries',
          confidence: 0.9,
        },
        {
          name: 'Romantic Dinner Experience',
          description: 'A reservation at their favorite restaurant or a home-cooked meal',
          category: 'Experience',
          estimatedPrice: 50,
          reasoning: 'Quality time together is the best gift',
          confidence: 0.8,
        },
      ],
      valentine: [
        {
          name: 'Love Letter Collection',
          description: 'A handwritten collection of love letters and memories',
          category: 'Personal',
          estimatedPrice: 15,
          reasoning: 'Nothing beats a heartfelt, handwritten love letter',
          confidence: 0.9,
        },
        {
          name: 'Spa Day Gift Certificate',
          description: 'A relaxing spa experience for two',
          category: 'Experience',
          estimatedPrice: 100,
          reasoning: 'A relaxing experience shows you care about their wellbeing',
          confidence: 0.8,
        },
      ],
      christmas: [
        {
          name: 'Cozy Winter Accessories',
          description: 'A warm scarf, gloves, or blanket for the winter season',
          category: 'Clothing & Accessories',
          estimatedPrice: 40,
          reasoning: 'Practical and thoughtful for the winter season',
          confidence: 0.7,
        },
        {
          name: 'Holiday Experience',
          description: 'Tickets to a holiday show, ice skating, or winter festival',
          category: 'Experience',
          estimatedPrice: 60,
          reasoning: 'Creating memories together during the holiday season',
          confidence: 0.8,
        },
      ],
    };

    return defaultGifts[occasion.toLowerCase()] || [
      {
        name: 'Thoughtful Personal Gift',
        description: 'Something that shows you know and care about them',
        category: 'Personal',
        estimatedPrice: (giftPreferences.budget as {min: number; max: number}).min + 
          ((giftPreferences.budget as {min: number; max: number}).max - (giftPreferences.budget as {min: number; max: number}).min) / 2,
        reasoning: 'A personal touch is always appreciated',
        confidence: 0.6,
      },
    ];
  }

  // Categorize gift based on name/description
  private categorizeGift(giftName: string): string {
    const lowerName = giftName.toLowerCase();
    
    if (lowerName.includes('book') || lowerName.includes('read')) return 'Books & Media';
    if (lowerName.includes('jewelry') || lowerName.includes('ring') || lowerName.includes('necklace')) return 'Jewelry';
    if (lowerName.includes('food') || lowerName.includes('chocolate') || lowerName.includes('wine')) return 'Food & Treats';
    if (lowerName.includes('clothes') || lowerName.includes('shirt') || lowerName.includes('dress')) return 'Clothing & Accessories';
    if (lowerName.includes('experience') || lowerName.includes('ticket') || lowerName.includes('trip')) return 'Experience';
    if (lowerName.includes('photo') || lowerName.includes('picture') || lowerName.includes('memory')) return 'Personal';
    if (lowerName.includes('tech') || lowerName.includes('gadget') || lowerName.includes('electronic')) return 'Technology';
    if (lowerName.includes('home') || lowerName.includes('decor') || lowerName.includes('candle')) return 'Home & Decor';
    
    return 'General';
  }

  // Estimate price based on description and budget
  private estimatePrice(description: string, budget: { min: number; max: number }): number {
    const lowerDesc = description.toLowerCase();
    
    // Simple price estimation based on keywords
    if (lowerDesc.includes('premium') || lowerDesc.includes('luxury') || lowerDesc.includes('designer')) {
      return Math.min(budget.max, budget.min + (budget.max - budget.min) * 0.8);
    }
    if (lowerDesc.includes('experience') || lowerDesc.includes('trip') || lowerDesc.includes('ticket')) {
      return Math.min(budget.max, budget.min + (budget.max - budget.min) * 0.7);
    }
    if (lowerDesc.includes('simple') || lowerDesc.includes('basic') || lowerDesc.includes('small')) {
      return Math.max(budget.min, budget.min + (budget.max - budget.min) * 0.2);
    }
    
    // Default to middle of budget range
    return budget.min + (budget.max - budget.min) / 2;
  }

  // Get upcoming gift reminders
  async getUpcomingReminders(days: number = 30): Promise<GiftReminder[]> {
    return await redisUtils.getUpcomingGifts(this.userId, days);
  }

  // Mark reminder as completed
  async markReminderCompleted(reminderId: string, selectedGift?: GiftSuggestion): Promise<void> {
    const reminders = await this.getUpcomingReminders(365); // Get all reminders
    const reminder = reminders.find(r => r.id === reminderId);
    
    if (reminder) {
      reminder.isCompleted = true;
      
      // If a gift was selected, add it to user's gift history
      if (selectedGift) {
        const user = await this.getUser();
        if (user) {
          const gift: Gift = {
            id: uuidv4(),
            name: selectedGift.name,
            description: selectedGift.description,
            occasion: reminder.occasion,
            date: reminder.date,
            reaction: 'liked', // Default reaction
            notes: `Selected from AI suggestions`,
          };
          
          user.preferences.giftPreferences.pastGifts.push(gift);
          await redisUtils.setUserData(this.userId, { data: JSON.stringify(user) });
        }
      }
      
      // Update reminder in Redis
      await redisUtils.getRedisClient().zrem(`gifts:${this.userId}`, JSON.stringify(reminder));
      await redisUtils.addGiftReminder(this.userId, reminder);
    }
  }

  // Get user data
  private async getUser(): Promise<User | null> {
    try {
      const userData = await redisUtils.getUserData(this.userId);
      return userData.data ? JSON.parse(userData.data) : null;
    } catch (error) {
      console.error('Error getting user data:', error);
      return null;
    }
  }

  // Add gift reaction to improve future suggestions
  async addGiftReaction(giftId: string, reaction: 'loved' | 'liked' | 'neutral' | 'disliked'): Promise<void> {
    const user = await this.getUser();
    if (user) {
      const gift = user.preferences.giftPreferences.pastGifts.find(g => g.id === giftId);
      if (gift) {
        gift.reaction = reaction;
        await redisUtils.setUserData(this.userId, { data: JSON.stringify(user) });
      }
    }
  }

  // Get gift statistics
  async getGiftStats(): Promise<{
    totalGifts: number;
    averageReaction: number;
    favoriteCategories: string[];
    upcomingOccasions: number;
  }> {
    const user = await this.getUser();
    const upcomingReminders = await this.getUpcomingReminders(365);
    
    if (!user) {
      return {
        totalGifts: 0,
        averageReaction: 0,
        favoriteCategories: [],
        upcomingOccasions: upcomingReminders.length,
      };
    }

    const pastGifts = user.preferences.giftPreferences.pastGifts;
    const totalGifts = pastGifts.length;
    
    // Calculate average reaction (convert to numeric)
    const reactionValues = { loved: 4, liked: 3, neutral: 2, disliked: 1 };
    const averageReaction = totalGifts > 0 
      ? pastGifts.reduce((sum, gift) => sum + (reactionValues[gift.reaction] || 2), 0) / totalGifts
      : 0;

    // Get favorite categories
    const categoryCounts: { [key: string]: number } = {};
    pastGifts.forEach(gift => {
      const category = this.categorizeGift(gift.name);
      categoryCounts[category] = (categoryCounts[category] || 0) + 1;
    });
    
    const favoriteCategories = Object.entries(categoryCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([category]) => category);

    return {
      totalGifts,
      averageReaction,
      favoriteCategories,
      upcomingOccasions: upcomingReminders.length,
    };
  }

  // Suggest new occasions based on user data
  async suggestOccasions(): Promise<string[]> {
    const user = await this.getUser();
    const upcomingReminders = await this.getUpcomingReminders(365);
    
    const existingOccasions = upcomingReminders.map(r => r.occasion.toLowerCase());
    const suggestedOccasions: string[] = [];
    
    // Common occasions
    const commonOccasions = [
      'Birthday', 'Anniversary', 'Valentine\'s Day', 'Christmas', 
      'New Year', 'Graduation', 'Promotion', 'Housewarming',
      'Mother\'s Day', 'Father\'s Day', 'Thanksgiving'
    ];
    
    // Add occasions that aren't already scheduled
    commonOccasions.forEach(occasion => {
      if (!existingOccasions.includes(occasion.toLowerCase())) {
        suggestedOccasions.push(occasion);
      }
    });
    
    // Add personalized suggestions based on user interests
    if (user?.preferences.interests) {
      if (user.preferences.interests.includes('travel')) {
        suggestedOccasions.push('Travel Anniversary');
      }
      if (user.preferences.interests.includes('music')) {
        suggestedOccasions.push('Concert Tickets');
      }
      if (user.preferences.interests.includes('sports')) {
        suggestedOccasions.push('Game Day');
      }
    }
    
    return suggestedOccasions.slice(0, 5); // Return top 5 suggestions
  }
}

// Utility functions
export const giftUtils = {
  // Create gift reminder manager for user
  createManager: (userId: string) => new GiftReminderManager(userId),

  // Format date for display
  formatDate: (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  },

  // Get days until occasion
  getDaysUntil: (date: Date): number => {
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  },

  // Get urgency level
  getUrgencyLevel: (date: Date): 'low' | 'medium' | 'high' | 'urgent' => {
    const daysUntil = giftUtils.getDaysUntil(date);
    
    if (daysUntil <= 1) return 'urgent';
    if (daysUntil <= 3) return 'high';
    if (daysUntil <= 7) return 'medium';
    return 'low';
  },

  // Get urgency color
  getUrgencyColor: (urgency: 'low' | 'medium' | 'high' | 'urgent'): string => {
    const colors = {
      low: 'text-green-600 bg-green-100',
      medium: 'text-yellow-600 bg-yellow-100',
      high: 'text-orange-600 bg-orange-100',
      urgent: 'text-red-600 bg-red-100',
    };
    return colors[urgency];
  },
};

