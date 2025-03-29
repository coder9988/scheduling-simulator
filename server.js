// server.js:


const express = require("express");
const app = express();
const cors = require("cors");

app.use(express.json());
app.use(cors());
app.use(express.static("public"));  // Serves static files like HTML, CSS, JS

// Scheduling Algorithms
function fcfs(processes) {
    let currentTime = 0;
    let schedule = [];
    
    processes.sort((a, b) => a.arrivalTime - b.arrivalTime);

    processes.forEach(process => {
        if (currentTime < process.arrivalTime) {
            currentTime = process.arrivalTime;
        }
        process.startTime = currentTime;
        process.endTime = currentTime + process.burstTime;
        process.completionTime = process.endTime;
        process.waitingTime = process.startTime - process.arrivalTime;
        process.turnaroundTime = process.completionTime - process.arrivalTime;

        schedule.push({ ...process });
        currentTime += process.burstTime;
    });

    return schedule;
}


function sjf(processes) {
    let currentTime = 0;
    let schedule = [];
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

        schedule.push({ ...process });
        currentTime += process.burstTime;

        remainingProcesses = remainingProcesses.filter(p => p.pid !== process.pid);
    }

    return schedule;
}

function roundRobin(processes, quantum) {
    let queue = [...processes]; // Initialize queue
    let time = 0;
    let schedule = [];

    processes.forEach(p => {
        p.remainingTime = p.burstTime;
        p.startTime = null;
    });

    while (queue.length > 0) {
        let process = queue.shift(); // Get the first process

        if (process.remainingTime > 0) {
            if (process.startTime === null) {
                process.startTime = time; // First execution start time
            }

            let executeTime = Math.min(process.remainingTime, quantum);
            process.remainingTime -= executeTime;
            let endTime = time + executeTime;

            schedule.push({ 
                pid: process.pid, 
                executionTime: executeTime, 
                startTime: time, 
                endTime: endTime 
            });

            time += executeTime;

            if (process.remainingTime > 0) {
                queue.push(process); // Requeue if not finished
            } else {
                process.completionTime = time;
                process.turnaroundTime = process.completionTime - process.arrivalTime;
                process.waitingTime = process.turnaroundTime - process.burstTime;
            }
        }
    }

    return schedule;
}

// Simulation Route
app.post("/simulate", (req, res) => {
    const { algorithm, processes, quantum } = req.body;

    if (!Array.isArray(processes) || processes.length === 0) {
        return res.status(400).json({ error: "Invalid process data" });
    }

    let schedule = [];
    if (algorithm === "FCFS") {
        schedule = fcfs(processes);
    } else if (algorithm === "SJF") {
        schedule = sjf(processes);
    } else if (algorithm === "RoundRobin") {
        schedule = roundRobin(processes, quantum);
    } else {
        return res.status(400).json({ error: "Unknown algorithm" });
    }

    console.log("Generated Schedule:", schedule); // Debugging

    let avgWaitingTime = schedule.reduce((sum, p) => sum + (p.waitingTime || 0), 0) / schedule.length;
    let avgTurnaroundTime = schedule.reduce((sum, p) => sum + (p.turnaroundTime || 0), 0) / schedule.length;
    let totalExecutionTime = Math.max(...schedule.map(p => p.endTime || 0));

    res.json({
        schedule,
        avgWaitingTime,
        avgTurnaroundTime,
        totalExecutionTime
    });
});

// Start Server
app.listen(3000, () => console.log("Server running on http://localhost:3000"));
