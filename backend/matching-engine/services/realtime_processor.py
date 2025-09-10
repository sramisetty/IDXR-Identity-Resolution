"""
Real-time Processing and Scalability System for IDXR
High-performance, low-latency identity resolution with horizontal scaling capabilities
"""

import asyncio
import logging
import time
from typing import Dict, List, Optional, Tuple, Any, Callable
from dataclasses import dataclass, asdict
from enum import Enum
import json
import uuid
from datetime import datetime, timedelta
from concurrent.futures import ThreadPoolExecutor, ProcessPoolExecutor
import threading
from queue import Queue, PriorityQueue
import redis
import hashlib
from collections import defaultdict, deque
import numpy as np

logger = logging.getLogger(__name__)

class ProcessingPriority(Enum):
    CRITICAL = 1    # Emergency services, law enforcement
    HIGH = 2        # Healthcare, child services
    NORMAL = 3      # Standard government services
    LOW = 4         # Batch processing, reports

class ProcessingStatus(Enum):
    QUEUED = "queued"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    TIMEOUT = "timeout"

@dataclass
class ProcessingRequest:
    request_id: str
    demographic_data: Dict
    source_system: str
    priority: ProcessingPriority
    submitted_at: datetime
    timeout_seconds: int = 30
    callback_url: Optional[str] = None
    require_high_confidence: bool = False
    max_results: int = 10

@dataclass
class ProcessingResult:
    request_id: str
    status: ProcessingStatus
    matches: List[Dict]
    processing_time_ms: int
    confidence_scores: List[float]
    algorithm_used: str
    cache_hit: bool = False
    worker_id: Optional[str] = None
    completed_at: Optional[datetime] = None
    error_message: Optional[str] = None

class PerformanceMonitor:
    """Monitors system performance and provides metrics"""
    
    def __init__(self, window_size: int = 1000):
        self.window_size = window_size
        self.request_times = deque(maxlen=window_size)
        self.throughput_counter = 0
        self.error_counter = 0
        self.cache_hits = 0
        self.cache_misses = 0
        self.start_time = time.time()
        self.lock = threading.Lock()
    
    def record_request(self, processing_time_ms: int, cache_hit: bool = False, error: bool = False):
        """Record a completed request"""
        with self.lock:
            self.request_times.append(processing_time_ms)
            self.throughput_counter += 1
            
            if cache_hit:
                self.cache_hits += 1
            else:
                self.cache_misses += 1
            
            if error:
                self.error_counter += 1
    
    def get_metrics(self) -> Dict:
        """Get current performance metrics"""
        with self.lock:
            if not self.request_times:
                return {
                    'avg_response_time_ms': 0,
                    'p95_response_time_ms': 0,
                    'p99_response_time_ms': 0,
                    'throughput_rps': 0,
                    'error_rate': 0,
                    'cache_hit_rate': 0,
                    'total_requests': 0
                }
            
            times = sorted(self.request_times)
            runtime_hours = (time.time() - self.start_time) / 3600
            
            return {
                'avg_response_time_ms': np.mean(times),
                'p95_response_time_ms': np.percentile(times, 95),
                'p99_response_time_ms': np.percentile(times, 99),
                'throughput_rps': self.throughput_counter / max(runtime_hours * 3600, 1),
                'error_rate': self.error_counter / max(self.throughput_counter, 1),
                'cache_hit_rate': self.cache_hits / max(self.cache_hits + self.cache_misses, 1),
                'total_requests': self.throughput_counter,
                'uptime_hours': runtime_hours
            }

class IntelligentCache:
    """High-performance caching system with TTL and LRU eviction"""
    
    def __init__(self, max_size: int = 10000, default_ttl: int = 300):
        self.max_size = max_size
        self.default_ttl = default_ttl
        self.cache = {}
        self.access_times = {}
        self.expiry_times = {}
        self.lock = threading.RLock()
        
        # Start cleanup thread
        self.cleanup_thread = threading.Thread(target=self._cleanup_expired, daemon=True)
        self.cleanup_thread.start()
    
    def _generate_key(self, demographic_data: Dict) -> str:
        """Generate cache key from demographic data"""
        # Sort and serialize data for consistent keys
        sorted_data = json.dumps(demographic_data, sort_keys=True)
        return hashlib.sha256(sorted_data.encode()).hexdigest()
    
    def get(self, demographic_data: Dict) -> Optional[List[Dict]]:
        """Get cached results"""
        key = self._generate_key(demographic_data)
        
        with self.lock:
            if key not in self.cache:
                return None
            
            # Check expiry
            if time.time() > self.expiry_times.get(key, 0):
                self._remove_key(key)
                return None
            
            # Update access time for LRU
            self.access_times[key] = time.time()
            return self.cache[key]
    
    def put(self, demographic_data: Dict, results: List[Dict], ttl: Optional[int] = None):
        """Store results in cache"""
        key = self._generate_key(demographic_data)
        ttl = ttl or self.default_ttl
        
        with self.lock:
            # Ensure cache size limit
            if len(self.cache) >= self.max_size and key not in self.cache:
                self._evict_lru()
            
            current_time = time.time()
            self.cache[key] = results
            self.access_times[key] = current_time
            self.expiry_times[key] = current_time + ttl
    
    def _evict_lru(self):
        """Evict least recently used item"""
        if not self.access_times:
            return
        
        lru_key = min(self.access_times.keys(), key=lambda k: self.access_times[k])
        self._remove_key(lru_key)
    
    def _remove_key(self, key: str):
        """Remove key from all data structures"""
        self.cache.pop(key, None)
        self.access_times.pop(key, None)
        self.expiry_times.pop(key, None)
    
    def _cleanup_expired(self):
        """Background thread to clean up expired entries"""
        while True:
            try:
                time.sleep(60)  # Check every minute
                current_time = time.time()
                
                with self.lock:
                    expired_keys = [
                        key for key, expiry in self.expiry_times.items()
                        if current_time > expiry
                    ]
                    
                    for key in expired_keys:
                        self._remove_key(key)
                
            except Exception as e:
                logger.error(f"Error in cache cleanup: {str(e)}")

class WorkerPool:
    """Pool of worker processes for parallel identity resolution"""
    
    def __init__(self, num_workers: int = 4, max_queue_size: int = 1000):
        self.num_workers = num_workers
        self.max_queue_size = max_queue_size
        self.request_queue = PriorityQueue(maxsize=max_queue_size)
        self.result_callbacks = {}
        self.workers = []
        self.running = False
        self.lock = threading.Lock()
        
        # Worker statistics
        self.worker_stats = defaultdict(lambda: {
            'requests_processed': 0,
            'total_processing_time': 0,
            'errors': 0
        })
    
    def start(self):
        """Start worker threads"""
        self.running = True
        
        for i in range(self.num_workers):
            worker = threading.Thread(
                target=self._worker_loop,
                args=(f"worker_{i}",),
                daemon=True
            )
            worker.start()
            self.workers.append(worker)
        
        logger.info(f"Started {self.num_workers} worker threads")
    
    def stop(self):
        """Stop all workers"""
        self.running = False
        
        # Add poison pills to wake up workers
        for _ in range(self.num_workers):
            try:
                self.request_queue.put((0, None), timeout=1)
            except:
                pass
    
    def submit_request(self, request: ProcessingRequest, 
                      callback: Callable[[ProcessingResult], None]) -> bool:
        """Submit a request for processing"""
        try:
            # Priority queue uses tuple (priority, item)
            priority_value = request.priority.value
            self.request_queue.put((priority_value, request), timeout=1)
            
            with self.lock:
                self.result_callbacks[request.request_id] = callback
            
            return True
            
        except Exception as e:
            logger.error(f"Failed to submit request: {str(e)}")
            return False
    
    def _worker_loop(self, worker_id: str):
        """Main worker loop"""
        logger.info(f"Worker {worker_id} started")
        
        while self.running:
            try:
                # Get next request
                priority, request = self.request_queue.get(timeout=1)
                
                if request is None:  # Poison pill
                    break
                
                # Process the request
                start_time = time.time()
                result = self._process_request(request, worker_id)
                processing_time = (time.time() - start_time) * 1000
                
                # Update worker stats
                self.worker_stats[worker_id]['requests_processed'] += 1
                self.worker_stats[worker_id]['total_processing_time'] += processing_time
                
                if result.status == ProcessingStatus.FAILED:
                    self.worker_stats[worker_id]['errors'] += 1
                
                # Invoke callback
                with self.lock:
                    callback = self.result_callbacks.pop(request.request_id, None)
                
                if callback:
                    callback(result)
                
                self.request_queue.task_done()
                
            except Exception as e:
                if self.running:  # Only log if we're supposed to be running
                    logger.error(f"Worker {worker_id} error: {str(e)}")
        
        logger.info(f"Worker {worker_id} stopped")
    
    def _process_request(self, request: ProcessingRequest, worker_id: str) -> ProcessingResult:
        """Process a single identity resolution request"""
        start_time = time.time()
        
        try:
            # Import matching algorithms (avoiding circular imports)
            from ..algorithms.ai_hybrid import AIHybridMatcher
            from ..algorithms.deterministic import DeterministicMatcher
            from ..algorithms.probabilistic import ProbabilisticMatcher
            
            # Select algorithm based on request requirements
            if request.require_high_confidence:
                matcher = AIHybridMatcher()
                algorithm_name = "ai_hybrid"
            else:
                # Use faster deterministic matcher for normal requests
                matcher = DeterministicMatcher()
                algorithm_name = "deterministic"
            
            # Run matching
            matches = asyncio.run(matcher.match(request.demographic_data))
            
            # Filter and limit results
            if request.max_results:
                matches = matches[:request.max_results]
            
            processing_time = int((time.time() - start_time) * 1000)
            
            return ProcessingResult(
                request_id=request.request_id,
                status=ProcessingStatus.COMPLETED,
                matches=matches,
                processing_time_ms=processing_time,
                confidence_scores=[m.get('confidence_score', 0) for m in matches],
                algorithm_used=algorithm_name,
                worker_id=worker_id,
                completed_at=datetime.now()
            )
            
        except Exception as e:
            processing_time = int((time.time() - start_time) * 1000)
            logger.error(f"Processing error for request {request.request_id}: {str(e)}")
            
            return ProcessingResult(
                request_id=request.request_id,
                status=ProcessingStatus.FAILED,
                matches=[],
                processing_time_ms=processing_time,
                confidence_scores=[],
                algorithm_used="error",
                worker_id=worker_id,
                completed_at=datetime.now(),
                error_message=str(e)
            )
    
    def get_worker_stats(self) -> Dict:
        """Get worker statistics"""
        return dict(self.worker_stats)

class RealTimeProcessor:
    """Main real-time processing system"""
    
    def __init__(self, num_workers: int = 4, cache_size: int = 10000):
        self.cache = IntelligentCache(max_size=cache_size)
        self.worker_pool = WorkerPool(num_workers=num_workers)
        self.performance_monitor = PerformanceMonitor()
        self.active_requests = {}
        self.request_lock = threading.Lock()
        
        # Start systems
        self.worker_pool.start()
        
        # Rate limiting
        self.rate_limits = {
            'per_second': 100,
            'per_minute': 1000,
            'per_hour': 10000
        }
        self.rate_counters = {
            'second': {'count': 0, 'reset_time': time.time() + 1},
            'minute': {'count': 0, 'reset_time': time.time() + 60},
            'hour': {'count': 0, 'reset_time': time.time() + 3600}
        }
    
    async def process_identity_resolution(self, request: ProcessingRequest) -> ProcessingResult:
        """Main entry point for identity resolution"""
        start_time = time.time()
        
        try:
            # Check rate limits
            if not self._check_rate_limits():
                return ProcessingResult(
                    request_id=request.request_id,
                    status=ProcessingStatus.FAILED,
                    matches=[],
                    processing_time_ms=0,
                    confidence_scores=[],
                    algorithm_used="rate_limited",
                    error_message="Rate limit exceeded"
                )
            
            # Check cache first
            cached_results = self.cache.get(request.demographic_data)
            if cached_results:
                processing_time = int((time.time() - start_time) * 1000)
                self.performance_monitor.record_request(processing_time, cache_hit=True)
                
                return ProcessingResult(
                    request_id=request.request_id,
                    status=ProcessingStatus.COMPLETED,
                    matches=cached_results,
                    processing_time_ms=processing_time,
                    confidence_scores=[m.get('confidence_score', 0) for m in cached_results],
                    algorithm_used="cache",
                    cache_hit=True,
                    completed_at=datetime.now()
                )
            
            # Submit to worker pool
            result_future = asyncio.Future()
            
            def callback(result: ProcessingResult):
                result_future.set_result(result)
            
            success = self.worker_pool.submit_request(request, callback)
            if not success:
                return ProcessingResult(
                    request_id=request.request_id,
                    status=ProcessingStatus.FAILED,
                    matches=[],
                    processing_time_ms=0,
                    confidence_scores=[],
                    algorithm_used="queue_full",
                    error_message="Processing queue is full"
                )
            
            # Track active request
            with self.request_lock:
                self.active_requests[request.request_id] = {
                    'start_time': start_time,
                    'timeout': start_time + request.timeout_seconds
                }
            
            # Wait for result with timeout
            try:
                result = await asyncio.wait_for(result_future, timeout=request.timeout_seconds)
                
                # Cache successful results
                if result.status == ProcessingStatus.COMPLETED and result.matches:
                    self.cache.put(request.demographic_data, result.matches)
                
                # Record metrics
                self.performance_monitor.record_request(
                    result.processing_time_ms,
                    cache_hit=False,
                    error=(result.status == ProcessingStatus.FAILED)
                )
                
                return result
                
            except asyncio.TimeoutError:
                # Handle timeout
                return ProcessingResult(
                    request_id=request.request_id,
                    status=ProcessingStatus.TIMEOUT,
                    matches=[],
                    processing_time_ms=request.timeout_seconds * 1000,
                    confidence_scores=[],
                    algorithm_used="timeout",
                    error_message=f"Request timed out after {request.timeout_seconds} seconds"
                )
            
            finally:
                # Clean up active request
                with self.request_lock:
                    self.active_requests.pop(request.request_id, None)
        
        except Exception as e:
            processing_time = int((time.time() - start_time) * 1000)
            self.performance_monitor.record_request(processing_time, error=True)
            
            logger.error(f"Error processing request {request.request_id}: {str(e)}")
            
            return ProcessingResult(
                request_id=request.request_id,
                status=ProcessingStatus.FAILED,
                matches=[],
                processing_time_ms=processing_time,
                confidence_scores=[],
                algorithm_used="error",
                error_message=str(e)
            )
    
    def _check_rate_limits(self) -> bool:
        """Check if request is within rate limits"""
        current_time = time.time()
        
        for period, counter in self.rate_counters.items():
            # Reset counter if time window has passed
            if current_time > counter['reset_time']:
                counter['count'] = 0
                if period == 'second':
                    counter['reset_time'] = current_time + 1
                elif period == 'minute':
                    counter['reset_time'] = current_time + 60
                elif period == 'hour':
                    counter['reset_time'] = current_time + 3600
            
            # Check limit
            limit_key = f"per_{period}"
            if counter['count'] >= self.rate_limits[limit_key]:
                return False
            
            # Increment counter
            counter['count'] += 1
        
        return True
    
    def get_system_status(self) -> Dict:
        """Get comprehensive system status"""
        metrics = self.performance_monitor.get_metrics()
        worker_stats = self.worker_pool.get_worker_stats()
        
        # Active requests info
        active_count = len(self.active_requests)
        
        # Queue status
        queue_size = self.worker_pool.request_queue.qsize()
        
        return {
            'status': 'healthy',
            'timestamp': datetime.now().isoformat(),
            'performance_metrics': metrics,
            'active_requests': active_count,
            'queue_size': queue_size,
            'worker_stats': worker_stats,
            'cache_stats': {
                'size': len(self.cache.cache),
                'max_size': self.cache.max_size,
                'hit_rate': metrics.get('cache_hit_rate', 0)
            },
            'rate_limits': {
                'per_second': {
                    'limit': self.rate_limits['per_second'],
                    'current': self.rate_counters['second']['count']
                },
                'per_minute': {
                    'limit': self.rate_limits['per_minute'],
                    'current': self.rate_counters['minute']['count']
                },
                'per_hour': {
                    'limit': self.rate_limits['per_hour'],
                    'current': self.rate_counters['hour']['count']
                }
            }
        }
    
    def shutdown(self):
        """Gracefully shutdown the processor"""
        logger.info("Shutting down real-time processor...")
        self.worker_pool.stop()
        logger.info("Real-time processor shutdown complete")

class BatchProcessor:
    """High-throughput batch processing system"""
    
    def __init__(self, realtime_processor: RealTimeProcessor):
        self.realtime_processor = realtime_processor
        self.batch_jobs = {}
        self.batch_lock = threading.Lock()
    
    async def submit_batch_job(self, job_id: str, identities: List[Dict], 
                             callback_url: Optional[str] = None) -> Dict:
        """Submit a batch processing job"""
        try:
            job_info = {
                'job_id': job_id,
                'total_records': len(identities),
                'processed_records': 0,
                'failed_records': 0,
                'results': [],
                'status': 'processing',
                'started_at': datetime.now(),
                'callback_url': callback_url
            }
            
            with self.batch_lock:
                self.batch_jobs[job_id] = job_info
            
            # Process batch in background
            asyncio.create_task(self._process_batch(job_id, identities))
            
            return {
                'job_id': job_id,
                'status': 'submitted',
                'total_records': len(identities),
                'estimated_completion': datetime.now() + timedelta(minutes=len(identities) // 10)
            }
            
        except Exception as e:
            logger.error(f"Error submitting batch job {job_id}: {str(e)}")
            raise
    
    async def _process_batch(self, job_id: str, identities: List[Dict]):
        """Process a batch job"""
        try:
            for i, identity_data in enumerate(identities):
                request = ProcessingRequest(
                    request_id=f"{job_id}_{i}",
                    demographic_data=identity_data,
                    source_system="batch",
                    priority=ProcessingPriority.LOW,
                    submitted_at=datetime.now(),
                    timeout_seconds=60
                )
                
                result = await self.realtime_processor.process_identity_resolution(request)
                
                with self.batch_lock:
                    job_info = self.batch_jobs[job_id]
                    job_info['processed_records'] += 1
                    
                    if result.status == ProcessingStatus.COMPLETED:
                        job_info['results'].append({
                            'identity_data': identity_data,
                            'matches': result.matches,
                            'confidence_scores': result.confidence_scores
                        })
                    else:
                        job_info['failed_records'] += 1
                        job_info['results'].append({
                            'identity_data': identity_data,
                            'error': result.error_message
                        })
            
            # Mark job as completed
            with self.batch_lock:
                self.batch_jobs[job_id]['status'] = 'completed'
                self.batch_jobs[job_id]['completed_at'] = datetime.now()
            
            logger.info(f"Batch job {job_id} completed")
            
        except Exception as e:
            logger.error(f"Error processing batch job {job_id}: {str(e)}")
            with self.batch_lock:
                self.batch_jobs[job_id]['status'] = 'failed'
                self.batch_jobs[job_id]['error'] = str(e)
    
    def get_batch_status(self, job_id: str) -> Optional[Dict]:
        """Get status of a batch job"""
        with self.batch_lock:
            return self.batch_jobs.get(job_id)