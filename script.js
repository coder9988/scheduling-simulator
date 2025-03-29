document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("addProcessButton").addEventListener("click", addProcess);
    document.getElementById("startSimulationButton").addEventListener("click", startSimulation);
    document.getElementById("algorithm").addEventListener("change", toggleQuantumInput);
});

function toggleQuantumInput() {
    const algorithm = document.getElementById("algorithm").value;
    const timeQuantumInput = document.getElementById("timeQuantum");
    timeQuantumInput.style.display = algorithm === "RoundRobin" ? "inline-block" : "none";
}

function addProcess() {
    const pid = document.getElementById("pid").value.trim();
    const arrivalTime = document.getElementById("arrivalTime").value;
    const burstTime = document.getElementById("burstTime").value;
    const priority = document.getElementById("priority").value;

    if (!pid || !arrivalTime || !burstTime) {
        alert("Please enter Process ID, Arrival Time, and Burst Time.");
        return;
    }

    const tableBody = document.getElementById("processTableBody");
    const row = document.createElement("tr");

    row.innerHTML = `
        <td>${pid}</td>
        <td>${parseInt(arrivalTime)}</td>
        <td>${parseInt(burstTime)}</td>
        <td>${priority ? parseInt(priority) : "-"}</td>
    `;

    tableBody.appendChild(row);

    document.getElementById("pid").value = "";
    document.getElementById("arrivalTime").value = "";
    document.getElementById("burstTime").value = "";
    document.getElementById("priority").value = "";
}

function startSimulation() {
    const algorithm = document.getElementById("algorithm").value;
    const timeQuantum = document.getElementById("timeQuantum").value ? parseInt(document.getElementById("timeQuantum").value) : null;
    const rows = document.querySelectorAll("#processTableBody tr");

    let processes = [];
    rows.forEach(row => {
        let cells = row.children;
        processes.push({
            pid: cells[0].textContent,
            arrivalTime: parseInt(cells[1].textContent),
            burstTime: parseInt(cells[2].textContent),
            priority: cells[3].textContent !== "-" ? parseInt(cells[3].textContent) : null
        });
    });

    if (processes.length === 0) {
        alert("Please add at least one process before starting simulation.");
        return;
    }

    const scheduleData = { processes, algorithm, timeQuantum };

    // Store data in localStorage before navigating
    localStorage.setItem("scheduleData", JSON.stringify(scheduleData));

    // Redirect to output.html
    window.location.href = "output.html";
}
