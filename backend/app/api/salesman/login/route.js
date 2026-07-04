import { handleLoginRequest, handleLogoutRequest } from '@/lib/auth-handlers';

export async function POST(request) {
  return handleLoginRequest(request, 'salesman');
}

export async function DELETE() {
  return handleLogoutRequest('salesman');
}
