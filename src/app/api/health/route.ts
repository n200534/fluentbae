import { NextResponse } from 'next/server';
import { redisUtils } from '@/lib/redis';

export async function GET() {
  try {
    // Check Redis connection
    const redisConnected = await redisUtils.testConnection();
    
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        redis: redisConnected ? 'connected' : 'disconnected',
        api: 'running'
      }
    });
  } catch (error) {
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

