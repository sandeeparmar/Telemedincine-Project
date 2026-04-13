import Redis from "ioredis";

let sharedRedis = null;

function normalizeRedisUrl() {
  const rawUrl = process.env.REDIS_URL;
  if (!rawUrl) {
    throw new Error("REDIS_URL is not configured in environment");
  }

  // Upstash Redis expects TLS. Upgrade redis:// to rediss:// automatically.
  if (rawUrl.includes("upstash.io") && rawUrl.startsWith("redis://")) {
    return rawUrl.replace("redis://", "rediss://");
  }

  return rawUrl;
}

function buildRedisOptions() {
  return {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    lazyConnect: false,
    connectTimeout: 10000,
    keepAlive: 30000,
    enableOfflineQueue: true,
    retryStrategy(times) {
      return Math.min(times * 200, 5000);
    },
    reconnectOnError() {
      return true;
    },
  };
}

export function getRedisClient() {
  const redisUrl = normalizeRedisUrl();

  if (!sharedRedis) {
    sharedRedis = new Redis(redisUrl, buildRedisOptions());
    sharedRedis.on("error", (err) => {
      console.error("Redis client error:", err.message);
    });
  }

  return sharedRedis;
}

export function createRedisClient() {
  const redisUrl = normalizeRedisUrl();

  const client = new Redis(redisUrl, buildRedisOptions());
  client.on("error", (err) => {
    console.error("Redis connection error:", err.message);
  });
  return client;
}
