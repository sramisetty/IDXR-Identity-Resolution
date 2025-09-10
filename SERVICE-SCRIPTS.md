# IDXR Service Management Scripts

This directory contains scripts to easily start, stop, and monitor all IDXR Identity Cross-Resolution System services.

## 📋 Available Scripts

### 1. **start-services.bat** (Windows)
Starts all IDXR services on Windows systems.

**Usage:**
```cmd
# Double-click the file or run from command prompt
start-services.bat
```

**What it does:**
- ✅ Checks for Python and Node.js dependencies
- ✅ Installs required packages (npm install, pip install)
- ✅ Starts 3 services in separate windows:
  - FastAPI Matching Engine (Port 3000)
  - Node.js API Server (Port 3001)
  - Frontend HTTP Server (Port 8080)
- ✅ Creates logs directory and log files
- ✅ Opens frontend in your default browser

### 2. **start-services.sh** (Linux/macOS/WSL)
Cross-platform script for Unix-based systems.

**Usage:**
```bash
# Make executable (first time only)
chmod +x start-services.sh

# Run the script
./start-services.sh
```

**What it does:**
- ✅ Checks system dependencies
- ✅ Installs required packages
- ✅ Starts services as background processes
- ✅ Creates PID files for process management
- ✅ Tests service health after startup
- ✅ Attempts to open browser automatically

### 3. **stop-services.sh** (Linux/macOS/WSL)
Gracefully stops all IDXR services.

**Usage:**
```bash
./stop-services.sh
```

**What it does:**
- ✅ Stops services using PID files
- ✅ Force-kills stubborn processes
- ✅ Cleans up port usage
- ✅ Preserves log files

### 4. **monitor-services.sh** (Linux/macOS/WSL)
Comprehensive service health monitoring.

**Usage:**
```bash
./monitor-services.sh
```

**What it provides:**
- ✅ Real-time service status
- ✅ HTTP health check results
- ✅ Process status and PIDs
- ✅ Service uptime information
- ✅ Log file sizes
- ✅ Port usage details

## 🚀 Quick Start

### Windows:
```cmd
# Start all services
start-services.bat

# Services will open in separate windows
# Frontend will open at http://localhost:8080
# Close windows to stop services
```

### Linux/macOS/WSL:
```bash
# Start all services
./start-services.sh

# Monitor services
./monitor-services.sh

# Stop all services
./stop-services.sh
```

## 📊 Service Architecture

| Service | Port | URL | Purpose |
|---------|------|-----|---------|
| **Frontend** | 8080 | http://localhost:8080 | Web interface |
| **Matching Engine** | 3000 | http://localhost:3000 | FastAPI identity resolution |
| **API Server** | 3001 | http://localhost:3001 | Node.js backend API |

## 📁 Log Files

All services create log files in the `logs/` directory:

- `logs/matching-engine.log` - FastAPI service logs
- `logs/api-server.log` - Node.js API logs  
- `logs/frontend.log` - HTTP server logs
- `logs/matching-engine.pid` - Process ID file
- `logs/api-server.pid` - Process ID file
- `logs/frontend.pid` - Process ID file

## 🔧 Prerequisites

### Required Software:
- **Python 3.7+** (with pip)
- **Node.js 14+** (with npm)

### System Requirements:
- **Ports**: 3000, 3001, 8080 must be available
- **Memory**: ~200MB total for all services
- **Disk**: ~50MB for logs and cache

## 🛠️ Troubleshooting

### Port Conflicts
```bash
# Check what's using ports
lsof -i :3000 -i :3001 -i :8080

# Kill processes on specific ports
kill -9 $(lsof -ti:3000)
```

### Service Won't Start
1. Check logs in `logs/` directory
2. Verify dependencies: `python --version` and `node --version`
3. Ensure ports are available
4. Run `npm install` manually if needed

### Clean Restart
```bash
# Linux/macOS/WSL
./stop-services.sh
rm -rf logs/
./start-services.sh

# Windows
# Close all service windows
# Delete logs folder
# Run start-services.bat again
```

## 🔍 Health Checks

### Manual Health Checks:
```bash
# FastAPI Matching Engine
curl http://localhost:3000/health

# Node.js API Server  
curl http://localhost:3001/api/health

# Frontend Server
curl http://localhost:8080
```

### Expected Responses:
- **Matching Engine**: `{"status":"healthy","components":{...}}`
- **API Server**: `{"status":"healthy","timestamp":"..."}`
- **Frontend**: HTML page content

## 🎯 Production Notes

For production deployment:
- Replace Python HTTP server with nginx/Apache
- Use process managers (PM2, systemd)
- Configure proper logging rotation
- Set up reverse proxy for SSL/TLS
- Use environment-specific configuration files

## 📞 Support

If you encounter issues:
1. Check the service logs in `logs/` directory
2. Run `./monitor-services.sh` to diagnose issues
3. Verify all prerequisites are installed
4. Ensure no firewall is blocking the ports

---

**IDXR Identity Cross-Resolution System**  
*Colorado Office of Information Technology*