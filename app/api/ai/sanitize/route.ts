import { NextResponse } from 'next/server';
import { sanitizeChannelNames, AISanitizeResponse } from '@/lib/services/ai';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { channelIds } = body;

    if (!Array.isArray(channelIds) || channelIds.length === 0) {
      return NextResponse.json({ error: 'channelIds must be a non-empty array' }, { status: 400 });
    }

    // Fetch channels from DB
    const channels = await prisma.channel.findMany({
      where: {
        id: { in: channelIds }
      },
      select: {
        id: true,
        name: true
      }
    });

    if (channels.length === 0) {
      return NextResponse.json({ error: 'No channels found' }, { status: 404 });
    }

    // Call AI sanitize service in chunks of 30 channels
    const chunkSize = 30;
    const aiResults: AISanitizeResponse[] = [];
    for (let i = 0; i < channels.length; i += chunkSize) {
      const chunk = channels.slice(i, i + chunkSize);
      try {
        const chunkResults = await sanitizeChannelNames(chunk);
        aiResults.push(...chunkResults);
      } catch (chunkError) {
        console.error(`AI Sanitization Chunk Error at index ${i}:`, chunkError);
        throw chunkError;
      }
    }

    // Map comparison results
    const results = channels.map(c => {
      const matched = aiResults.find(r => r.channelId === c.id);
      return {
        channelId: c.id,
        originalName: c.name,
        recommendedName: matched ? (matched.name || c.name) : c.name
      };
    });

    return NextResponse.json({ success: true, results });
  } catch (error: any) {
    console.error('AI Sanitization API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
