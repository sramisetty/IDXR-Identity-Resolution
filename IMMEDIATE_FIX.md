# IMMEDIATE FIX for API Endpoint Issues

## Current Status ❌
- Production: `https://idxr.ramisetty.net/api/v1/health` → 404 (Python API)
- Production: `https://idxr.ramisetty.net/api/v1/statistics` → ✅ (Node.js API) 
- Local: `http://127.0.0.1:3001/api/v1/health` → ✅ (Node.js API)

## Root Cause 🔍
**Nginx is routing inconsistently** between two API servers:
- Port 3000: Python FastAPI (has `/api/v1/statistics`, missing `/api/v1/health`) 
- Port 3001: Node.js IDXR (has ALL endpoints including `/api/v1/health`)

## IMMEDIATE WORKAROUNDS 🚀

### Option 1: Use Development Server
```
http://localhost:3001/admin-dashboard.html
```
All endpoints work perfectly on the development server.

### Option 2: Add Missing Endpoint to Node.js
Since some requests hit the Python API, add a fallback endpoint:

```javascript
// Add to backend/server.js (already running)
app.get('/api/v1/*', (req, res) => {
  // Catch-all for any missing v1 endpoints
  if (req.path === '/api/v1/health') {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      server: 'node-js-fallback'
    });
  } else {
    res.status(404).json({
      status: 'error',
      message: 'Endpoint not found',
      path: req.originalUrl
    });
  }
});
```

### Option 3: Force Kill Python API (Temporary)
```bash
# Find and kill the Python process on port 3000
netstat -ano | findstr ":3000"
taskkill /F /PID [PID_NUMBER]
```

## VERIFIED ENDPOINTS ✅
These work on localhost:3001:
- `/api/v1/health` 
- `/api/v1/statistics`
- `/api/v1/batch/*`
- `/api/v1/jobs/*` 
- `/api/v1/insights/*`
- All WebSocket connections

## Next Steps 🔧
1. **Immediate**: Use `http://localhost:3001` for development/testing
2. **Short-term**: Add fallback endpoint (Option 2)
3. **Long-term**: Investigate nginx upstream configuration or multiple server blocks

## Test Commands
```bash
# Local (Working)
curl http://127.0.0.1:3001/api/v1/health

# Production (Mixed Results)
curl https://idxr.ramisetty.net/api/v1/health     # 404
curl https://idxr.ramisetty.net/api/v1/statistics # Works
```

The core issue is nginx routing inconsistency, but your Node.js server is fully functional!