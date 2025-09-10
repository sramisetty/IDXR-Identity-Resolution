"""
Advanced Monitoring and Observability Middleware
Provides comprehensive metrics collection, tracing, and system observability
"""

import asyncio
import time
import json
import logging
import os
import traceback
import psutil
import threading
from typing import Dict, List, Optional, Any, Callable
from dataclasses import dataclass, asdict
from datetime import datetime, timedelta
from enum import Enum
from collections import defaultdict, deque
import uuid

from fastapi import Request, Response
from fastapi.middleware.base import BaseHTTPMiddleware
from fastapi.responses import JSONResponse
import prometheus_client
from prometheus_client import Counter, Histogram, Gauge, Info

# Prometheus metrics
REQUEST_COUNT = Counter(
    'idxr_http_requests_total',
    'Total HTTP requests',
    ['method', 'endpoint', 'status_code', 'user_type']
)

REQUEST_DURATION = Histogram(
    'idxr_http_request_duration_seconds',
    'HTTP request duration',
    ['method', 'endpoint', 'status_code'],
    buckets=(0.1, 0.25, 0.5, 1.0, 2.5, 5.0, 10.0, float('inf'))
)

ACTIVE_REQUESTS = Gauge(
    'idxr_active_requests',
    'Number of active HTTP requests'
)

SYSTEM_CPU_USAGE = Gauge(
    'idxr_system_cpu_usage_percent',
    'System CPU usage percentage'
)

SYSTEM_MEMORY_USAGE = Gauge(
    'idxr_system_memory_usage_percent',
    'System memory usage percentage'
)

SYSTEM_DISK_USAGE = Gauge(
    'idxr_system_disk_usage_percent',
    'System disk usage percentage'
)

MATCHING_ACCURACY = Histogram(
    'idxr_matching_accuracy',
    'Identity matching accuracy scores',
    buckets=(0.5, 0.6, 0.7, 0.8, 0.85, 0.9, 0.95, 0.99, 1.0)
)

MATCHING_DURATION = Histogram(
    'idxr_matching_duration_seconds',
    'Time spent on identity matching',
    ['algorithm_type'],
    buckets=(0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1.0, 2.0, 5.0)
)

DATABASE_OPERATIONS = Counter(
    'idxr_database_operations_total',
    'Total database operations',
    ['operation', 'table', 'status']
)

CACHE_OPERATIONS = Counter(
    'idxr_cache_operations_total',
    'Total cache operations',
    ['operation', 'status']
)

SECURITY_EVENTS = Counter(
    'idxr_security_events_total',
    'Total security events',
    ['event_type', 'severity']
)

class MetricType(Enum):
    COUNTER = "counter"
    GAUGE = "gauge"
    HISTOGRAM = "histogram"
    SUMMARY = "summary"

class AlertLevel(Enum):
    INFO = "info"
    WARNING = "warning"
    ERROR = "error"
    CRITICAL = "critical"

@dataclass
class TraceSpan:
    trace_id: str
    span_id: str
    operation_name: str
    start_time: float
    end_time: Optional[float] = None
    duration_ms: Optional[float] = None
    tags: Dict[str, Any] = None
    logs: List[Dict[str, Any]] = None
    status: str = "ok"
    
    def __post_init__(self):
        if self.tags is None:
            self.tags = {}
        if self.logs is None:
            self.logs = []

@dataclass
class SystemAlert:
    alert_id: str
    timestamp: datetime
    level: AlertLevel
    component: str
    metric_name: str
    current_value: float
    threshold: float
    message: str
    tags: Dict[str, Any] = None

class MetricsCollector:
    """Advanced metrics collection and aggregation"""
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.custom_metrics = defaultdict(list)
        self.metric_history = defaultdict(lambda: deque(maxlen=1000))
        self.alerts = []
        self.alert_thresholds = self._initialize_alert_thresholds()
        
        # Start system metrics collection thread
        self.metrics_thread = threading.Thread(target=self._collect_system_metrics, daemon=True)
        self.metrics_thread.start()
        
    def _initialize_alert_thresholds(self) -> Dict[str, Dict[str, float]]:
        """Initialize alert thresholds for various metrics"""
        return {
            'cpu_usage': {'warning': 75.0, 'critical': 90.0},
            'memory_usage': {'warning': 80.0, 'critical': 95.0},
            'disk_usage': {'warning': 85.0, 'critical': 95.0},
            'response_time': {'warning': 1000.0, 'critical': 5000.0},
            'error_rate': {'warning': 1.0, 'critical': 5.0},
            'queue_depth': {'warning': 100, 'critical': 500}
        }
    
    def record_request_metrics(self, method: str, endpoint: str, status_code: int,
                              duration: float, user_type: str = "anonymous"):
        """Record HTTP request metrics"""
        REQUEST_COUNT.labels(
            method=method,
            endpoint=endpoint,
            status_code=status_code,
            user_type=user_type
        ).inc()
        
        REQUEST_DURATION.labels(
            method=method,
            endpoint=endpoint,
            status_code=status_code
        ).observe(duration)
    
    def record_matching_metrics(self, algorithm: str, accuracy: float, duration: float):
        """Record identity matching metrics"""
        MATCHING_ACCURACY.observe(accuracy)
        MATCHING_DURATION.labels(algorithm_type=algorithm).observe(duration)
    
    def record_database_operation(self, operation: str, table: str, status: str):
        """Record database operation metrics"""
        DATABASE_OPERATIONS.labels(
            operation=operation,
            table=table,
            status=status
        ).inc()
    
    def record_cache_operation(self, operation: str, status: str):
        """Record cache operation metrics"""
        CACHE_OPERATIONS.labels(
            operation=operation,
            status=status
        ).inc()
    
    def record_security_event(self, event_type: str, severity: str):
        """Record security event metrics"""
        SECURITY_EVENTS.labels(
            event_type=event_type,
            severity=severity
        ).inc()
    
    def record_custom_metric(self, name: str, value: float, metric_type: MetricType,
                           tags: Dict[str, str] = None):
        """Record custom application metrics"""
        timestamp = time.time()
        metric_data = {
            'name': name,
            'value': value,
            'type': metric_type.value,
            'timestamp': timestamp,
            'tags': tags or {}
        }
        
        self.custom_metrics[name].append(metric_data)
        self.metric_history[name].append((timestamp, value))
        
        # Check for alerts
        self._check_alert_conditions(name, value)
    
    def _collect_system_metrics(self):
        """Collect system-level metrics in background thread"""
        while True:
            try:
                # CPU usage
                cpu_percent = psutil.cpu_percent(interval=1)
                SYSTEM_CPU_USAGE.set(cpu_percent)
                self._check_alert_conditions('cpu_usage', cpu_percent)
                
                # Memory usage
                memory = psutil.virtual_memory()
                SYSTEM_MEMORY_USAGE.set(memory.percent)
                self._check_alert_conditions('memory_usage', memory.percent)
                
                # Disk usage
                disk = psutil.disk_usage('/')
                disk_percent = (disk.used / disk.total) * 100
                SYSTEM_DISK_USAGE.set(disk_percent)
                self._check_alert_conditions('disk_usage', disk_percent)
                
                # Sleep for 30 seconds between collections
                time.sleep(30)
                
            except Exception as e:
                self.logger.error(f"System metrics collection error: {str(e)}")
                time.sleep(60)  # Wait longer on error
    
    def _check_alert_conditions(self, metric_name: str, value: float):
        """Check if metric value triggers alerts"""
        if metric_name not in self.alert_thresholds:
            return
        
        thresholds = self.alert_thresholds[metric_name]
        
        # Check critical threshold
        if value >= thresholds.get('critical', float('inf')):
            self._create_alert(metric_name, value, AlertLevel.CRITICAL, thresholds['critical'])
        
        # Check warning threshold
        elif value >= thresholds.get('warning', float('inf')):
            self._create_alert(metric_name, value, AlertLevel.WARNING, thresholds['warning'])
    
    def _create_alert(self, metric_name: str, value: float, level: AlertLevel, threshold: float):
        """Create and store alert"""
        alert = SystemAlert(
            alert_id=str(uuid.uuid4()),
            timestamp=datetime.utcnow(),
            level=level,
            component="system",
            metric_name=metric_name,
            current_value=value,
            threshold=threshold,
            message=f"{metric_name} is {value:.2f}, exceeding {level.value} threshold of {threshold}",
            tags={'component': 'monitoring'}
        )
        
        self.alerts.append(alert)
        self.logger.warning(f"ALERT: {alert.message}")
        
        # Keep only last 100 alerts
        if len(self.alerts) > 100:
            self.alerts = self.alerts[-100:]
    
    def get_metrics_summary(self) -> Dict[str, Any]:
        """Get comprehensive metrics summary"""
        return {
            'system_metrics': {
                'cpu_usage': psutil.cpu_percent(),
                'memory_usage': psutil.virtual_memory().percent,
                'disk_usage': (psutil.disk_usage('/').used / psutil.disk_usage('/').total) * 100,
                'active_processes': len(psutil.pids())
            },
            'application_metrics': {
                'custom_metrics_count': len(self.custom_metrics),
                'total_alerts': len(self.alerts),
                'active_alerts': len([a for a in self.alerts if a.level in [AlertLevel.WARNING, AlertLevel.CRITICAL]])
            },
            'recent_alerts': [asdict(alert) for alert in self.alerts[-10:]]
        }

class DistributedTracing:
    """Distributed tracing for request flow analysis"""
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.active_traces = {}
        self.completed_traces = deque(maxlen=1000)
        
    def start_trace(self, operation_name: str, trace_id: str = None) -> TraceSpan:
        """Start a new trace span"""
        if trace_id is None:
            trace_id = str(uuid.uuid4())
        
        span = TraceSpan(
            trace_id=trace_id,
            span_id=str(uuid.uuid4()),
            operation_name=operation_name,
            start_time=time.time()
        )
        
        self.active_traces[span.span_id] = span
        return span
    
    def finish_span(self, span: TraceSpan, status: str = "ok", tags: Dict[str, Any] = None):
        """Finish a trace span"""
        span.end_time = time.time()
        span.duration_ms = (span.end_time - span.start_time) * 1000
        span.status = status
        
        if tags:
            span.tags.update(tags)
        
        # Move to completed traces
        if span.span_id in self.active_traces:
            del self.active_traces[span.span_id]
        
        self.completed_traces.append(span)
        
        # Log trace completion
        self.logger.info(f"Trace completed: {span.operation_name} [{span.duration_ms:.2f}ms]")
    
    def add_span_log(self, span: TraceSpan, level: str, message: str, data: Dict[str, Any] = None):
        """Add log entry to span"""
        log_entry = {
            'timestamp': time.time(),
            'level': level,
            'message': message,
            'data': data or {}
        }
        span.logs.append(log_entry)
    
    def get_trace_by_id(self, trace_id: str) -> List[TraceSpan]:
        """Get all spans for a trace ID"""
        spans = []
        
        # Check active traces
        for span in self.active_traces.values():
            if span.trace_id == trace_id:
                spans.append(span)
        
        # Check completed traces
        for span in self.completed_traces:
            if span.trace_id == trace_id:
                spans.append(span)
        
        return sorted(spans, key=lambda s: s.start_time)

class HealthChecker:
    """Comprehensive health checking system"""
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.health_checks = {}
        self.health_status = {}
        
        # Register default health checks
        self._register_default_checks()
    
    def _register_default_checks(self):
        """Register default health checks"""
        self.register_check("system_cpu", self._check_cpu_health)
        self.register_check("system_memory", self._check_memory_health)
        self.register_check("system_disk", self._check_disk_health)
    
    def register_check(self, name: str, check_function: Callable[[], Dict[str, Any]]):
        """Register a health check"""
        self.health_checks[name] = check_function
        self.logger.info(f"Registered health check: {name}")
    
    async def run_health_checks(self) -> Dict[str, Any]:
        """Run all registered health checks"""
        results = {}
        overall_healthy = True
        
        for name, check_func in self.health_checks.items():
            try:
                result = await asyncio.get_event_loop().run_in_executor(None, check_func)
                results[name] = result
                
                if not result.get('healthy', False):
                    overall_healthy = False
                    
            except Exception as e:
                self.logger.error(f"Health check {name} failed: {str(e)}")
                results[name] = {
                    'healthy': False,
                    'error': str(e),
                    'timestamp': datetime.utcnow().isoformat()
                }
                overall_healthy = False
        
        return {
            'healthy': overall_healthy,
            'timestamp': datetime.utcnow().isoformat(),
            'checks': results
        }
    
    def _check_cpu_health(self) -> Dict[str, Any]:
        """Check CPU health"""
        cpu_percent = psutil.cpu_percent(interval=1)
        return {
            'healthy': cpu_percent < 90,
            'cpu_usage': cpu_percent,
            'threshold': 90,
            'timestamp': datetime.utcnow().isoformat()
        }
    
    def _check_memory_health(self) -> Dict[str, Any]:
        """Check memory health"""
        memory = psutil.virtual_memory()
        return {
            'healthy': memory.percent < 95,
            'memory_usage': memory.percent,
            'available_gb': memory.available / (1024**3),
            'threshold': 95,
            'timestamp': datetime.utcnow().isoformat()
        }
    
    def _check_disk_health(self) -> Dict[str, Any]:
        """Check disk health"""
        disk = psutil.disk_usage('/')
        usage_percent = (disk.used / disk.total) * 100
        return {
            'healthy': usage_percent < 95,
            'disk_usage': usage_percent,
            'free_gb': disk.free / (1024**3),
            'threshold': 95,
            'timestamp': datetime.utcnow().isoformat()
        }

class MonitoringMiddleware(BaseHTTPMiddleware):
    """FastAPI middleware for comprehensive monitoring"""
    
    def __init__(self, app):
        super().__init__(app)
        self.metrics_collector = MetricsCollector()
        self.tracer = DistributedTracing()
        self.health_checker = HealthChecker()
        self.logger = logging.getLogger(__name__)
        
    async def dispatch(self, request: Request, call_next: Callable):
        """Process request with monitoring"""
        # Start trace
        operation_name = f"{request.method} {request.url.path}"
        span = self.tracer.start_trace(operation_name)
        
        # Add trace ID to request state for downstream use
        request.state.trace_id = span.trace_id
        request.state.span_id = span.span_id
        
        start_time = time.time()
        ACTIVE_REQUESTS.inc()
        
        try:
            # Add request tags to span
            self.tracer.add_span_log(span, "info", "Request started", {
                'method': request.method,
                'path': request.url.path,
                'client_ip': request.client.host if request.client else 'unknown',
                'user_agent': request.headers.get('user-agent', 'unknown')
            })
            
            # Process request
            response = await call_next(request)
            
            # Calculate metrics
            duration = time.time() - start_time
            status_code = response.status_code
            
            # Determine user type (simplified)
            user_type = "anonymous"
            if request.headers.get('authorization'):
                user_type = "authenticated"
            
            # Record metrics
            self.metrics_collector.record_request_metrics(
                request.method,
                request.url.path,
                status_code,
                duration,
                user_type
            )
            
            # Add response headers for observability
            response.headers["X-Trace-Id"] = span.trace_id
            response.headers["X-Processing-Time"] = f"{duration:.3f}"
            
            # Finish trace with success
            self.tracer.finish_span(span, "ok", {
                'status_code': status_code,
                'response_size': response.headers.get('content-length', 'unknown'),
                'duration_ms': duration * 1000
            })
            
            return response
            
        except Exception as e:
            # Record error metrics
            duration = time.time() - start_time
            self.metrics_collector.record_request_metrics(
                request.method,
                request.url.path,
                500,
                duration
            )
            
            # Add error to trace
            self.tracer.add_span_log(span, "error", str(e), {
                'exception_type': type(e).__name__,
                'traceback': traceback.format_exc()
            })
            
            # Finish trace with error
            self.tracer.finish_span(span, "error", {
                'error': True,
                'exception': str(e)
            })
            
            # Re-raise exception
            raise
            
        finally:
            ACTIVE_REQUESTS.dec()

# Utility functions for custom monitoring
def monitor_function_execution(operation_name: str = None):
    """Decorator for monitoring function execution"""
    def decorator(func):
        async def async_wrapper(*args, **kwargs):
            name = operation_name or f"{func.__module__}.{func.__name__}"
            
            # Create span for function execution
            tracer = DistributedTracing()
            span = tracer.start_trace(name)
            
            try:
                result = await func(*args, **kwargs)
                tracer.finish_span(span, "ok")
                return result
            except Exception as e:
                tracer.add_span_log(span, "error", str(e))
                tracer.finish_span(span, "error")
                raise
        
        def sync_wrapper(*args, **kwargs):
            name = operation_name or f"{func.__module__}.{func.__name__}"
            
            start_time = time.time()
            try:
                result = func(*args, **kwargs)
                duration = time.time() - start_time
                
                # Log execution metrics
                logging.getLogger(__name__).info(
                    f"Function executed: {name} [{duration*1000:.2f}ms]"
                )
                
                return result
            except Exception as e:
                duration = time.time() - start_time
                logging.getLogger(__name__).error(
                    f"Function failed: {name} [{duration*1000:.2f}ms] - {str(e)}"
                )
                raise
        
        if asyncio.iscoroutinefunction(func):
            return async_wrapper
        else:
            return sync_wrapper
    
    return decorator

def get_prometheus_metrics() -> str:
    """Get Prometheus metrics in text format"""
    return prometheus_client.generate_latest().decode('utf-8')

# Global instances for easy access
metrics_collector = MetricsCollector()
distributed_tracer = DistributedTracing()
health_checker = HealthChecker()