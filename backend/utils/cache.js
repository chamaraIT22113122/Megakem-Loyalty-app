const NodeCache = require('node-cache');

// Standard TTL: 5 minutes (300 seconds)
// Check period: 60 seconds
const cache = new NodeCache({ stdTTL: 300, checkperiod: 60, useClones: false });

const getFromCache = (key) => {
  return cache.get(key);
};

const setInCache = (key, data, ttl = 300) => {
  return cache.set(key, data, ttl);
};

const clearCacheKey = (key) => {
  return cache.del(key);
};

const clearCache = () => {
  return cache.flushAll();
};

module.exports = {
  getFromCache,
  setInCache,
  clearCacheKey,
  clearCache,
  cache
};
