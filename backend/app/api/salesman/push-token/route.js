import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/db';
import { validateSession } from '@/lib/auth';

export async function POST(request) {
  try {
    const cookieStore = cookies();
    const salesmanSession = await validateSession(cookieStore, 'salesman_session', 'salesman');

    if (!salesmanSession) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { token } = await request.json();

    if (!token) {
      return NextResponse.json({ error: 'Push token is required' }, { status: 400 });
    }

    await prisma.salesman.update({
      where: { id: salesmanSession.userId },
      data: { expoPushToken: token }
    });

    return NextResponse.json({ message: 'Push token saved successfully' });
  } catch (error) {
    console.error('Error saving push token:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
