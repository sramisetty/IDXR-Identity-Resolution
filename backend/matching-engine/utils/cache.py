import json
import asyncio
import os
from typing import Any, Optional

class CacheManager:
    def __init__(self):
        self.host = os.getenv('REDIS_HOST', 'localhost')
        self.port = os.getenv('REDIS_PORT', '6379')
        # In-memory cache for demo
        self.cache = {}
    
    async def check_connection(self) -> bool:
        # For demo, always return True
        # In production, this would check actual Redis connection
        await asyncio.sleep(0.01)  # Simulate connection check
        return True
    
    async def get(self, key: str) -> Optional[Any]:
        # In production, get from Redis
        value = self.cache.get(key)
        if value and isinstance(value, str):
            try:
                return json.loads(value)
            except:
                return value
        return value
    
    async def set(self, key: str, value: Any, expire: int = 300) -> bool:
        # In production, set in Redis with expiration
        if isinstance(value, (dict, list)):
            self.cache[key] = json.dumps(value)
        else:
            self.cache[key] = value
        return True
    
    async def delete(self, key: str) -> bool:
        # In production, delete from Redis
        if key in self.cache:
            del self.cache[key]
            return True
        return False