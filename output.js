document.addEventListener("DOMContentLoaded", function () {
    let scheduleData = window.scheduleData || [];
    
    if (!Array.isArray(scheduleData)) {
        console.error("Invalid schedule data received:", scheduleData);
        scheduleData = [];
    }
    console.log("Parsed schedule data:", scheduleData);

    const outputTable = document.getElementById("outputTable").querySelector("tbody");
    const queueList = document.getElementById("queueList");
    const chart = document.getElementById("chart");
    const simulateBtn = document.querySelector(".simulate");
    const pauseBtn = document.querySelector(".pause");
    const backBtn = document.querySelector(".back");
    const againBtn = document.querySelector(".again");
    const exitBtn = document.querySelector(".exit");

    let currentTime = 0;
    let interval = null;
    let readyQueue = [];
    let completedProcesses = 0;
    let runningProcess = null;

    function initializeTable() {
        outputTable.innerHTML = "";
        scheduleData.forEach(process => {
            let row = document.createElement("tr");
            row.innerHTML = `
                <td>${process.pid}</td>
                <td class="status">Waiting</td>
                <td class="remaining">${process.burstTime}</td>
                <td class="waiting-time">0</td>
            `;
            outputTable.appendChild(row);
        });
        queueList.textContent = "Ready Queue: (empty)";
        chart.innerHTML = "";
    }

    function updateSimulation() {
        if (completedProcesses === scheduleData.length) {
            clearInterval(interval);
            interval = null;
            return;
        }

        scheduleData.forEach(process => {
            if (process.arrivalTime <= currentTime && process.burstTime > 0 && !readyQueue.includes(process.pid)) {
                readyQueue.push(process.pid);
            }
        });

        queueList.textContent = "Ready Queue: " + (readyQueue.length > 0 ? readyQueue.join(", ") : "(empty)");

        if (runningProcess && runningProcess.burstTime === 0) {
            let row = [...outputTable.rows].find(row => row.cells[0].textContent == runningProcess.pid);
            row.cells[1].textContent = "Completed";
            readyQueue.shift();
            completedProcesses++;
            runningProcess = null;
        }

        if (!runningProcess && readyQueue.length > 0) {
            let pid = readyQueue.shift();
            runningProcess = scheduleData.find(p => p.pid === pid);
        }

        if (runningProcess) {
            let row = [...outputTable.rows].find(row => row.cells[0].textContent == runningProcess.pid);
            row.cells[1].textContent = "Running";
            row.cells[2].textContent = Math.max(0, --runningProcess.burstTime);

            chart.innerHTML += `<div class='gantt-block'>P${runningProcess.pid}</div>`;

            scheduleData.forEach(p => {
                if (p.pid !== runningProcess.pid && p.arrivalTime <= currentTime && p.burstTime > 0) {
                    let row = [...outputTable.rows].find(row => row.cells[0].textContent == p.pid);
                    row.cells[3].textContent = parseInt(row.cells[3].textContent) + 1;
                }
            });
        }
        currentTime++;
    }

    simulateBtn.addEventListener("click", function () {
        console.log("Simulate button clicked");
        if (!interval) {
            interval = setInterval(updateSimulation, 1000);
        }
    });

    pauseBtn.addEventListener("click", function () {
        console.log("Pause button clicked");
        clearInterval(interval);
        interval = null;
    });

    backBtn.addEventListener("click", function () {
        console.log("Back button clicked");
        clearInterval(interval);
        currentTime = 0;
        completedProcesses = 0;
        readyQueue = [];
        runningProcess = null;
        initializeTable();
    });

    againBtn.addEventListener("click", function () {
        console.log("Again button clicked");
        location.reload();
    });

    exitBtn.addEventListener("click", function () {
        console.log("Exit button clicked");
        alert("Exiting simulation");
        window.close();
    });

    initializeTable();
});
document.addEventListener("DOMContentLoaded", function () {
    console.log("Page loaded");

    const simulateBtn = document.querySelector(".simulate");
    const pauseBtn = document.querySelector(".pause");
    const backBtn = document.querySelector(".back");
    const againBtn = document.querySelector(".again");
    const exitBtn = document.querySelector(".exit");

    console.log("Simulate button found:", simulateBtn);
    console.log("Pause button found:", pauseBtn);
    console.log("Back button found:", backBtn);
    console.log("Again button found:", againBtn);
    console.log("Exit button found:", exitBtn);

    simulateBtn?.addEventListener("click", function () {
        console.log("Simulate button clicked");
    });

    pauseBtn?.addEventListener("click", function () {
        console.log("Pause button clicked");
    });

    backBtn?.addEventListener("click", function () {
        console.log("Back button clicked");
    });

    againBtn?.addEventListener("click", function () {
        console.log("Again button clicked");
    });

    exitBtn?.addEventListener("click", function () {
        console.log("Exit button clicked");
    });
});
