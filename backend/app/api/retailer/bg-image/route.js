import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET() {
  try {
    const setting = await prisma.setting.findUnique({
      where: { key: 'RETAILER_BG_IMAGE' }
    });

    if (!setting || !setting.value) {
      return NextResponse.json({ image: null });
    }

    return NextResponse.json({ image: setting.value });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
