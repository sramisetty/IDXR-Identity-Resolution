# IDXR Comprehensive Metrics & Data Collection System

## 📊 Overview

The IDXR system now captures comprehensive metrics and data during job processing to power all dashboard sections, reporting features, and analytics. This document outlines all the data being collected and the API endpoints available.

## 🔄 Data Collection During Job Processing

### Performance Metrics
- **Processing Time**: Total and per-stage processing duration
- **Throughput**: Records processed per second
- **Memory Usage**: Real-time heap and system memory consumption
- **CPU Usage**: System CPU utilization during processing
- **Success/Error Rates**: Percentage of successful vs failed records
- **Queue Statistics**: Active, queued, completed, and failed job counts

### Algorithm Performance Data
- **Algorithm-Specific Metrics**: Performance for each algorithm used
- **Accuracy Scores**: Confidence and match accuracy percentages
- **Processing Times**: Individual algorithm execution times
- **Success Rates**: Algorithm-specific success rates
- **Confidence Trends**: Time-series confidence score tracking
- **Quality Flags**: Algorithm-generated quality indicators

### Data Source Analytics
- **Source Type Performance**: File upload, database, API, cloud storage stats
- **File Size Metrics**: Average file sizes and processing correlation
- **Error Patterns**: Common error types per data source
- **Quality Scores**: Data completeness and accuracy by source
- **Processing History**: Historical performance by data source type

### Processing Statistics by Job Type
- **Job Type Metrics**: Identity matching, validation, deduplication, etc.
- **Resource Usage**: CPU and memory consumption by job type
- **Quality Distribution**: High/medium/low quality job categorization
- **Throughput Analysis**: Processing speed by job type
- **Error Analytics**: Failure patterns and common issues

### Data Quality Metrics
- **Overall Quality Score**: Comprehensive data quality assessment
- **Completeness Percentage**: How complete the data is
- **Accuracy Metrics**: Data accuracy measurements
- **Consistency Scores**: Data consistency across fields
- **Duplicate Detection**: Duplicate record percentages
- **Missing Data Analysis**: Missing field analysis
- **Field-Level Quality**: Individual field quality scores
- **Validation Errors**: Specific validation issues found
- **Improvement Suggestions**: Automated recommendations

### System Resource Monitoring
- **Real-Time CPU Usage**: Current and historical CPU utilization
- **Memory Statistics**: Total, used, available memory
- **System Load**: Load averages and capacity metrics
- **Process Memory**: Node.js process memory usage
- **Network Interfaces**: Network configuration and status
- **System Uptime**: Server availability metrics

## 🌐 API Endpoints for Dashboard Data

### Core Dashboard Data
- `GET /api/v1/dashboard` - Complete dashboard data package
- `GET /api/v1/insights/summary` - Executive summary of all metrics
- `GET /api/v1/metrics/realtime` - Real-time system metrics

### Performance Analytics
- `GET /api/v1/insights/performance?timeframe=24h` - Performance overview
- `GET /api/v1/insights/trends?days=7` - Trend analysis
- `GET /api/v1/processing/stats` - Processing statistics by job type

### Algorithm Performance
- `GET /api/v1/algorithms/performance` - All algorithm metrics
- `GET /api/v1/algorithms/top` - Top performing algorithms (24h)

### Data Source Analytics
- `GET /api/v1/data-sources/stats` - Data source performance statistics

### System Monitoring
- `GET /api/v1/system/resources` - Current resource usage
- `GET /api/v1/websocket/stats` - WebSocket connection statistics

### Quality & Error Analytics
- `GET /api/v1/quality/overview` - Data quality overview
- `GET /api/v1/errors/metrics` - Error patterns and metrics

### Audit & Compliance
- `GET /api/v1/audit?limit=100&job_id=xyz` - Detailed audit logs
- `GET /api/v1/batch/queue/statistics` - Queue performance stats

## 📈 Dashboard Section Data Mapping

### System Overview Page
**Performance Overview**:
- Active jobs, completed jobs, success rates
- Average processing time, throughput metrics
- Records processed, queue status

**Real-time Metrics**:
- Current active jobs, processing throughput
- Recent completion rates, error rates
- System health indicators

**Resource Usage**:
- CPU usage, memory consumption
- System load, process memory
- Network status, uptime

### Reports Page
**Algorithm Performance**:
- Individual algorithm success rates
- Processing time comparisons
- Accuracy and confidence trends
- Algorithm efficiency rankings

**Data Source Analytics**:
- Performance by data source type
- Common error patterns
- File size impact analysis
- Quality scores by source

**Processing Statistics**:
- Job type performance breakdown
- Resource utilization by job type
- Quality distribution analysis
- Throughput comparisons

### Data Quality Page
**Quality Overview**:
- Overall quality scores
- Data completeness metrics
- Accuracy and consistency scores
- Improvement opportunities

**Field-Level Analysis**:
- Individual field quality scores
- Validation error patterns
- Missing data analysis
- Duplicate detection results

### Performance Page
**Top Performing Algorithms (Last 24h)**:
- Algorithm rankings by composite score
- Success rate analysis
- Processing time efficiency
- Usage frequency

**Trend Analysis**:
- Hourly performance trends
- Daily processing volumes
- Resource usage patterns
- Quality improvements over time

### Audit Logs Page
**Comprehensive Audit Trail**:
- All job lifecycle events
- User actions and timestamps
- System changes and configurations
- Error occurrences and resolutions
- Performance milestones

## ⚡ Real-Time Updates

### WebSocket Events
- `job_update` - Real-time job progress and status changes
- `metrics_update` - Live system resource updates
- `audit_update` - New audit log entries
- `queue_stats` - Queue statistics updates

### Automatic Refresh
- Dashboard metrics updated every 5 seconds
- Resource monitoring every minute
- Trend data calculated hourly
- Historical cleanup runs daily

## 📊 Data Retention

### Metrics Storage
- **Performance Metrics**: 7 days detailed, 30 days aggregated
- **Algorithm Data**: 24 hours detailed trends, 7 days summary
- **Quality Metrics**: 7 days detailed analysis
- **Resource Data**: 24 hours minute-by-minute, 7 days hourly
- **Audit Logs**: 90 days complete history
- **Error Logs**: 30 days with categorization

### Time Series Data
- **Hourly Aggregates**: 24 hours of detailed data
- **Daily Summaries**: 7 days of historical trends
- **Resource Trends**: 1 hour of minute-by-minute data

## 🔧 Configuration

### Environment Variables
```bash
REDIS_HOST=localhost          # Redis server for enhanced storage
REDIS_PORT=6379              # Redis port
METRICS_RETENTION_DAYS=7     # How long to keep detailed metrics
AUDIT_RETENTION_DAYS=90      # Audit log retention period
RESOURCE_MONITOR_INTERVAL=60000  # Resource monitoring interval (ms)
```

### Customization
- Metric collection intervals can be adjusted
- Data retention periods are configurable
- Algorithm performance weights are customizable
- Quality thresholds can be modified per job type

## 🚀 Usage Examples

### Getting Complete Dashboard Data
```javascript
const response = await fetch('/api/v1/dashboard');
const dashboardData = await response.json();
console.log(dashboardData.dashboard);
```

### Real-Time WebSocket Updates
```javascript
const ws = window.IDXRWebSocket;
ws.on('metrics_update', (data) => {
    updateDashboardCharts(data);
});
```

### Algorithm Performance Analysis
```javascript
const algorithms = await fetch('/api/v1/algorithms/performance');
const topPerformers = await fetch('/api/v1/algorithms/top');
```

This comprehensive system ensures that every aspect of job processing is measured, tracked, and made available for analysis, reporting, and dashboard visualization.