import { handleLogoutRequest } from '@/lib/auth-handlers';
import { validateSession } from '@/lib/auth';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request) {
  const cookieStore = await cookies();
  
  // Try to find any valid session to log out from
  const retailer = await validateSession(cookieStore, 'retailer_session', 'retailer');
  if (retailer) return handleLogoutRequest('retailer');

  const salesman = await validateSession(cookieStore, 'salesman_session', 'salesman');
  if (salesman) return handleLogoutRequest('salesman');

  const admin = await validateSession(cookieStore, 'admin_session', 'admin');
  if (admin) return handleLogoutRequest('admin');

  // If no session found via cookies/auth header, just return success anyway
  return NextResponse.json({ success: true, message: 'Already logged out' });
}
