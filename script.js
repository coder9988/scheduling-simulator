document.getElementById("addProcessButton").addEventListener("click", function () {
    const pid = document.getElementById("pid").value; 
    const arrivalTime = document.getElementById("arrivalTime").value;
    const burstTime = document.getElementById("burstTime").value; 
    const priority = document.getElementById("priority").value;

    // Validate that the fields are not empty
    if (!pid || !arrivalTime || !burstTime) {
        alert("Please fill out all required fields (Process ID, Arrival Time, and Burst Time).");
        return;
    }

    // Create a new row for the table
    const tableBody = document.getElementById("processTableBody");
    const newRow = document.createElement("tr");

    // Create table data for each input and append to the new row
    newRow.innerHTML = `
        <td>${pid}</td>
        <td>${arrivalTime}</td>
        <td>${burstTime}</td>
        <td>${priority || "N/A"}</td>
    `;

    // Append the new row to the table
    tableBody.appendChild(newRow);

    // Clear input fields after adding process
    document.getElementById("pid").value = "";
    document.getElementById("arrivalTime").value = "";
    document.getElementById("burstTime").value = "";
    document.getElementById("priority").value = "";
});
