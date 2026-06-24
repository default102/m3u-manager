import { NextResponse } from 'next/server';
import { guessChannelGroups, AIGroupResponse } from '@/lib/services/ai';
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
        name: true,
        groupTitle: true
      }
    });

    if (channels.length === 0) {
      return NextResponse.json({ error: 'No channels found' }, { status: 404 });
    }

    // Call AI service in chunks of 30 channels
    const chunkSize = 30;
    const aiResults: AIGroupResponse[] = [];
    for (let i = 0; i < channels.length; i += chunkSize) {
      const chunk = channels.slice(i, i + chunkSize);
      try {
        const chunkResults = await guessChannelGroups(chunk);
        aiResults.push(...chunkResults);
      } catch (chunkError) {
        console.error(`AI Grouping Chunk Error at index ${i}:`, chunkError);
        throw chunkError;
      }
    }

    // Map results with original values for client-side comparison and adjustment
    const results = channels.map(c => {
      const matched = aiResults.find(r => r.channelId === c.id);
      return {
        channelId: c.id,
        name: c.name,
        originalGroupTitle: c.groupTitle || '未分类',
        recommendedGroupTitle: matched ? (matched.groupTitle || '未分类') : (c.groupTitle || '未分类')
      };
    });

    return NextResponse.json({ success: true, results });
  } catch (error: any) {
    console.error('AI Grouping Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
