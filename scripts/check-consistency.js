#!/usr/bin/env node

const { execSync } = require('child_process');
const os = require('os');

function checkPortConflicts() {
    console.log('🔍 Checking for port conflicts...');
    
    const ports = [3000, 6379, 8001, 8080];
    const conflicts = [];
    
    for (const port of ports) {
        try {
            let output;
            if (os.platform() === 'win32') {
                output = execSync(`netstat -ano | findstr :${port}`, { encoding: 'utf8' });
            } else {
                output = execSync(`lsof -i :${port}`, { encoding: 'utf8' });
            }
            
            const lines = output.split('\n').filter(line => line.includes('LISTENING'));
            if (lines.length > 1) {
                conflicts.push({ port, processes: lines.length });
            }
        } catch (error) {
            // Port not in use - this is good
        }
    }
    
    if (conflicts.length > 0) {
        console.log('⚠️  Port conflicts detected:');
        conflicts.forEach(conflict => {
            console.log(`   Port ${conflict.port}: ${conflict.processes} processes`);
        });
        return false;
    } else {
        console.log('✅ No port conflicts detected');
        return true;
    }
}

function checkRedisConnection() {
    console.log('🔍 Checking Redis connection...');
    
    try {
        if (os.platform() === 'win32') {
            const output = execSync('netstat -ano | findstr :6379', { encoding: 'utf8' });
            if (output.includes('LISTENING')) {
                console.log('✅ Redis appears to be running');
                return true;
            }
        } else {
            execSync('redis-cli ping', { encoding: 'utf8' });
            console.log('✅ Redis is responding');
            return true;
        }
    } catch (error) {
        console.log('⚠️  Redis not detected - system will use in-memory storage');
        return false;
    }
    
    return false;
}

function checkNodeProcesses() {
    console.log('🔍 Checking Node.js processes...');
    
    try {
        let output;
        if (os.platform() === 'win32') {
            output = execSync('tasklist | findstr node.exe', { encoding: 'utf8' });
        } else {
            output = execSync('pgrep -f node', { encoding: 'utf8' });
        }
        
        const processes = output.split('\n').filter(line => line.trim().length > 0);
        
        if (processes.length === 0) {
            console.log('✅ No Node.js processes running');
        } else if (processes.length === 1) {
            console.log('✅ Single Node.js process detected');
        } else {
            console.log(`⚠️  Multiple Node.js processes detected: ${processes.length}`);
            processes.forEach((proc, index) => {
                console.log(`   ${index + 1}: ${proc.trim()}`);
            });
        }
        
        return processes.length <= 1;
    } catch (error) {
        console.log('✅ No Node.js processes detected');
        return true;
    }
}

function checkSystemHealth() {
    console.log('🏥 IDXR System Health Check');
    console.log('=' .repeat(50));
    
    const results = {
        portConflicts: checkPortConflicts(),
        redisConnection: checkRedisConnection(),
        nodeProcesses: checkNodeProcesses()
    };
    
    console.log('\n📊 Summary:');
    console.log(`   Port Conflicts: ${results.portConflicts ? '✅ None' : '❌ Detected'}`);
    console.log(`   Redis Status: ${results.redisConnection ? '✅ Available' : '⚠️  Unavailable'}`);
    console.log(`   Node Processes: ${results.nodeProcesses ? '✅ Clean' : '⚠️  Multiple'}`);
    
    const overallHealth = results.portConflicts && results.nodeProcesses;
    console.log(`\n🎯 Overall Status: ${overallHealth ? '✅ HEALTHY' : '⚠️  ATTENTION NEEDED'}`);
    
    if (!overallHealth) {
        console.log('\n💡 Recommendations:');
        if (!results.portConflicts) {
            console.log('   • Kill conflicting processes or use different ports');
        }
        if (!results.nodeProcesses) {
            console.log('   • Stop duplicate Node.js processes to avoid conflicts');
        }
        console.log('   • Run `npm run start-force` to clean start the server');
    }
    
    return overallHealth;
}

// Run the health check
if (require.main === module) {
    const healthy = checkSystemHealth();
    process.exit(healthy ? 0 : 1);
}

module.exports = { checkSystemHealth };