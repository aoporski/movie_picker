const { createClient } = require('redis');

const redis = createClient({
  url: 'redis://localhost:6379'
});

redis.on('error', (err) => {
  console.error('Redis client error:', err);
});

redis.on('connect', () => {
  console.log('Redis client connected');
});

(async () => {
  await redis.connect();
})();

module.exports = redis;
