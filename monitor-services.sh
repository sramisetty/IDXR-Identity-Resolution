#!/bin/bash
# IDXR Identity Cross-Resolution System - Service Monitor
# Monitors the health of all IDXR services

echo "================================================================"
echo "IDXR Identity Cross-Resolution System - Service Monitor"
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
    echo -e "${GREEN}[✓]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[⚠]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

# Function to check if a service is running
check_service() {
    local name=$1
    local url=$2
    local expected_status=${3:-"200"}
    
    if curl -s --max-time 5 "$url" > /dev/null 2>&1; then
        local status_code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "$url")
        if [[ "$status_code" == "$expected_status" ]]; then
            print_success "$name is running (HTTP $status_code)"
            return 0
        else
            print_warning "$name responded with HTTP $status_code"
            return 1
        fi
    else
        print_error "$name is not responding"
        return 1
    fi
}

# Function to check process by PID file
check_process() {
    local name=$1
    local pid_file=$2
    
    if [[ -f "$pid_file" ]]; then
        local pid=$(cat "$pid_file")
        if kill -0 "$pid" 2>/dev/null; then
            print_success "$name process is running (PID: $pid)"
            return 0
        else
            print_error "$name process is not running (stale PID file)"
            return 1
        fi
    else
        print_warning "$name PID file not found"
        return 1
    fi
}

# Function to get service uptime from logs
get_uptime() {
    local log_file=$1
    if [[ -f "$log_file" ]]; then
        local start_time=$(head -n 1 "$log_file" | grep -oE '[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}' | head -n 1)
        if [[ -n "$start_time" ]]; then
            echo " (Started: $start_time)"
        fi
    fi
}

echo "Checking IDXR Services..."
echo

# Check services
services_healthy=0
total_services=3

print_info "1. FastAPI Matching Engine (Port 3000)"
if check_service "Matching Engine" "http://localhost:3000/health"; then
    ((services_healthy++))
    echo "   Health details: $(curl -s http://localhost:3000/health | python3 -m json.tool 2>/dev/null || echo 'Could not parse health response')"
fi
if [[ -d "logs" ]]; then
    check_process "Matching Engine" "logs/matching-engine.pid"
    echo "   Uptime$(get_uptime "logs/matching-engine.log")"
fi
echo

print_info "2. Node.js API Server (Port 3001)"
if check_service "API Server" "http://localhost:3001/api/health"; then
    ((services_healthy++))
    echo "   Health details: $(curl -s http://localhost:3001/api/health | python3 -m json.tool 2>/dev/null || echo 'Could not parse health response')"
fi
if [[ -d "logs" ]]; then
    check_process "API Server" "logs/api-server.pid"
    echo "   Uptime$(get_uptime "logs/api-server.log")"
fi
echo

print_info "3. Frontend Server (Port 8080)"
if check_service "Frontend Server" "http://localhost:8080"; then
    ((services_healthy++))
fi
if [[ -d "logs" ]]; then
    check_process "Frontend Server" "logs/frontend.pid"
    echo "   Uptime$(get_uptime "logs/frontend.log")"
fi
echo

# Overall status
echo "================================================================"
echo "Overall System Status: $services_healthy/$total_services services healthy"

if [[ $services_healthy -eq $total_services ]]; then
    print_success "All services are running normally"
    echo
    echo "Service URLs:"
    echo "  • Frontend:      http://localhost:8080"
    echo "  • API Docs:      http://localhost:3000/docs"
    echo "  • Health Checks: http://localhost:3001/api/health"
    echo
elif [[ $services_healthy -gt 0 ]]; then
    print_warning "Some services are not running properly"
    echo "Run './start-services.sh' to restart all services"
else
    print_error "No services are running"
    echo "Run './start-services.sh' to start all services"
fi

# Log file sizes (if logs exist)
if [[ -d "logs" ]]; then
    echo
    print_info "Log file sizes:"
    for log_file in logs/*.log; do
        if [[ -f "$log_file" ]]; then
            local size=$(du -h "$log_file" 2>/dev/null | cut -f1)
            echo "  • $(basename "$log_file"): $size"
        fi
    done
fi

# Port usage
echo
print_info "Port usage:"
for port in 3000 3001 8080; do
    if command -v lsof &> /dev/null; then
        local process=$(lsof -ti:$port 2>/dev/null)
        if [[ -n "$process" ]]; then
            local name=$(ps -p "$process" -o comm= 2>/dev/null || echo "unknown")
            echo "  • Port $port: Used by $name (PID: $process)"
        else
            echo "  • Port $port: Available"
        fi
    else
        echo "  • Port $port: Cannot check (lsof not available)"
    fi
done

echo
echo "================================================================"