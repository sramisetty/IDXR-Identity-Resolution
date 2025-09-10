#!/bin/bash
# IDXR Identity Cross-Resolution System - Service Startup Script
# Cross-platform startup script (Linux/macOS/WSL)

set -e

echo "================================================================"
echo "IDXR Identity Cross-Resolution System - Service Startup"
echo "================================================================"
echo

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[OK]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check dependencies
print_info "Checking dependencies..."

# Check Python
if ! command -v python3 &> /dev/null && ! command -v python &> /dev/null; then
    print_error "Python is not installed or not in PATH"
    exit 1
fi

# Use python3 if available, otherwise python
if command -v python3 &> /dev/null; then
    PYTHON_CMD="python3"
else
    PYTHON_CMD="python"
fi

# Check Node.js
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed or not in PATH"
    exit 1
fi

# Check if we're in the correct directory
if [[ ! -f "backend/matching-engine/main.py" ]]; then
    print_error "Please run this script from the IDXR root directory"
    echo "Current directory: $(pwd)"
    exit 1
fi

print_success "Dependencies check passed"
echo

# Install Python dependencies if requirements.txt exists
if [[ -f "requirements.txt" ]]; then
    print_info "Installing Python dependencies..."
    $PYTHON_CMD -m pip install -r requirements.txt
    echo
fi

# Install Node.js dependencies
print_info "Installing Node.js dependencies..."
npm install
echo

# Create logs directory
mkdir -p logs

# Function to check if port is in use
check_port() {
    local port=$1
    if command -v lsof &> /dev/null; then
        lsof -i:$port &> /dev/null
    elif command -v netstat &> /dev/null; then
        netstat -ln | grep :$port &> /dev/null
    else
        return 1
    fi
}

# Check if ports are available
for port in 3000 3001 8080; do
    if check_port $port; then
        print_warning "Port $port is already in use. You may need to stop existing services."
    fi
done

print_info "Starting IDXR services..."
echo

# Start FastAPI Matching Engine (Port 3000)
print_info "[1/3] Starting FastAPI Matching Engine on port 3000..."
cd backend/matching-engine
nohup $PYTHON_CMD main.py > ../../logs/matching-engine.log 2>&1 &
MATCHING_ENGINE_PID=$!
cd ../..
echo $MATCHING_ENGINE_PID > logs/matching-engine.pid

# Wait a moment for the service to start
sleep 3

# Start Node.js API Server (Port 3001)
print_info "[2/3] Starting Node.js API Server on port 3001..."
PORT=3001 nohup node backend/server.js > logs/api-server.log 2>&1 &
API_SERVER_PID=$!
echo $API_SERVER_PID > logs/api-server.pid

# Wait a moment for the service to start
sleep 2

# Start Frontend HTTP Server (Port 8080)
print_info "[3/3] Starting Frontend Server on port 8080..."
cd frontend
nohup $PYTHON_CMD -m http.server 8080 > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..
echo $FRONTEND_PID > logs/frontend.pid

# Wait for services to fully start
sleep 3

echo
echo "================================================================"
echo "IDXR Services Started Successfully!"
echo "================================================================"
echo
echo "Service URLs:"
echo "  Frontend Interface:     http://localhost:8080"
echo "  FastAPI Docs:          http://localhost:3000/docs"
echo "  API Health Check:      http://localhost:3001/api/health"
echo "  Matching Engine Health: http://localhost:3000/health"
echo
echo "Process IDs:"
echo "  Matching Engine: $MATCHING_ENGINE_PID"
echo "  API Server:      $API_SERVER_PID"
echo "  Frontend:        $FRONTEND_PID"
echo
echo "Logs are available in the 'logs' directory"
echo
echo "To stop all services, run: ./stop-services.sh"
echo "Or kill individual processes using the PIDs above"
echo

# Test if services are responding
print_info "Testing service health..."

# Test FastAPI
if curl -s http://localhost:3000/health > /dev/null 2>&1; then
    print_success "FastAPI Matching Engine is responding"
else
    print_warning "FastAPI Matching Engine may not be ready yet"
fi

# Test Node.js API
if curl -s http://localhost:3001/api/health > /dev/null 2>&1; then
    print_success "Node.js API Server is responding"
else
    print_warning "Node.js API Server may not be ready yet"
fi

# Test Frontend
if curl -s http://localhost:8080 > /dev/null 2>&1; then
    print_success "Frontend Server is responding"
else
    print_warning "Frontend Server may not be ready yet"
fi

echo
print_info "All services are now running!"
print_info "Open http://localhost:8080 in your browser to access the application"

# Try to open browser (if available)
if command -v xdg-open &> /dev/null; then
    print_info "Opening browser..."
    xdg-open http://localhost:8080 &
elif command -v open &> /dev/null; then
    print_info "Opening browser..."
    open http://localhost:8080 &
fi

echo