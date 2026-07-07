// app/api/salesman/stock/bulk/route.js
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    // 1. Get the clean JSON array from the frontend
    const body = await req.json();
    const { items, fileName } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'No valid items provided' }, { status: 400 });
    }

    let inserted = 0;
    let skipped = 0;

    // 2. Loop through the items and save them to your database
    for (const item of items) {
      if (!item.name || isNaN(item.quantity)) {
        skipped++;
        continue;
      }

      // --- DATABASE LOGIC HERE ---
      // Example: 
      // await db.collection('stock').updateOne(
      //   { name: item.name, mfg: item.mfg },
      //   { $set: { pack: item.pack, quantity: item.quantity } },
      //   { upsert: true }
      // );

      inserted++;
    }

    return NextResponse.json({
      success: true,
      inserted,
      skipped,
      fileName
    });

  } catch (error) {
    console.error('Bulk stock upload error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}