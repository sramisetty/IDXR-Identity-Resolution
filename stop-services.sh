#!/bin/bash
# IDXR Identity Cross-Resolution System - Service Stop Script
# Cross-platform stop script (Linux/macOS/WSL)

echo "================================================================"
echo "IDXR Identity Cross-Resolution System - Stopping Services"
echo "================================================================"
echo

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[OK]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to stop service by PID file
stop_service() {
    local service_name=$1
    local pid_file=$2
    
    if [[ -f "$pid_file" ]]; then
        local pid=$(cat "$pid_file")
        if kill -0 "$pid" 2>/dev/null; then
            print_info "Stopping $service_name (PID: $pid)..."
            kill "$pid"
            sleep 2
            if kill -0 "$pid" 2>/dev/null; then
                print_info "Force stopping $service_name..."
                kill -9 "$pid"
            fi
            print_success "$service_name stopped"
        else
            print_info "$service_name was not running"
        fi
        rm -f "$pid_file"
    else
        print_info "No PID file found for $service_name"
    fi
}

# Stop services using PID files
if [[ -d "logs" ]]; then
    stop_service "Matching Engine" "logs/matching-engine.pid"
    stop_service "API Server" "logs/api-server.pid"
    stop_service "Frontend Server" "logs/frontend.pid"
else
    print_info "No logs directory found, attempting to find processes by name..."
    
    # Fallback: kill by process name/port
    pkill -f "python.*main.py" 2>/dev/null && print_success "Stopped matching engine processes"
    pkill -f "node.*server.js" 2>/dev/null && print_success "Stopped API server processes"
    pkill -f "python.*http.server.*8080" 2>/dev/null && print_success "Stopped frontend server processes"
fi

# Additional cleanup - kill by port if processes are still running
for port in 3000 3001 8080; do
    if command -v lsof &> /dev/null; then
        local pid=$(lsof -ti:$port 2>/dev/null)
        if [[ -n "$pid" ]]; then
            print_info "Killing process on port $port (PID: $pid)..."
            kill -9 "$pid" 2>/dev/null
        fi
    fi
done

echo
print_success "All IDXR services have been stopped"
echo "Logs are preserved in the 'logs' directory"
echo