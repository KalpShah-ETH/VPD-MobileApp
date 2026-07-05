import { NextResponse } from 'next/server';
import { cookies, headers } from 'next/headers';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/db';
import { signToken, setAuthCookie, deleteAuthCookie, blacklistToken } from '@/lib/auth';
import { cleanExpiredBlacklist } from '@/lib/blacklist';

/**
 * Handles login requests centrally for all roles.
 * @param {Request} request The incoming Next.js request
 * @param {string} role 'admin', 'salesman', or 'retailer'
 */
export async function handleLoginRequest(request, role) {
  try {
    const body = await request.json();
    
    // 1% chance to run automatic blacklist cleanup in the background
    if (Math.random() < 0.01) {
      cleanExpiredBlacklist().catch(err => console.error('Background cleanup failed', err));
    }
    
    // Retailer login uses phone. Admin and Salesman use username/password.
    if (role === 'retailer') {
      const { phone } = body;
      if (!phone) {
        return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
      }

      const retailer = await prisma.retailer.findUnique({
        where: { phone }
      });

      if (!retailer || !retailer.active) {
        return NextResponse.json({ 
          error: 'This phone number is not registered or has been deactivated. Please contact your salesman.' 
        }, { status: 403 });
      }

      const jwtToken = signToken({
        role: 'retailer',
        id: retailer.id,
        shopName: retailer.shopName,
        phone: retailer.phone
      });

      const response = NextResponse.json({ success: true, token: jwtToken });
      setAuthCookie(response, 'retailer_session', jwtToken);
      return response;
    }

    // Admin and Salesman flow
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }
    
    // Fetch user
    const user = role === 'admin' 
      ? await prisma.admin.findUnique({ where: { username } })
      : await prisma.salesman.findUnique({ where: { username } });

    if (!user) {
      return NextResponse.json(
        { error: 'Wrong username or password' },
        { status: 401 }
      );
    }

    if (role === 'salesman' && !user.active) {
      return NextResponse.json(
        { error: 'Account has been deactivated. Please contact administrator.' },
        { status: 403 }
      );
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return NextResponse.json(
        { error: 'Wrong username or password' },
        { status: 401 }
      );
    }

    // Build payload
    const payload = role === 'admin' 
      ? { role: 'admin', id: user.id, username: user.username }
      : { role: 'salesman', id: user.id, name: user.name, companyName: user.companyName, phone: user.phone };

    const token = signToken(payload);
    const response = NextResponse.json({ success: true, message: 'Logged in successfully', token });
    
    setAuthCookie(response, `${role}_session`, token);
    
    return response;
  } catch (error) {
    console.error(`${role} login error:`, error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Handles logout globally for any role
 */
export async function handleLogoutRequest(role) {
  const cookieStore = await cookies();
  const sessionName = `${role}_session`;
  let token = cookieStore.get(sessionName)?.value;
  
  if (!token) {
    try {
      const headersList = await headers();
      const authHeader = headersList.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    } catch (e) {}
  }
  
  if (token) {
    await blacklistToken(token);
  }

  const response = NextResponse.json({ success: true, message: 'Logged out successfully' });
  deleteAuthCookie(response, sessionName);
  return response;
}
