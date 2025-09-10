"""
Enterprise API Rate Limiting and Throttling Middleware
Provides comprehensive request limiting, DDoS protection, and fair usage policies
"""

import asyncio
import time
import hashlib
import json
import logging
from typing import Dict, List, Optional, Any, Tuple, Callable
from dataclasses import dataclass, asdict
from datetime import datetime, timedelta
from enum import Enum
import redis
import os
from fastapi import Request, HTTPException, status
from fastapi.responses import JSONResponse
from fastapi.middleware.base import BaseHTTPMiddleware
import ipaddress
from collections import defaultdict, deque

class LimitType(Enum):
    PER_MINUTE = "per_minute"
    PER_HOUR = "per_hour"
    PER_DAY = "per_day"
    BURST = "burst"

class LimitScope(Enum):
    GLOBAL = "global"
    PER_IP = "per_ip"
    PER_USER = "per_user"
    PER_ENDPOINT = "per_endpoint"

@dataclass
class RateLimit:
    limit: int
    window_seconds: int
    limit_type: LimitType
    scope: LimitScope
    burst_allowance: int = 0
    description: str = ""

@dataclass
class ThrottleEvent:
    timestamp: datetime
    client_id: str
    endpoint: str
    limit_exceeded: str
    current_count: int
    limit_value: int
    reset_time: datetime
    user_agent: str
    ip_address: str

class RateLimitConfig:
    """Configuration for different rate limiting scenarios"""
    
    # Default rate limits for different user types
    ANONYMOUS_LIMITS = [
        RateLimit(60, 60, LimitType.PER_MINUTE, LimitScope.PER_IP, 10, "Anonymous user per minute"),
        RateLimit(1000, 3600, LimitType.PER_HOUR, LimitScope.PER_IP, 50, "Anonymous user per hour"),
        RateLimit(10000, 86400, LimitType.PER_DAY, LimitScope.PER_IP, 100, "Anonymous user per day")
    ]
    
    AUTHENTICATED_LIMITS = [
        RateLimit(300, 60, LimitType.PER_MINUTE, LimitScope.PER_USER, 50, "Authenticated user per minute"),
        RateLimit(5000, 3600, LimitType.PER_HOUR, LimitScope.PER_USER, 200, "Authenticated user per hour"),
        RateLimit(50000, 86400, LimitType.PER_DAY, LimitScope.PER_USER, 1000, "Authenticated user per day")
    ]
    
    PREMIUM_LIMITS = [
        RateLimit(1000, 60, LimitType.PER_MINUTE, LimitScope.PER_USER, 200, "Premium user per minute"),
        RateLimit(20000, 3600, LimitType.PER_HOUR, LimitScope.PER_USER, 500, "Premium user per hour"),
        RateLimit(200000, 86400, LimitType.PER_DAY, LimitScope.PER_USER, 2000, "Premium user per day")
    ]
    
    ADMIN_LIMITS = [
        RateLimit(2000, 60, LimitType.PER_MINUTE, LimitScope.PER_USER, 500, "Admin user per minute"),
        RateLimit(50000, 3600, LimitType.PER_HOUR, LimitScope.PER_USER, 1000, "Admin user per hour"),
        RateLimit(500000, 86400, LimitType.PER_DAY, LimitScope.PER_USER, 5000, "Admin user per day")
    ]
    
    # Endpoint-specific limits
    ENDPOINT_LIMITS = {
        "/api/v1/resolve": [
            RateLimit(30, 60, LimitType.PER_MINUTE, LimitScope.PER_IP, 5, "Identity resolution per minute"),
            RateLimit(500, 3600, LimitType.PER_HOUR, LimitScope.PER_IP, 25, "Identity resolution per hour")
        ],
        "/api/v1/batch/process": [
            RateLimit(5, 60, LimitType.PER_MINUTE, LimitScope.PER_IP, 2, "Batch processing per minute"),
            RateLimit(20, 3600, LimitType.PER_HOUR, LimitScope.PER_IP, 5, "Batch processing per hour")
        ],
        "/api/v1/admin/": [
            RateLimit(100, 60, LimitType.PER_MINUTE, LimitScope.PER_USER, 20, "Admin endpoints per minute"),
            RateLimit(1000, 3600, LimitType.PER_HOUR, LimitScope.PER_USER, 50, "Admin endpoints per hour")
        ]
    }
    
    # Global system limits for DDoS protection
    GLOBAL_LIMITS = [
        RateLimit(10000, 60, LimitType.PER_MINUTE, LimitScope.GLOBAL, 1000, "Global system per minute"),
        RateLimit(100000, 3600, LimitType.PER_HOUR, LimitScope.GLOBAL, 5000, "Global system per hour")
    ]

class RedisRateLimiter:
    """Redis-based rate limiter with sliding window and token bucket algorithms"""
    
    def __init__(self):
        self.redis_client = None
        self.logger = logging.getLogger(__name__)
        self.demo_mode = os.getenv('DEMO_MODE', 'true').lower() == 'true'
        self.local_cache = defaultdict(lambda: defaultdict(deque))
        
        # Initialize Redis connection if not in demo mode
        if not self.demo_mode:
            self._initialize_redis()
    
    def _initialize_redis(self):
        """Initialize Redis connection"""
        try:
            redis_url = os.getenv('REDIS_URL', 'redis://localhost:6379')
            self.redis_client = redis.from_url(redis_url, decode_responses=True)
            
            # Test connection
            self.redis_client.ping()
            self.logger.info("Redis rate limiter initialized")
            
        except Exception as e:
            self.logger.warning(f"Redis connection failed, using in-memory cache: {str(e)}")
            self.redis_client = None
    
    def _get_cache_key(self, client_id: str, limit: RateLimit, endpoint: str = "") -> str:
        """Generate cache key for rate limiting"""
        scope_suffix = ""
        if limit.scope == LimitScope.PER_ENDPOINT:
            scope_suffix = f":endpoint:{hashlib.md5(endpoint.encode()).hexdigest()[:8]}"
        elif limit.scope == LimitScope.GLOBAL:
            client_id = "global"
        
        return f"rate_limit:{client_id}:{limit.limit_type.value}:{limit.window_seconds}{scope_suffix}"
    
    async def check_rate_limit(self, client_id: str, limits: List[RateLimit], 
                              endpoint: str = "", user_agent: str = "") -> Tuple[bool, Optional[ThrottleEvent]]:
        """Check if request should be rate limited"""
        current_time = time.time()
        
        for limit in limits:
            cache_key = self._get_cache_key(client_id, limit, endpoint)
            
            # Check limit using appropriate backend
            if self.redis_client and not self.demo_mode:
                allowed, current_count, reset_time = await self._check_redis_limit(
                    cache_key, limit, current_time
                )
            else:
                allowed, current_count, reset_time = self._check_memory_limit(
                    cache_key, limit, current_time
                )
            
            if not allowed:
                # Create throttle event
                throttle_event = ThrottleEvent(
                    timestamp=datetime.utcnow(),
                    client_id=client_id,
                    endpoint=endpoint,
                    limit_exceeded=limit.description,
                    current_count=current_count,
                    limit_value=limit.limit,
                    reset_time=datetime.fromtimestamp(reset_time),
                    user_agent=user_agent,
                    ip_address=client_id  # Simplified for demo
                )
                
                return False, throttle_event
        
        return True, None
    
    async def _check_redis_limit(self, cache_key: str, limit: RateLimit, 
                               current_time: float) -> Tuple[bool, int, float]:
        """Check rate limit using Redis sliding window"""
        try:
            # Use Redis pipeline for atomic operations
            pipe = self.redis_client.pipeline()
            
            # Remove expired entries
            window_start = current_time - limit.window_seconds
            pipe.zremrangebyscore(cache_key, 0, window_start)
            
            # Count current entries
            pipe.zcard(cache_key)
            
            # Add current request
            pipe.zadd(cache_key, {str(current_time): current_time})
            
            # Set expiration
            pipe.expire(cache_key, limit.window_seconds + 1)
            
            results = pipe.execute()
            current_count = results[1] + 1  # Include current request
            
            reset_time = current_time + limit.window_seconds
            
            # Check if limit exceeded (considering burst allowance)
            effective_limit = limit.limit + limit.burst_allowance
            allowed = current_count <= effective_limit
            
            if not allowed:
                # Remove the request we just added since it's not allowed
                self.redis_client.zrem(cache_key, str(current_time))
            
            return allowed, current_count, reset_time
            
        except Exception as e:
            self.logger.error(f"Redis rate limit check failed: {str(e)}")
            # Fallback to allowing request on Redis failure
            return True, 1, current_time + limit.window_seconds
    
    def _check_memory_limit(self, cache_key: str, limit: RateLimit, 
                           current_time: float) -> Tuple[bool, int, float]:
        """Check rate limit using in-memory cache (demo mode)"""
        try:
            window_start = current_time - limit.window_seconds
            requests = self.local_cache[cache_key][limit.window_seconds]
            
            # Remove expired requests
            while requests and requests[0] < window_start:
                requests.popleft()
            
            current_count = len(requests) + 1  # Include current request
            effective_limit = limit.limit + limit.burst_allowance
            
            if current_count <= effective_limit:
                requests.append(current_time)
                return True, current_count, current_time + limit.window_seconds
            
            return False, current_count, current_time + limit.window_seconds
            
        except Exception as e:
            self.logger.error(f"Memory rate limit check failed: {str(e)}")
            return True, 1, current_time + limit.window_seconds

class DDoSProtection:
    """Advanced DDoS protection with pattern detection"""
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.suspicious_ips = set()
        self.request_patterns = defaultdict(lambda: defaultdict(list))
        self.blocked_ips = defaultdict(datetime)
        
        # DDoS detection thresholds
        self.burst_threshold = 100  # requests per second
        self.pattern_threshold = 1000  # requests per minute from single IP
        self.block_duration = timedelta(minutes=15)
    
    def analyze_request_pattern(self, ip_address: str, endpoint: str, 
                               user_agent: str) -> bool:
        """Analyze request patterns for DDoS detection"""
        current_time = time.time()
        
        # Check if IP is currently blocked
        if ip_address in self.blocked_ips:
            if datetime.utcnow() < self.blocked_ips[ip_address]:
                return False  # Still blocked
            else:
                del self.blocked_ips[ip_address]  # Unblock expired
        
        # Record request pattern
        minute_key = int(current_time // 60)
        self.request_patterns[ip_address][minute_key].append({
            'timestamp': current_time,
            'endpoint': endpoint,
            'user_agent': user_agent
        })
        
        # Clean old patterns (keep last 5 minutes)
        cutoff_minute = minute_key - 5
        for stored_minute in list(self.request_patterns[ip_address].keys()):
            if stored_minute < cutoff_minute:
                del self.request_patterns[ip_address][stored_minute]
        
        # Analyze patterns
        return self._detect_ddos_patterns(ip_address, current_time)
    
    def _detect_ddos_patterns(self, ip_address: str, current_time: float) -> bool:
        """Detect DDoS attack patterns"""
        try:
            current_minute = int(current_time // 60)
            
            # Check burst rate (requests per second)
            recent_requests = []
            for minute_data in self.request_patterns[ip_address].values():
                for req in minute_data:
                    if current_time - req['timestamp'] < 1:  # Last second
                        recent_requests.append(req)
            
            if len(recent_requests) > self.burst_threshold:
                self._block_ip(ip_address, "Burst rate exceeded")
                return False
            
            # Check pattern threshold (requests per minute)
            minute_requests = len(self.request_patterns[ip_address].get(current_minute, []))
            if minute_requests > self.pattern_threshold:
                self._block_ip(ip_address, "Pattern threshold exceeded")
                return False
            
            # Check for suspicious patterns
            if self._is_suspicious_pattern(ip_address):
                self._block_ip(ip_address, "Suspicious pattern detected")
                return False
            
            return True
            
        except Exception as e:
            self.logger.error(f"DDoS pattern detection failed: {str(e)}")
            return True  # Allow on error
    
    def _is_suspicious_pattern(self, ip_address: str) -> bool:
        """Detect suspicious request patterns"""
        try:
            all_requests = []
            for minute_data in self.request_patterns[ip_address].values():
                all_requests.extend(minute_data)
            
            if len(all_requests) < 10:
                return False
            
            # Check for identical user agents (bot indicator)
            user_agents = [req['user_agent'] for req in all_requests]
            if len(set(user_agents)) == 1 and len(user_agents) > 50:
                return True
            
            # Check for sequential endpoint access (scraping indicator)
            endpoints = [req['endpoint'] for req in all_requests[-20:]]  # Last 20 requests
            if len(set(endpoints)) > 15:  # Accessing many different endpoints quickly
                return True
            
            # Check for high frequency regular intervals (automated indicator)
            timestamps = [req['timestamp'] for req in all_requests[-10:]]
            if len(timestamps) >= 10:
                intervals = [timestamps[i] - timestamps[i-1] for i in range(1, len(timestamps))]
                avg_interval = sum(intervals) / len(intervals)
                if 0.1 < avg_interval < 2.0:  # Very regular intervals
                    variance = sum((i - avg_interval) ** 2 for i in intervals) / len(intervals)
                    if variance < 0.1:  # Low variance = very regular
                        return True
            
            return False
            
        except Exception as e:
            self.logger.error(f"Suspicious pattern detection failed: {str(e)}")
            return False
    
    def _block_ip(self, ip_address: str, reason: str):
        """Block IP address temporarily"""
        self.blocked_ips[ip_address] = datetime.utcnow() + self.block_duration
        self.suspicious_ips.add(ip_address)
        self.logger.warning(f"Blocked IP {ip_address} for {reason}")

class RateLimitMiddleware(BaseHTTPMiddleware):
    """FastAPI middleware for rate limiting and DDoS protection"""
    
    def __init__(self, app, config: RateLimitConfig = None):
        super().__init__(app)
        self.config = config or RateLimitConfig()
        self.rate_limiter = RedisRateLimiter()
        self.ddos_protection = DDoSProtection()
        self.logger = logging.getLogger(__name__)
        
        # Whitelist for trusted IPs (internal services, health checks)
        self.whitelisted_ips = set(os.getenv('RATE_LIMIT_WHITELIST', '127.0.0.1,::1').split(','))
        
    async def dispatch(self, request: Request, call_next: Callable):
        """Process request through rate limiting"""
        start_time = time.time()
        
        try:
            # Extract client information
            client_ip = self._get_client_ip(request)
            user_agent = request.headers.get('user-agent', 'unknown')
            endpoint = request.url.path
            user_id = await self._extract_user_id(request)
            
            # Skip rate limiting for whitelisted IPs
            if client_ip in self.whitelisted_ips:
                return await call_next(request)
            
            # Skip rate limiting for health checks
            if endpoint in ['/health', '/ping', '/status']:
                return await call_next(request)
            
            # DDoS protection check
            if not self.ddos_protection.analyze_request_pattern(client_ip, endpoint, user_agent):
                return self._create_rate_limit_response(
                    "IP temporarily blocked due to suspicious activity",
                    429, client_ip, endpoint, user_agent, 900  # 15 minutes
                )
            
            # Determine rate limits based on user type and endpoint
            limits = self._get_applicable_limits(user_id, endpoint)
            client_id = user_id or client_ip
            
            # Check rate limits
            allowed, throttle_event = await self.rate_limiter.check_rate_limit(
                client_id, limits, endpoint, user_agent
            )
            
            if not allowed:
                # Log throttle event
                self.logger.warning(f"Rate limit exceeded: {asdict(throttle_event)}")
                
                # Return rate limit response
                reset_seconds = int((throttle_event.reset_time - datetime.utcnow()).total_seconds())
                return self._create_rate_limit_response(
                    f"Rate limit exceeded: {throttle_event.limit_exceeded}",
                    429, client_ip, endpoint, user_agent, reset_seconds
                )
            
            # Process request
            response = await call_next(request)
            
            # Add rate limiting headers
            response.headers["X-RateLimit-Limit"] = str(max(limit.limit for limit in limits))
            response.headers["X-RateLimit-Remaining"] = str(max(0, max(limit.limit for limit in limits) - 1))
            response.headers["X-RateLimit-Reset"] = str(int(time.time() + min(limit.window_seconds for limit in limits)))
            
            # Record processing time for monitoring
            processing_time = (time.time() - start_time) * 1000
            response.headers["X-Processing-Time-Ms"] = str(int(processing_time))
            
            return response
            
        except Exception as e:
            self.logger.error(f"Rate limiting middleware error: {str(e)}")
            # Allow request on error to avoid blocking legitimate traffic
            return await call_next(request)
    
    def _get_client_ip(self, request: Request) -> str:
        """Extract client IP address with proxy support"""
        # Check for forwarded headers (proxy/load balancer)
        forwarded = request.headers.get('x-forwarded-for')
        if forwarded:
            # Take the first IP in the chain
            return forwarded.split(',')[0].strip()
        
        real_ip = request.headers.get('x-real-ip')
        if real_ip:
            return real_ip.strip()
        
        # Fallback to direct connection
        return request.client.host if request.client else '127.0.0.1'
    
    async def _extract_user_id(self, request: Request) -> Optional[str]:
        """Extract user ID from JWT token or session"""
        try:
            # Check for Authorization header
            auth_header = request.headers.get('authorization')
            if auth_header and auth_header.startswith('Bearer '):
                # In a real implementation, decode JWT token here
                # For demo, simulate user extraction
                token = auth_header[7:]  # Remove 'Bearer '
                if len(token) > 10:  # Basic validation
                    return f"user_{hash(token) % 10000}"
            
            # Check for session cookie
            session_cookie = request.cookies.get('session_id')
            if session_cookie:
                return f"session_{hash(session_cookie) % 10000}"
            
            return None
            
        except Exception as e:
            self.logger.error(f"User ID extraction failed: {str(e)}")
            return None
    
    def _get_applicable_limits(self, user_id: Optional[str], endpoint: str) -> List[RateLimit]:
        """Get applicable rate limits based on user and endpoint"""
        limits = []
        
        # Add global limits for DDoS protection
        limits.extend(self.config.GLOBAL_LIMITS)
        
        # Add endpoint-specific limits
        for pattern, endpoint_limits in self.config.ENDPOINT_LIMITS.items():
            if endpoint.startswith(pattern):
                limits.extend(endpoint_limits)
                break
        
        # Add user-type specific limits
        if user_id:
            # Determine user tier (simplified for demo)
            if user_id.startswith('admin_'):
                limits.extend(self.config.ADMIN_LIMITS)
            elif user_id.startswith('premium_'):
                limits.extend(self.config.PREMIUM_LIMITS)
            else:
                limits.extend(self.config.AUTHENTICATED_LIMITS)
        else:
            limits.extend(self.config.ANONYMOUS_LIMITS)
        
        return limits
    
    def _create_rate_limit_response(self, message: str, status_code: int, 
                                  client_ip: str, endpoint: str, user_agent: str,
                                  retry_after: int) -> JSONResponse:
        """Create standardized rate limit response"""
        response_data = {
            "error": "Rate limit exceeded",
            "message": message,
            "status_code": status_code,
            "retry_after": retry_after,
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "path": endpoint
        }
        
        headers = {
            "Retry-After": str(retry_after),
            "X-RateLimit-Reset": str(int(time.time() + retry_after)),
            "Content-Type": "application/json"
        }
        
        return JSONResponse(
            status_code=status_code,
            content=response_data,
            headers=headers
        )

# Utility functions for manual rate limiting
class RateLimitDecorator:
    """Decorator for function-level rate limiting"""
    
    def __init__(self, limits: List[RateLimit]):
        self.limits = limits
        self.rate_limiter = RedisRateLimiter()
    
    def __call__(self, func):
        async def wrapper(*args, **kwargs):
            # Extract client ID from request context
            client_id = kwargs.get('client_id', 'default')
            
            # Check rate limits
            allowed, throttle_event = await self.rate_limiter.check_rate_limit(
                client_id, self.limits, func.__name__
            )
            
            if not allowed:
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail=f"Rate limit exceeded: {throttle_event.limit_exceeded}"
                )
            
            return await func(*args, **kwargs)
        
        return wrapper

def create_rate_limited_endpoint(limits: List[RateLimit]):
    """Factory function to create rate-limited endpoints"""
    return RateLimitDecorator(limits)

# Pre-configured decorators for common use cases
identity_resolution_limits = create_rate_limited_endpoint([
    RateLimit(10, 60, LimitType.PER_MINUTE, LimitScope.PER_IP, 5, "Identity resolution"),
    RateLimit(100, 3600, LimitType.PER_HOUR, LimitScope.PER_IP, 20, "Identity resolution hourly")
])

batch_processing_limits = create_rate_limited_endpoint([
    RateLimit(3, 60, LimitType.PER_MINUTE, LimitScope.PER_IP, 1, "Batch processing"),
    RateLimit(10, 3600, LimitType.PER_HOUR, LimitScope.PER_IP, 2, "Batch processing hourly")
])

admin_endpoint_limits = create_rate_limited_endpoint([
    RateLimit(50, 60, LimitType.PER_MINUTE, LimitScope.PER_USER, 10, "Admin operations"),
    RateLimit(500, 3600, LimitType.PER_HOUR, LimitScope.PER_USER, 50, "Admin operations hourly")
])