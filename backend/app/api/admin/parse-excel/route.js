import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    
    if (!workbook.SheetNames.length) {
      return NextResponse.json({ error: 'Excel file is empty' }, { status: 400 });
    }

    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const rows = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

    return NextResponse.json({ data: rows });
  } catch (err) {
    console.error('Excel parsing error:', err);
    return NextResponse.json({ error: 'Failed to parse Excel file' }, { status: 500 });
  }
}
