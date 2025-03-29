document.addEventListener("DOMContentLoaded", function () {
    const storedData = localStorage.getItem("scheduleData");
    if (!storedData) {
        console.error("No schedule data found.");
        return; 
    }

    const scheduleData = JSON.parse(storedData);
    updateInputTable(scheduleData.processes);

    document.querySelector(".simulate").addEventListener("click", function () {
        fetch("http://localhost:3000/simulate", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(scheduleData)
        })
        .then(response => response.json())
        .then(data => {
            startSimulation(data.schedule);
            updateMetrics(data);
            updateGanttChart(data.schedule);
        })
        .catch(error => console.error("Error:", error));
    });

    document.querySelector(".pause").addEventListener("click", function () {
        togglePause();
    });

    document.querySelector(".back").addEventListener("click", function () {
        stepBack();
    });
});

function updateInputTable(processes) {
    const inputTableBody = document.querySelector("#inputTable tbody");
    inputTableBody.innerHTML = "";
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
let readyQueue = [];

function startSimulation(schedule) {
    const outputTableBody = document.querySelector("#outputTable tbody");
    outputTableBody.innerHTML = "";
    readyQueue = [...schedule]; // Initialize ready queue
    updateReadyQueue();

    schedule.forEach(p => {
        p.remainingTime = p.burstTime; // Track remaining time dynamically
        p.originalBurstTime = p.burstTime;

        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${p.pid}</td>
            <td>
                <div class="progress-container">
                    <div class="progress-bar" id="progress-${p.pid}"></div>
                </div>
            </td>
            <td id="remaining-${p.pid}">${p.burstTime}</td>
            <td>${p.waitingTime}</td>
        `;
        outputTableBody.appendChild(row);
    });

    simulationState = JSON.parse(JSON.stringify(schedule));
    animateProgress(schedule);
}

function animateProgress(schedule) {
    let time = 0;
    const simulationSpeed = 1000; // Adjust speed (milliseconds per tick)
    
    simulationInterval = setInterval(() => {
        if (isPaused) return;

        let allCompleted = true;
        simulationState.push(JSON.parse(JSON.stringify(schedule))); // Save state for back button

        schedule.forEach(p => {
            if (p.remainingTime > 0) {
                allCompleted = false;
                p.remainingTime--;

                // Update progress bar
                const progressBar = document.getElementById(`progress-${p.pid}`);
                const progressPercent = ((p.originalBurstTime - p.remainingTime) / p.originalBurstTime) * 100;
                progressBar.style.width = `${progressPercent}%`;

                // Update remaining burst time
                document.getElementById(`remaining-${p.pid}`).textContent = p.remainingTime;

                // Change progress bar color dynamically
                if (progressPercent < 30) {
                    progressBar.style.backgroundColor = "red";
                } else if (progressPercent < 50) {
                    progressBar.style.backgroundColor = "blue";
                } else if (progressPercent < 70) {
                    progressBar.style.backgroundColor = "green";
                } else {
                    progressBar.style.backgroundColor = "darkgreen";
                }
            }
        });

        // Update ready queue
        updateReadyQueue();
        
        time++;

        if (allCompleted) {
            clearInterval(simulationInterval);
        }
    }, simulationSpeed);
}

function updateReadyQueue() {
    const readyQueueContainer = document.getElementById("queueList");
    readyQueueContainer.innerHTML = "Ready Queue: ";
    readyQueue.forEach(p => {
        if (p.remainingTime > 0) {
            const processSpan = document.createElement("span");
            processSpan.textContent = `P${p.pid} `;
            processSpan.classList.add("queue-item");
            readyQueueContainer.appendChild(processSpan);
        }
    });
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
    const chart = document.getElementById("chart");
    chart.innerHTML = "";

    schedule.forEach((p, index) => {
        const block = document.createElement("div");
        block.classList.add("gantt-block");
        block.style.width = `${p.executionTime * 20}px`;
        block.style.height = "40px";
        block.style.display = "inline-block";
        block.style.textAlign = "center";
        block.style.lineHeight = "40px";
        block.style.border = "1px solid black";
        block.style.marginRight = "2px";
        block.textContent = `P${p.pid}`;

        const timeLabelStart = document.createElement("span");
        timeLabelStart.textContent = p.startTime;
        timeLabelStart.style.marginRight = "5px";

        const timeLabelEnd = document.createElement("span");
        timeLabelEnd.textContent = p.endTime;
        timeLabelEnd.style.marginLeft = "5px";

        chart.appendChild(timeLabelStart);
        chart.appendChild(block);
        chart.appendChild(timeLabelEnd);
    });
}

function updateMetrics(data) {
    document.getElementById("avgWaitingTime").textContent = data.avgWaitingTime.toFixed(2);
    document.getElementById("avgTurnaroundTime").textContent = data.avgTurnaroundTime.toFixed(2);
    document.getElementById("totalExecutionTime").textContent = data.totalExecutionTime;
}
