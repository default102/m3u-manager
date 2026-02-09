import { NextResponse } from 'next/server';
import { listBackups, createBackup } from '@/lib/backup';

export async function GET() {
  try {
    const backups = await listBackups();
    return NextResponse.json(backups);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST() {
  try {
    const result = await createBackup();
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
