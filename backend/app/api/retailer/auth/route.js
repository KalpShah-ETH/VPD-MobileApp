import { handleLoginRequest } from '@/lib/auth-handlers';

export async function POST(request) {
  return handleLoginRequest(request, 'retailer');
}
