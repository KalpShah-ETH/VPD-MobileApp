import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

export async function POST(req) {
  try {
    const body = await req.json();
    const { base64Data } = body;

    if (!base64Data) {
      return NextResponse.json({ error: 'No file data provided' }, { status: 400 });
    }

    const buffer = Buffer.from(base64Data, 'base64');
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
