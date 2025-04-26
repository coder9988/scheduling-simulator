document.addEventListener("DOMContentLoaded", function () {
    const storedData = localStorage.getItem("scheduleData");
    console.log("Raw data from localStorage:", storedData);
    
    let scheduleData;
    
    // Initialize default data if none exists or if it's invalid
    if (!storedData) {
        console.log("No data found, initializing default data");
        scheduleData = {
            processes: [
                { pid: "P1", arrivalTime: 0, burstTime: 5, priority: 1 },
                { pid: "P2", arrivalTime: 1, burstTime: 3, priority: 2 }
            ]
        };
        localStorage.setItem("scheduleData", JSON.stringify(scheduleData));
    } else {
        try {
            scheduleData = JSON.parse(storedData);
            console.log("Parsed schedule data:", scheduleData);
            
            // If data is invalid, initialize with default data
            if (!scheduleData || !scheduleData.processes || !Array.isArray(scheduleData.processes)) {
                console.log("Invalid data format, initializing default data");
                scheduleData = {
                    processes: [
                        { pid: "P1", arrivalTime: 0, burstTime: 5, priority: 1 },
                        { pid: "P2", arrivalTime: 1, burstTime: 3, priority: 2 }
                    ]
                };
                localStorage.setItem("scheduleData", JSON.stringify(scheduleData));
            }
            
            // Validate each process
            scheduleData.processes.forEach((process, index) => {
                if (!process.pid) throw new Error(`Process at index ${index} missing pid`);
                if (typeof process.arrivalTime !== 'number') throw new Error(`Process ${process.pid} has invalid arrivalTime`);
                if (typeof process.burstTime !== 'number') throw new Error(`Process ${process.pid} has invalid burstTime`);
            });
        } catch (error) {
            console.error("Error parsing schedule data:", error);
            console.log("Initializing default data due to parsing error");
            scheduleData = {
                processes: [
                    { pid: "P1", arrivalTime: 0, burstTime: 5, priority: 1 },
                    { pid: "P2", arrivalTime: 1, burstTime: 3, priority: 2 }
                ]
            };
            localStorage.setItem("scheduleData", JSON.stringify(scheduleData));
        }
    }

    // Update input table with valid data
    updateInputTable(scheduleData.processes);

    // Get the simulation button
    const simulateButton = document.querySelector(".simulate");
    if (!simulateButton) {
        console.error("Simulate button not found");
        return;
    }

    simulateButton.addEventListener("click", async function () {
        try {
            if (!scheduleData || !Array.isArray(scheduleData.processes) || scheduleData.processes.length === 0) {
                throw new Error("No valid process data to simulate");
            }

            console.log("Starting simulation...");
            console.log("Sending data:", scheduleData);

            const response = await fetch("http://localhost:3000/simulate", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(scheduleData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Server error");
            }

            const data = await response.json();
            console.log("Received response:", data);

            if (!data || !data.ganttChart || !data.processStats) {
                throw new Error("Invalid response from server: " + JSON.stringify(data));
            }

            // Standard handling for all algorithms
            startSimulation(data.ganttChart, data.processStats);
            updateMetrics(data.processStats, data.avgMetrics);
            updateGanttChart(data.ganttChart);

        } catch (error) {
            console.error("Error in simulation:", error);
            alert("Error in simulation: " + error.message);
        }
    });

    // Add event listeners for pause and back buttons
    const pauseButton = document.querySelector(".pause");
    if (pauseButton) {
        pauseButton.addEventListener("click", togglePause);
    }

    const backButton = document.querySelector(".back");
    if (backButton) {
        backButton.addEventListener("click", stepBack);
    }

    // Add event listener for again button
    const againButton = document.querySelector(".again");
    if (againButton) {
        againButton.addEventListener("click", async function () {
            try {
                // Reset the simulation state
                isPaused = false;
                document.querySelector(".pause").textContent = "Pause";
                simulationState = [];

                // Clear output table
                const outputTableBody = document.querySelector("#outputTable tbody");
                if (outputTableBody) {
                    outputTableBody.innerHTML = "";
                }

                // Clear Gantt chart
                const ganttChart = document.getElementById("ganttChart");
                if (ganttChart) {
                    ganttChart.innerHTML = "";
                }

                // Reset metrics
                document.getElementById("avgWaitingTime").textContent = "0.00";
                document.getElementById("avgTurnaroundTime").textContent = "0.00";
                document.getElementById("totalExecutionTime").textContent = "0.00";

                // Reset ready queue
                document.getElementById("queueList").textContent = "Ready Queue: (empty)";

                // Restart the simulation
                console.log("Starting simulation again...");
                console.log("Sending data:", scheduleData);

                const response = await fetch("http://localhost:3000/simulate", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(scheduleData)
                });

                const data = await response.json();
                console.log("Received response:", data);

                if (!response.ok || !data || !data.ganttChart || !data.processStats) {
                    throw new Error("Invalid response from server: " + JSON.stringify(data));
                }

                // Standard handling for all algorithms
                startSimulation(data.ganttChart, data.processStats);
                updateMetrics(data.processStats, data.avgMetrics);
                updateGanttChart(data.ganttChart);

            } catch (error) {
                console.error("Error in simulation:", error);
                alert("Error in simulation: " + error.message);
            }
        });
    }

    // Add event listener for the View Gantt Chart button
    const viewGanttButton = document.querySelector('.view-gantt');
    if (viewGanttButton) {
        viewGanttButton.addEventListener('click', function() {
            // Get the Gantt chart data from localStorage
            const ganttData = JSON.parse(localStorage.getItem('ganttData'));
            console.log("Current Gantt data:", ganttData);
            
            if (!ganttData || !ganttData.ganttChart) {
                alert("No Gantt chart data available. Please run a simulation first.");
                return;
            }
            
            window.location.href = 'gantt.html';
        });
    }
});

function updateInputTable(processes) {
    const inputTableBody = document.querySelector("#inputTable tbody");
    if (!inputTableBody) {
        console.error("Input table body not found");
        return;
    }

    inputTableBody.innerHTML = "";
    
    if (!Array.isArray(processes)) {
        console.error("Invalid processes data:", processes);
        return;
    }

    processes.forEach(p => {
        const row = `<tr>
            <td>${p.pid}</td>
            <td>${p.arrivalTime}</td>
            <td>${p.burstTime}</td>
            <td>${p.priority || "N/A"}</td>
        </tr>`;
        inputTableBody.innerHTML += row;
    });
}

let simulationInterval;
let isPaused = false;
let simulationState = [];

function startSimulation(schedule, processStats) {
    console.log("Starting simulation with:", { schedule, processStats });
    
    const outputTableBody = document.querySelector("#outputTable tbody");
    outputTableBody.innerHTML = "";

    if (!Array.isArray(schedule) || schedule.length === 0) {
        console.error("Invalid schedule:", schedule);
        return;
    }

    // Reset simulation state
    simulationState = [];
    isPaused = false;
    if (simulationInterval) clearInterval(simulationInterval);

    // Create process map with original burst times
    const processMap = {};
    processStats.forEach(p => {
        processMap[p.pid] = {
            pid: p.pid,
            originalBurstTime: p.burstTime,
            remainingTime: p.burstTime,
            waitingTime: 0,
            arrivalTime: p.arrivalTime,
            completionTime: 0,
            turnaroundTime: 0,
            state: 'ready'
        };
    });

    // Save initial state
    simulationState.push(JSON.parse(JSON.stringify(Object.values(processMap))));

    // Initialize table rows
    Object.values(processMap).forEach(p => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${p.pid}</td>
            <td>
                <div class="progress-container">
                    <div class="progress-bar" id="progress-${p.pid}"></div>
                </div>
            </td>
            <td id="remaining-${p.pid}">${p.remainingTime}</td>
            <td id="waiting-${p.pid}">${p.waitingTime}</td>
            <td id="completion-${p.pid}">${p.completionTime}</td>
            <td id="turnaround-${p.pid}">${p.turnaroundTime}</td>
        `;
        outputTableBody.appendChild(row);
    });

    // Save Gantt chart data
    const ganttData = {
        ganttChart: schedule,
        totalTime: schedule.reduce((max, slice) => Math.max(max, slice.endTime), 0)
    };
    localStorage.setItem('ganttData', JSON.stringify(ganttData));
    console.log("Saved Gantt chart data:", ganttData);

    // Start animation
    animateProgress(schedule, processMap);
}

function animateProgress(schedule, processMap) {
    console.log("Animating progress with:", { schedule, processMap });
    
    let index = 0;
    const simulationSpeed = 500; // 0.5 second per time unit

    simulationInterval = setInterval(() => {
        if (isPaused) return;
        
        if (index >= schedule.length) {
            clearInterval(simulationInterval);
            console.log("Simulation completed");
            Object.values(processMap).forEach(p => p.state = 'completed');
            updateReadyQueue(Object.values(processMap));
            return;
        }

        const slice = schedule[index];
        const pid = slice.pid;
        const progressBar = document.getElementById(`progress-${pid}`);
        const remainingCell = document.getElementById(`remaining-${pid}`);
        const waitingCell = document.getElementById(`waiting-${pid}`);
        const completionCell = document.getElementById(`completion-${pid}`);
        const turnaroundCell = document.getElementById(`turnaround-${pid}`);

        // Update process states
        Object.values(processMap).forEach(p => {
            if (p.pid === pid) {
                p.state = 'running';
            } else if (p.remainingTime > 0) {
                p.state = 'ready';
            } else {
                p.state = 'completed';
            }
        });

        // Save current state for step back functionality
        simulationState.push(JSON.parse(JSON.stringify(Object.values(processMap))));
        console.log("Current process states:", Object.values(processMap).map(p => `P${p.pid}: ${p.state}`));

        // Update remaining time with proper bounds check
        if (processMap[pid]) {
            const executionTime = slice.executionTime || 1;
            // Ensure remaining time doesn't go below 0
            processMap[pid].remainingTime = Math.max(0, processMap[pid].remainingTime - executionTime);
            remainingCell.textContent = processMap[pid].remainingTime;
            console.log(`P${pid} remaining time: ${processMap[pid].remainingTime}`);

            // Update completion time when process finishes
            if (processMap[pid].remainingTime === 0) {
                processMap[pid].completionTime = slice.endTime;
                processMap[pid].turnaroundTime = processMap[pid].completionTime - processMap[pid].arrivalTime;
                completionCell.textContent = processMap[pid].completionTime;
                turnaroundCell.textContent = processMap[pid].turnaroundTime;
            }

            // Update progress bar
            if (processMap[pid].originalBurstTime > 0) {
                const executed = processMap[pid].originalBurstTime - processMap[pid].remainingTime;
                const total = processMap[pid].originalBurstTime;
                const percent = (executed / total) * 100;
                progressBar.style.width = `${percent}%`;

                // Update progress bar color based on progress
                if (percent < 30) {
                    progressBar.style.backgroundColor = "#ff4444"; // Red
                } else if (percent < 60) {
                    progressBar.style.backgroundColor = "#ffbb33"; // Orange
                } else if (percent < 90) {
                    progressBar.style.backgroundColor = "#44ff44"; // Green
                } else {
                    progressBar.style.backgroundColor = "#00cc00"; // Dark Green
                }
            }
        }

        // Update waiting time for other processes with proper bounds check
        if (processMap[pid]) {
            Object.entries(processMap).forEach(([otherPid, p]) => {
                if (otherPid !== pid && p && p.remainingTime > 0) {
                    // Ensure waiting time is always a number and doesn't go below 0
                    p.waitingTime = Math.max(0, (p.waitingTime || 0) + (slice.executionTime || 1));
                    const waitingElement = document.getElementById(`waiting-${otherPid}`);
                    if (waitingElement) {
                        waitingElement.textContent = p.waitingTime;
                    }
                }
            });
        }

        // Ready queue UI
        updateReadyQueue(Object.values(processMap));

        // Log the current state for debugging
        console.log("Current state:", {
            index,
            pid,
            slice,
            processMap: Object.values(processMap).map(p => ({
                pid: p.pid,
                remainingTime: p.remainingTime,
                waitingTime: p.waitingTime,
                completionTime: p.completionTime,
                turnaroundTime: p.turnaroundTime
            }))
        });

        index++;
    }, simulationSpeed);
}

function updateReadyQueue(processes) {
    const readyQueueContainer = document.getElementById("queueList");
    if (!readyQueueContainer) return;

    const readyProcesses = processes.filter(p => p.remainingTime > 0 && p.state === 'ready');
    const runningProcess = processes.find(p => p.state === 'running');
    
    let queueText = '';
    if (runningProcess) {
        queueText = `Running: P${runningProcess.pid} | `;
    }
    queueText += readyProcesses.length > 0 
        ? `Ready Queue: ${readyProcesses.map(p => `P${p.pid}`).join(' ')}`
        : "Ready Queue: (empty)";
    
    readyQueueContainer.textContent = queueText;
    console.log("Ready Queue Updated:", queueText);
}

function togglePause() {
    isPaused = !isPaused;
    document.querySelector(".pause").textContent = isPaused ? "Resume" : "Pause";
}

function stepBack() {
    if (simulationState.length > 1) {
        simulationState.pop(); // Remove current state
        const previousState = simulationState[simulationState.length - 1];

        previousState.forEach(p => {
            const progressBar = document.getElementById(`progress-${p.pid}`);
            const progressPercent = ((p.originalBurstTime - p.remainingTime) / p.originalBurstTime) * 100;
            progressBar.style.width = `${progressPercent}%`;
            document.getElementById(`remaining-${p.pid}`).textContent = p.remainingTime;
        });
        updateReadyQueue();
    }
}

function updateGanttChart(schedule) {
    const ganttChart = document.getElementById("ganttChart");
    if (!ganttChart) return;

    // Clear existing chart
    ganttChart.innerHTML = "";

    // Create timeline
    const timeline = document.createElement("div");
    timeline.className = "gantt-timeline";
    ganttChart.appendChild(timeline);

    // Create processes container
    const processesContainer = document.createElement("div");
    processesContainer.className = "gantt-processes";
    ganttChart.appendChild(processesContainer);

    // Calculate total time
    const totalTime = schedule.reduce((max, slice) => Math.max(max, slice.endTime), 0);
    
    // Create timeline markers
    for (let i = 0; i <= totalTime; i += 5) {
        const marker = document.createElement("div");
        marker.className = "gantt-marker";
        marker.style.left = `${(i / totalTime) * 100}%`;
        marker.textContent = i;
        timeline.appendChild(marker);
    }

    // Create process bars with improved spacing
    let currentLeft = 0;
    schedule.forEach(slice => {
        const processBar = document.createElement("div");
        processBar.className = "process-bar";
        processBar.style.left = `${(slice.startTime / totalTime) * 100}%`;
        processBar.style.width = `${(slice.executionTime / totalTime) * 100}%`;

        // Only add process label if it's the first slice of this process
        if (slice.startTime === currentLeft) {
            const processLabel = document.createElement("div");
            processLabel.className = "process-label";
            processLabel.textContent = `P${slice.pid}`;
            processLabel.style.top = "10px"; // Move label above the bar
            processBar.appendChild(processLabel);
        }

        const sliceElement = document.createElement("div");
        sliceElement.className = "slice";
        sliceElement.style.width = "100%";
        sliceElement.style.backgroundColor = `hsl(${(slice.pid * 30) % 360}, 70%, 50%)`;

        const sliceLabel = document.createElement("div");
        sliceLabel.className = "slice-label";
        sliceLabel.textContent = `P${slice.pid}`;
        sliceElement.appendChild(sliceLabel);

        processBar.appendChild(sliceElement);
        processesContainer.appendChild(processBar);

        currentLeft += slice.executionTime;
    });

    // Save the Gantt chart data to localStorage
    const ganttData = {
        ganttChart: schedule,
        totalTime: totalTime
    };
    localStorage.setItem('ganttData', JSON.stringify(ganttData));
}

function updateMetrics(processStats, avgMetrics) {
    // Update individual metric values
    if (avgMetrics) {
        document.getElementById("avgWaitingTime").textContent = (avgMetrics.avgWaitingTime || 0).toFixed(2);
        document.getElementById("avgTurnaroundTime").textContent = (avgMetrics.avgTurnaroundTime || 0).toFixed(2);
        document.getElementById("totalExecutionTime").textContent = (avgMetrics.avgResponseTime || 0).toFixed(2);
    } else {
        document.getElementById("avgWaitingTime").textContent = "0.00";
        document.getElementById("avgTurnaroundTime").textContent = "0.00";
        document.getElementById("totalExecutionTime").textContent = "0.00";
    }
}

function getCurrentScheduleData() {
    const scheduleData = JSON.parse(localStorage.getItem("scheduleData"));
    if (!scheduleData) {
        console.error("No schedule data found");
        return null;
    }

    // Get the current state of processes from the output table
    const processRows = document.querySelectorAll("#outputTable tbody tr");
    const processes = [];

    processRows.forEach(row => {
        const pid = row.cells[0].textContent;
        const remainingBurstTime = parseInt(row.cells[2].textContent);
        const originalProcess = scheduleData.processes.find(p => p.pid === pid);
        
        if (originalProcess) {
            processes.push({
                pid: pid,
                arrivalTime: originalProcess.arrivalTime,
                burstTime: originalProcess.burstTime - remainingBurstTime, // Completed burst time
                priority: originalProcess.priority
            });
        }
    });

    return processes;
}
