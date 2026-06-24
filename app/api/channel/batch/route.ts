import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PATCH(request: Request) {
  const body = await request.json();
  const { ids, action, data } = body;

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: 'Invalid IDs' }, { status: 400 });
  }

  try {
    if (action === 'move') {
      // 批量移动分组
      await prisma.channel.updateMany({
        where: { id: { in: ids } },
        data: { groupTitle: data.groupTitle }
      });
    } else if (action === 'delete') {
      // 批量删除
      await prisma.channel.deleteMany({
        where: { id: { in: ids } }
      });
    } else if (action === 'updateGroups') {
      // 批量独立更新分组
      const updates = data.updates;
      const promises = updates.map((u: any) =>
        prisma.channel.update({
          where: { id: u.id },
          data: { groupTitle: u.groupTitle ?? null }
        })
      );
      await Promise.all(promises);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Batch operation failed:', error);
    return NextResponse.json({ error: 'Batch operation failed' }, { status: 500 });
  }
}
