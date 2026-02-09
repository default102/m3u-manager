import { NextResponse } from 'next/server';
import { restoreBackup } from '@/lib/backup';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params;
    await restoreBackup(filename);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
