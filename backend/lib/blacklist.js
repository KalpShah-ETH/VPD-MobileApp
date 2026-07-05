import prisma from './db';

const memCache = new Map(); // token → { result, cachedAt }
const TTL = 5 * 60 * 1000;  // 5 minutes in ms

export async function blacklistToken(token) {
  if (!token) return;
  memCache.set(token, { result: true, cachedAt: Date.now() });
  try {
    let expTimestamp = 'true';
    try {
      const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
      if (payload.exp) {
        expTimestamp = (payload.exp * 1000).toString(); // Save as ms
      }
    } catch (e) { }

    await prisma.setting.upsert({
      where: { key: 'blacklist:' + token },
      update: { value: expTimestamp },
      create: { key: 'blacklist:' + token, value: expTimestamp }
    });
  } catch (err) {
    console.error('Error blacklisting token:', err);
  }
}

export async function isTokenBlacklisted(token) {
  if (!token) return false;
  const cached = memCache.get(token);
  if (cached && (Date.now() - cached.cachedAt) < TTL) {
    return cached.result;
  }
  try {
    const setting = await prisma.setting.findUnique({
      where: { key: 'blacklist:' + token }
    });
    const result = !!setting;
    memCache.set(token, { result, cachedAt: Date.now() });
    return result;
  } catch (err) {
    console.error('Error checking blacklist:', err);
    return false;
  }
}

export async function clearBlacklist() {
  memCache.clear();
  try {
    await prisma.setting.deleteMany({
      where: { key: { startsWith: 'blacklist:' } }
    });
  } catch (err) {
    console.error('Error clearing blacklist:', err);
  }
}

export async function cleanExpiredBlacklist() {
  try {
    const allBlacklisted = await prisma.setting.findMany({
      where: { key: { startsWith: 'blacklist:' } }
    });
    
    const now = Date.now();
    let expiredKeys = [];
    
    for (const setting of allBlacklisted) {
      if (setting.value !== 'true') {
        const expTime = parseInt(setting.value, 10);
        if (now > expTime) {
          expiredKeys.push(setting.key);
        }
      }
    }

    if (expiredKeys.length > 0) {
      await prisma.setting.deleteMany({
        where: { key: { in: expiredKeys } }
      });
      console.log(`Cleaned up ${expiredKeys.length} expired blacklist tokens.`);
    }
  } catch (err) {
    console.error('Error cleaning expired blacklist:', err);
  }
}
