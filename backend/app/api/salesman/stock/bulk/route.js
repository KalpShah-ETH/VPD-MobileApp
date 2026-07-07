import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/db';
import { validateSession } from '@/lib/auth';
import * as XLSX from 'xlsx';

async function checkSalesmanAuth() {
  const cookieStore = await cookies();
  return await validateSession(cookieStore, 'salesman_session', 'salesman');
}

export async function POST(request) {
  const salesman = await checkSalesmanAuth();
  if (!salesman) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    console.log('[BACKEND] Received FormData upload from salesman:', salesman.username);
    
    // 1. Check database permission
    const dbSalesman = await prisma.salesman.findUnique({
      where: { id: salesman.id },
      select: { canUploadStock: true, username: true }
    });

    if (!dbSalesman || !dbSalesman.canUploadStock) {
      console.log('[BACKEND] Forbidden: Salesman lacks permission');
      return NextResponse.json({ error: 'Forbidden: You do not have permission to upload stock files.' }, { status: 403 });
    }

    // 2. Parse FormData
    const formData = await request.formData();
    const file = formData.get('file');
    
    if (!file) {
      return NextResponse.json({ error: 'No file found in the upload.' }, { status: 400 });
    }

    const fileName = file.name || 'upload.xlsx';
    console.log(`[BACKEND] Processing file: ${fileName}, size: ${file.size} bytes`);

    // 3. Convert file to buffer and parse with XLSX
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    
    if (!workbook.SheetNames.length) {
      return NextResponse.json({ error: 'Uploaded Excel/CSV file is empty' }, { status: 400 });
    }

    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];

    // 4. Smart Parser to dynamically find headers (bypassing junk text)
    const rawRows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" });
    let headerRowIndex = -1;

    for (let i = 0; i < rawRows.length; i++) {
      const rowString = JSON.stringify(rawRows[i]).toUpperCase();
      // Lenient matching: MFG or ITEM NAM or QTY
      if (rowString.includes('MFG') || rowString.includes('ITEM NAM') || rowString.includes('QTY')) {
        headerRowIndex = i;
        break;
      }
    }

    if (headerRowIndex === -1) {
      return NextResponse.json({ error: 'Could not find valid column headers (MFG, ITEM NAM, QTY) in the file.' }, { status: 400 });
    }

    console.log('[BACKEND] Smart Parser found headers at row:', headerRowIndex);
    const rows = XLSX.utils.sheet_to_json(worksheet, { defval: "", range: headerRowIndex });

    // 5. Map rows safely
    const getUniquenessKey = (name, mfg, pack) => {
      return `${(name || '').trim().toLowerCase()}|${(mfg || '').trim().toLowerCase()}|${(pack || '').trim().toLowerCase()}`;
    };

    const newItems = [];
    const currentKeys = new Set();
    let skippedCount = 0;

    for (const row of rows) {
      // Create uppercase keys for safe extraction
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
        salesmanId: salesman.id // Save as global stock item
      });
      currentKeys.add(key);
    }

    console.log(`[BACKEND] Mapping complete. Valid: ${newItems.length}, Skipped: ${skippedCount}`);

    if (newItems.length === 0) {
      return NextResponse.json({ error: 'No valid products could be mapped from this file.' }, { status: 400 });
    }

    // 6. Database Truncate and Bulk Insert
    // For global stock, we must attach it to the 'admin_global' salesman user
    const globalSalesman = await prisma.salesman.findUnique({
      where: { username: 'admin_global' }
    });

    if (!globalSalesman) {
      return NextResponse.json({ error: 'Global stock repository not found.' }, { status: 500 });
    }

    // Overwrite salesmanId to point to global repo
    newItems.forEach(item => item.salesmanId = globalSalesman.id);

    await prisma.stockItem.deleteMany({
      where: { salesmanId: globalSalesman.id }
    });

    await prisma.stockItem.createMany({
      data: newItems
    });

    // 7. Log recent stock upload
    try {
      const uploadsSetting = await prisma.setting.findUnique({ where: { key: 'RECENT_STOCK_UPLOADS' } });
      let uploads = [];
      if (uploadsSetting && uploadsSetting.value) {
        try { uploads = JSON.parse(uploadsSetting.value); } catch (e) {}
      }
      uploads.unshift({
        timestamp: new Date().toISOString(),
        adminUsername: `rep:${dbSalesman.username}`,
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
      console.error('Failed to log upload:', logError);
    }

    console.log(`[BACKEND] Process finished successfully. Inserted: ${newItems.length}`);
    return NextResponse.json({
      success: true,
      inserted: newItems.length,
      skipped: skippedCount
    });

  } catch (error) {
    console.error('[BACKEND] Salesman bulk upload error:', error);
    return NextResponse.json({ error: 'Internal server error while processing the file.' }, { status: 500 });
  }
}
