import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/db';
import { validateSession } from '@/lib/auth';
import bcrypt from 'bcryptjs';
import * as XLSX from 'xlsx';

async function checkAdminAuth() {
  const cookieStore = await cookies();
  return await validateSession(cookieStore, 'admin_session', 'admin');
}

export async function POST(request) {
  const admin = await checkAdminAuth();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    console.log('[BACKEND] Received admin FormData upload');

    // 1. Get or create the special admin_global salesman
    let globalSalesman = await prisma.salesman.findUnique({
      where: { username: 'admin_global' }
    });

    if (!globalSalesman) {
      const dummyHash = await bcrypt.hash('admin_global_dummy_password_2026', 10);
      globalSalesman = await prisma.salesman.create({
        data: {
          name: 'Admin Shared Stock',
          companyName: 'Admin Shared Stock',
          phone: '0000000000',
          username: 'admin_global',
          passwordHash: dummyHash,
          active: false
        }
      });
    }

    // 2. Parse FormData
    const formData = await request.formData();
    const file = formData.get('file');
    
    if (!file) {
      return NextResponse.json({ error: 'No file found in the upload.' }, { status: 400 });
    }

    const fileName = file.name || 'global_stock.xlsx';
    console.log(`[BACKEND] Admin Processing file: ${fileName}, size: ${file.size} bytes`);

    // 3. Convert file to buffer and parse with XLSX
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    
    if (!workbook.SheetNames.length) {
      return NextResponse.json({ error: 'Uploaded Excel/CSV file is empty' }, { status: 400 });
    }

    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];

    // 4. Smart Parser to dynamically find headers
    const rawRows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" });
    let headerRowIndex = -1;

    for (let i = 0; i < rawRows.length; i++) {
      const rowString = JSON.stringify(rawRows[i]).toUpperCase();
      if (rowString.includes('MFG') || rowString.includes('ITEM NAM') || rowString.includes('QTY')) {
        headerRowIndex = i;
        break;
      }
    }

    if (headerRowIndex === -1) {
      return NextResponse.json({ error: 'Could not find valid column headers (MFG, ITEM NAM, QTY) in the file.' }, { status: 400 });
    }

    console.log('[BACKEND] Admin Smart Parser found headers at row:', headerRowIndex);
    const rows = XLSX.utils.sheet_to_json(worksheet, { defval: "", range: headerRowIndex });

    // 5. Delete all existing global stock items
    await prisma.stockItem.deleteMany({
      where: { salesmanId: globalSalesman.id }
    });

    const getUniquenessKey = (name, mfg, pack) => {
      return `${(name || '').trim().toLowerCase()}|${(mfg || '').trim().toLowerCase()}|${(pack || '').trim().toLowerCase()}`;
    };

    const newItems = [];
    const currentKeys = new Set();
    let skippedCount = 0;

    for (const row of rows) {
      const cleanRow = {};
      Object.keys(row).forEach(key => {
        cleanRow[key.trim().toUpperCase()] = row[key];
      });

      const name = cleanRow['ITEM NAME'] || cleanRow['ITEM NAM'] || cleanRow['NAME'] || '';
      const mfg = cleanRow['MFG'] || '';
      const pack = cleanRow['PACK'] || '';
      const quantityStr = cleanRow['QTY'] || cleanRow['QUANTITY'] || cleanRow['QUANTITY (BOX)'] || 0;
      const quantity = parseInt(quantityStr);

      if (!name || isNaN(quantity) || quantity < 0) {
        skippedCount++;
        continue;
      }

      const key = getUniquenessKey(name, mfg, pack);
      if (currentKeys.has(key)) {
        skippedCount++;
        continue;
      }

      newItems.push({
        name: name.trim(),
        quantity: quantity,
        mfg: mfg.trim(),
        pack: pack.trim(),
        salesmanId: globalSalesman.id
      });
      currentKeys.add(key);
    }

    console.log(`[BACKEND] Admin Mapping complete. Valid: ${newItems.length}, Skipped: ${skippedCount}`);

    if (newItems.length === 0) {
      return NextResponse.json({ error: 'No valid products could be mapped from this file.' }, { status: 400 });
    }

    // 6. Bulk insert
    await prisma.stockItem.createMany({
      data: newItems
    });

    // 7. Log recent upload
    try {
      const uploadsSetting = await prisma.setting.findUnique({
        where: { key: 'RECENT_STOCK_UPLOADS' }
      });
      let uploads = [];
      if (uploadsSetting && uploadsSetting.value) {
        try {
          uploads = JSON.parse(uploadsSetting.value);
        } catch (e) {
          uploads = [];
        }
      }
      uploads.unshift({
        timestamp: new Date().toISOString(),
        adminUsername: admin.username,
        filename: fileName,
        count: newItems.length
      });
      uploads = uploads.slice(0, 10);

      await prisma.setting.upsert({
        where: { key: 'RECENT_STOCK_UPLOADS' },
        update: { value: JSON.stringify(uploads) },
        create: { key: 'RECENT_STOCK_UPLOADS', value: JSON.stringify(uploads) }
      });
    } catch (logError) {
      console.error('Failed to log admin stock upload:', logError);
    }

    return NextResponse.json({
      success: true,
      inserted: newItems.length,
      skipped: skippedCount,
      salesmenCount: 1
    });

  } catch (error) {
    console.error('Admin global stock upload error:', error);
    return NextResponse.json({ error: 'Internal server error while processing the file.' }, { status: 500 });
  }
}

