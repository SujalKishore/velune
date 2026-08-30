import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return new NextResponse('Forbidden', { status: 403 });
  }
  const users = await prisma.user.findMany();
  const allWatched = await prisma.watched.findMany();
  return NextResponse.json({ users, allWatched });
}
