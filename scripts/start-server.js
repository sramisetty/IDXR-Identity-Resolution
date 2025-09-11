#!/usr/bin/env node

const { exec, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const PID_FILE = path.join(__dirname, '..', 'server.pid');
const LOG_FILE = path.join(__dirname, '..', 'logs', 'startup.log');
// Load environment variables
require('dotenv').config();
const PORT = process.env.PORT || 3000;

// Create logs directory if it doesn't exist
const logDir = path.dirname(LOG_FILE);
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
}

function log(message) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}\n`;
    console.log(logMessage.trim());
    fs.appendFileSync(LOG_FILE, logMessage, { encoding: 'utf8' });
}

function isProcessRunning(pid) {
    try {
        if (os.platform() === 'win32') {
            execSync(`tasklist /FI "PID eq ${pid}" | findstr ${pid}`, { stdio: 'ignore' });
        } else {
            process.kill(pid, 0);
        }
        return true;
    } catch (error) {
        return false;
    }
}

function isPortInUse(port) {
    try {
        if (os.platform() === 'win32') {
            const output = execSync(`netstat -ano | findstr :${port}`, { encoding: 'utf8' });
            return output.includes('LISTENING');
        } else {
            execSync(`lsof -i :${port}`, { stdio: 'ignore' });
        }
        return true;
    } catch (error) {
        return false;
    }
}

function killExistingServer() {
    if (fs.existsSync(PID_FILE)) {
        try {
            const pid = parseInt(fs.readFileSync(PID_FILE, 'utf8').trim());
            if (isProcessRunning(pid)) {
                log(`Killing existing server process (PID: ${pid})`);
                if (os.platform() === 'win32') {
                    execSync(`taskkill /F /PID ${pid}`);
                } else {
                    process.kill(pid, 'SIGTERM');
                }
                // Wait for graceful shutdown
                setTimeout(() => {
                    if (isProcessRunning(pid)) {
                        log(`Force killing stubborn process (PID: ${pid})`);
                        if (os.platform() === 'win32') {
                            execSync(`taskkill /F /PID ${pid}`);
                        } else {
                            process.kill(pid, 'SIGKILL');
                        }
                    }
                }, 5000);
            }
        } catch (error) {
            log(`Error killing existing server: ${error.message}`);
        }
        fs.unlinkSync(PID_FILE);
    }
}

function checkPortAvailability() {
    if (isPortInUse(PORT)) {
        log(`Port ${PORT} is in use. Attempting to free it...`);
        
        try {
            if (os.platform() === 'win32') {
                const output = execSync(`netstat -ano | findstr :${PORT}`, { encoding: 'utf8' });
                const lines = output.split('\n').filter(line => line.includes('LISTENING'));
                
                for (const line of lines) {
                    const parts = line.trim().split(/\s+/);
                    const pid = parts[parts.length - 1];
                    if (pid && !isNaN(parseInt(pid))) {
                        log(`Killing process using port ${PORT} (PID: ${pid})`);
                        execSync(`taskkill /F /PID ${pid}`);
                    }
                }
            } else {
                const pid = execSync(`lsof -t -i:${PORT}`, { encoding: 'utf8' }).trim();
                if (pid) {
                    log(`Killing process using port ${PORT} (PID: ${pid})`);
                    execSync(`kill -9 ${pid}`);
                }
            }
        } catch (error) {
            log(`Failed to free port ${PORT}: ${error.message}`);
            process.exit(1);
        }
    }
}

function startServer() {
    log('Starting IDXR Identity Resolution Server...');
    
    // Check system requirements
    log('Checking system requirements...');
    
    // Kill any existing server instance
    killExistingServer();
    
    // Check port availability
    checkPortAvailability();
    
    // Start the server
    const serverPath = path.join(__dirname, '..', 'backend', 'server.js');
    
    log(`Starting server from: ${serverPath}`);
    
    const child = exec(`node "${serverPath}"`, { 
        cwd: path.join(__dirname, '..'),
        env: { ...process.env }
    });
    
    // Write PID file
    fs.writeFileSync(PID_FILE, child.pid.toString(), 'utf8');
    log(`Server started with PID: ${child.pid}`);
    
    // Handle server output
    child.stdout.on('data', (data) => {
        process.stdout.write(data);
    });
    
    child.stderr.on('data', (data) => {
        process.stderr.write(data);
    });
    
    child.on('close', (code) => {
        log(`Server process exited with code: ${code}`);
        if (fs.existsSync(PID_FILE)) {
            fs.unlinkSync(PID_FILE);
        }
        process.exit(code);
    });
    
    child.on('error', (error) => {
        log(`Server startup error: ${error.message}`);
        if (fs.existsSync(PID_FILE)) {
            fs.unlinkSync(PID_FILE);
        }
        process.exit(1);
    });
    
    // Handle process termination
    process.on('SIGTERM', () => {
        log('Received SIGTERM, shutting down gracefully...');
        child.kill('SIGTERM');
    });
    
    process.on('SIGINT', () => {
        log('Received SIGINT, shutting down gracefully...');
        child.kill('SIGINT');
    });
}

// Ensure single instance
if (process.argv.includes('--force-start')) {
    log('Force start requested, killing any existing instances...');
    killExistingServer();
}

// Start the server
startServer();