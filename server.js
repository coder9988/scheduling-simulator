// server.js:


const express = require("express");
const app = express();
const cors = require("cors");
const path = require("path");

app.use(express.json());
app.use(cors());
app.use(express.static("."));

// Serve input.html as the main page
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "input.html"));
});

// API endpoint for scheduling
app.post("/schedule", (req, res) => {
    const { algorithm, processes, timeQuantum } = req.body;
    let result;

    switch(algorithm) {
        case "FCFS":
            result = fcfs(processes);
            break;
        case "SJF":
            result = sjf(processes);
            break;
        case "SRTF":
            result = srtf(processes);
            break;
        case "Priority":
            result = priorityScheduling(processes);
            break;
        case "RoundRobin":
            result = roundRobin(processes, timeQuantum);
            break;
        default:
            return res.status(400).json({ error: "Invalid algorithm" });
    }

    res.json(result);
}); // Changed from "public" to "." to serve from current directory

// Scheduling Algorithms
function fcfs(processes) {
    let currentTime = 0;
    let schedule = [];
    let processStats = {};
    
    // Sort processes by arrival time
    processes.sort((a, b) => a.arrivalTime - b.arrivalTime);

    // Initialize process stats
    processes.forEach(p => {
        processStats[p.pid] = {
            pid: p.pid,
            arrivalTime: p.arrivalTime,
            burstTime: p.burstTime,
            remainingTime: p.burstTime,
            waitingTime: 0,
            turnaroundTime: 0,
            completionTime: 0,
            responseTime: -1
        };
    });

    // Process each process in order of arrival
    for (const process of processes) {
        // Wait until process arrives
        if (currentTime < process.arrivalTime) {
            currentTime = process.arrivalTime;
        }

        // Track response time for first execution
        if (processStats[process.pid].responseTime === -1) {
            processStats[process.pid].responseTime = currentTime - processStats[process.pid].arrivalTime;
        }

        // Execute the process
        const startTime = currentTime;
        const endTime = startTime + process.burstTime;
        
        // Update waiting time for other processes
        const otherProcesses = processes.filter(p => p.pid !== process.pid && p.arrivalTime <= startTime);
        otherProcesses.forEach(p => {
            // Only update waiting time if process is still waiting
            if (processStats[p.pid].remainingTime > 0) {
                processStats[p.pid].waitingTime += process.burstTime;
            }
        });

        // Update process stats
        processStats[process.pid].completionTime = endTime;
        processStats[process.pid].turnaroundTime = endTime - processStats[process.pid].arrivalTime;
        processStats[process.pid].remainingTime = 0;

        // Add to schedule
        schedule.push({
            pid: process.pid,
            executionTime: process.burstTime,
            startTime: startTime,
            endTime: endTime
        });

        // Move time forward
        currentTime = endTime;
    }

    // Calculate average metrics
    const avgMetrics = {
        avgWaitingTime: processes.reduce((sum, p) => sum + processStats[p.pid].waitingTime, 0) / processes.length,
        avgTurnaroundTime: processes.reduce((sum, p) => sum + processStats[p.pid].turnaroundTime, 0) / processes.length,
        avgResponseTime: processes.reduce((sum, p) => sum + processStats[p.pid].responseTime, 0) / processes.length
    };

    return {
        ganttChart: schedule,
        processStats: Object.values(processStats),
        avgMetrics
    };
}

function sjf(processes) {
    let currentTime = 0;
    let schedule = [];
    let processStats = {};
    let remainingProcesses = [...processes];
    
    remainingProcesses.sort((a, b) => a.arrivalTime - b.arrivalTime);

    while (remainingProcesses.length > 0) {
        let availableProcesses = remainingProcesses.filter(p => p.arrivalTime <= currentTime);
        if (availableProcesses.length === 0) {
            currentTime = remainingProcesses[0].arrivalTime;
            continue;
        }

        availableProcesses.sort((a, b) => a.burstTime - b.burstTime);
        let process = availableProcesses.shift();

        process.startTime = currentTime;
        process.endTime = currentTime + process.burstTime;
        process.completionTime = process.endTime;
        process.waitingTime = process.startTime - process.arrivalTime;
        process.turnaroundTime = process.completionTime - process.arrivalTime;
        process.responseTime = process.startTime - process.arrivalTime;

        schedule.push({ ...process });
        currentTime += process.burstTime;

        // Store process stats
        processStats[process.pid] = {
            pid: process.pid,
            arrivalTime: process.arrivalTime,
            burstTime: process.burstTime,
            waitingTime: process.waitingTime,
            turnaroundTime: process.turnaroundTime,
            completionTime: process.completionTime,
            responseTime: process.responseTime
        };

        remainingProcesses = remainingProcesses.filter(p => p.pid !== process.pid);
    }

    // Calculate average metrics
    const avgMetrics = {
        avgWaitingTime: processes.reduce((sum, p) => sum + processStats[p.pid].waitingTime, 0) / processes.length,
        avgTurnaroundTime: processes.reduce((sum, p) => sum + processStats[p.pid].turnaroundTime, 0) / processes.length,
        avgResponseTime: processes.reduce((sum, p) => sum + processStats[p.pid].responseTime, 0) / processes.length
    };

    return {
        ganttChart: schedule,
        processStats: Object.values(processStats),
        avgMetrics
    };
}

function roundRobin(processes, quantum) {
    let time = 0;
    let schedule = [];
    let readyQueue = [];
    let completed = new Set();
    let processStats = {};

    // Sort by arrival time
    processes.sort((a, b) => a.arrivalTime - b.arrivalTime);

    // Initialize process stats
    processes.forEach(p => {
        processStats[p.pid] = {
            pid: p.pid,
            arrivalTime: p.arrivalTime,
            burstTime: p.burstTime,
            remainingTime: p.burstTime,
            waitingTime: 0,
            turnaroundTime: 0,
            completionTime: 0,
            responseTime: -1
        };
    });

    while (completed.size < processes.length) {
        // Add newly arrived processes to ready queue
        processes.forEach(p => {
            if (p.arrivalTime <= time && !completed.has(p.pid)) {
                readyQueue.push({ ...p });
            }
        });

        if (readyQueue.length === 0) {
            time++;
            continue;
        }

        // Get next process from ready queue
        let currentProcess = readyQueue.shift();
        let pid = currentProcess.pid;
        
        // Track response time for first execution
        if (processStats[pid].responseTime === -1) {
            processStats[pid].responseTime = time - processStats[pid].arrivalTime;
        }

        // Calculate execution time
        let executeTime = Math.min(processStats[pid].remainingTime, quantum);
        let startTime = time;
        let endTime = startTime + executeTime;

        // Update waiting time for other processes in ready queue
        readyQueue.forEach(p => {
            if (p.pid !== pid) {
                processStats[p.pid].waitingTime += executeTime;
            }
        });

        // Add to schedule with proper time tracking
        schedule.push({
            pid: pid,
            executionTime: executeTime,
            startTime: startTime,
            endTime: endTime
        });

        // Update process stats
        processStats[pid].remainingTime -= executeTime;
        time = endTime;

        // If process is not complete, add it back to ready queue
        if (processStats[pid].remainingTime > 0) {
            readyQueue.push(currentProcess);
        } else {
            // Process completed
            processStats[pid].completionTime = time;
            processStats[pid].turnaroundTime = time - processStats[pid].arrivalTime;
            completed.add(pid);
        }
    }

    // Calculate average metrics
    const avgMetrics = {
        avgWaitingTime: processes.reduce((sum, p) => sum + processStats[p.pid].waitingTime, 0) / processes.length,
        avgTurnaroundTime: processes.reduce((sum, p) => sum + processStats[p.pid].turnaroundTime, 0) / processes.length,
        avgResponseTime: processes.reduce((sum, p) => sum + processStats[p.pid].responseTime, 0) / processes.length
    };

    // Sort schedule by start time for better visualization
    schedule.sort((a, b) => a.startTime - b.startTime);

    return {
        ganttChart: schedule,
        processStats: Object.values(processStats),
        avgMetrics
    };
}

function srtf(processes) {
    let currentTime = 0;
    let schedule = [];
    let processStats = {};
    let remainingProcesses = processes.map(p => ({
        ...p,
        remainingTime: p.burstTime,
        startTime: null,
        endTime: null
    }));

    // Initialize process stats
    processes.forEach(p => {
        processStats[p.pid] = {
            pid: p.pid,
            arrivalTime: p.arrivalTime,
            burstTime: p.burstTime,
            waitingTime: 0,
            turnaroundTime: 0,
            completionTime: 0,
            responseTime: -1
        };
    });

    while (remainingProcesses.length > 0) {
        let availableProcesses = remainingProcesses.filter(p => p.arrivalTime <= currentTime);

        if (availableProcesses.length === 0) {
            currentTime = Math.min(...remainingProcesses.map(p => p.arrivalTime));
            continue;
        }

        // Sort by remaining time
        availableProcesses.sort((a, b) => a.remainingTime - b.remainingTime);
        let process = availableProcesses[0];

        // Track response time for first execution
        if (processStats[process.pid].responseTime === -1) {
            processStats[process.pid].responseTime = currentTime - process.arrivalTime;
        }

        // Execute for 1 time unit
        if (process.startTime === null) {
            process.startTime = currentTime;
        }

        process.remainingTime--;
        currentTime++;

        if (process.remainingTime === 0) {
            process.endTime = currentTime;
            processStats[process.pid].completionTime = process.endTime;
            processStats[process.pid].turnaroundTime = process.endTime - process.arrivalTime;
            processStats[process.pid].waitingTime = processStats[process.pid].turnaroundTime - process.burstTime;

            schedule.push({
                pid: process.pid,
                startTime: process.startTime,
                endTime: process.endTime,
                executionTime: process.endTime - process.startTime
            });

            remainingProcesses = remainingProcesses.filter(p => p.pid !== process.pid);
        }
    }

    // Calculate average metrics
    const avgMetrics = {
        avgWaitingTime: processes.reduce((sum, p) => sum + processStats[p.pid].waitingTime, 0) / processes.length,
        avgTurnaroundTime: processes.reduce((sum, p) => sum + processStats[p.pid].turnaroundTime, 0) / processes.length,
        avgResponseTime: processes.reduce((sum, p) => sum + processStats[p.pid].responseTime, 0) / processes.length
    };

    return {
        ganttChart: schedule,
        processStats: Object.values(processStats),
        avgMetrics
    };
}

function priorityScheduling(processes) {
    let currentTime = 0;
    let schedule = [];
    let processStats = {};
    let remainingProcesses = [...processes];

    // Sort by arrival time first
    remainingProcesses.sort((a, b) => a.arrivalTime - b.arrivalTime);

    while (remainingProcesses.length > 0) {
        let availableProcesses = remainingProcesses.filter(p => p.arrivalTime <= currentTime);

        if (availableProcesses.length === 0) {
            currentTime = remainingProcesses[0].arrivalTime;
            continue;
        }

        // Sort by priority (lower value = higher priority)
        availableProcesses.sort((a, b) => a.priority - b.priority);
        let process = availableProcesses[0];

        process.startTime = currentTime;
        process.endTime = currentTime + process.burstTime;
        process.completionTime = process.endTime;
        process.waitingTime = process.startTime - process.arrivalTime;
        process.turnaroundTime = process.completionTime - process.arrivalTime;
        process.responseTime = process.startTime - process.arrivalTime;

        schedule.push({ ...process });
        currentTime += process.burstTime;

        // Store process stats
        processStats[process.pid] = {
            pid: process.pid,
            arrivalTime: process.arrivalTime,
            burstTime: process.burstTime,
            waitingTime: process.waitingTime,
            turnaroundTime: process.turnaroundTime,
            completionTime: process.completionTime,
            responseTime: process.responseTime
        };

        // Remove the executed process
        remainingProcesses = remainingProcesses.filter(p => p.pid !== process.pid);
    }

    // Calculate average metrics
    const avgMetrics = {
        avgWaitingTime: processes.reduce((sum, p) => sum + processStats[p.pid].waitingTime, 0) / processes.length,
        avgTurnaroundTime: processes.reduce((sum, p) => sum + processStats[p.pid].turnaroundTime, 0) / processes.length,
        avgResponseTime: processes.reduce((sum, p) => sum + processStats[p.pid].responseTime, 0) / processes.length
    };

    return {
        ganttChart: schedule,
        processStats: Object.values(processStats),
        avgMetrics
    };
}

// Simulation Route
app.post("/simulate", (req, res) => {
    console.log("Incoming request body:", JSON.stringify(req.body, null, 2));
    console.log("Headers:", req.headers);
    
    const { algorithm, processes, timeQuantum } = req.body;
    console.log("Parsed parameters:", {algorithm, timeQuantum, processCount: processes?.length});

    if (!Array.isArray(processes) || processes.length === 0) {
        console.error("Invalid process data received");
        return res.status(400).json({ error: "Invalid process data" });
    }

    let result = {};
    
    try {
        switch(algorithm) {
            case "FCFS":
                result = fcfs(processes);
                break;
            case "SJF":
                result = sjf(processes);
                break;
            case "SRTF":
                result = srtf(processes);
                break;
            case "Priority":
                result = priorityScheduling(processes);
                break;
            case "RoundRobin":
            case "RR":
                result = roundRobin(processes, timeQuantum);
                break;
            default:
                return res.status(400).json({ error: "Unknown algorithm" });
        }

        console.log("Sending response:", result);
        res.json(result);
        
    } catch (error) {
        console.error("Error in simulation:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});
// Start Server
const PORT = 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log('Press Ctrl+C to stop the server');
}).on('error', (err) => {
    console.error('Server failed to start:', err);
    if (err.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use. Please try a different port.`);
    }
});
