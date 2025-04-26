document.addEventListener('DOMContentLoaded', function() {
    // Get the Gantt chart data from localStorage
    const ganttData = JSON.parse(localStorage.getItem('ganttData'));
    console.log("Gantt chart data:", ganttData);

    if (!ganttData || !ganttData.ganttChart) {
        console.error("No valid Gantt chart data found");
        alert("No valid Gantt chart data found. Please run a simulation first.");
        return;
    }

    const ganttChart = document.getElementById('ganttChart');
    if (!ganttChart) {
        console.error("Gantt chart element not found");
        return;
    }

    // Clear existing content
    ganttChart.innerHTML = '';

    // Create timeline
    const timeline = document.createElement('div');
    timeline.className = 'gantt-timeline';
    ganttChart.appendChild(timeline);

    // Create processes container
    const processesContainer = document.createElement('div');
    processesContainer.className = 'process-bar';
    ganttChart.appendChild(processesContainer);

    // Calculate total time
    const totalTime = ganttData.totalTime;
    console.log("Total time:", totalTime);

    // Create timeline markers every 5 units
    for (let i = 0; i <= totalTime; i += 5) {
        const marker = document.createElement('div');
        marker.className = 'gantt-marker';
        marker.style.left = `${(i / totalTime) * 100}%`;
        marker.textContent = i;
        timeline.appendChild(marker);
    }

    // Create process bars
    const schedule = ganttData.ganttChart;
    let currentLeft = 0;

    schedule.forEach(slice => {
        const sliceElement = document.createElement('div');
        sliceElement.className = 'slice';
        
        // Calculate width and position
        const width = ((slice.endTime - slice.startTime) / totalTime) * 100;
        const left = (slice.startTime / totalTime) * 100;
        
        sliceElement.style.width = `${width}%`;
        sliceElement.style.left = `${left}%`;
        sliceElement.style.background = getProcessColor(slice.pid);
        sliceElement.textContent = `P${slice.pid}`;

        // Add tooltip with timeline information
        const tooltip = document.createElement('div');
        tooltip.className = 'slice-tooltip';
        tooltip.innerHTML = `
            <div class="tooltip-content">
                <strong>Process P${slice.pid}</strong><br>
                Start: ${slice.startTime}<br>
                End: ${slice.endTime}<br>
                Duration: ${slice.endTime - slice.startTime}
            </div>
        `;
        sliceElement.appendChild(tooltip);
        
        processesContainer.appendChild(sliceElement);
        currentLeft += width;
    });
});

// Helper function to get consistent colors for processes
function getProcessColor(pid) {
    const colors = [
        '#4caf50', // Green
        '#2196f3', // Blue
        '#ff9800', // Orange
        '#e91e63', // Pink
        '#9c27b0', // Purple
        '#00bcd4', // Cyan
        '#ffeb3b', // Yellow
        '#795548'  // Brown
    ];
    return colors[pid % colors.length];
} 
