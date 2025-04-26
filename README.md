# scheduling-simulator
A web based CPU scheduling simulator | Supports FCFS,SJF,Priority, and Round Robin | Ready queue and gantt chart visuals

## 📌 Project Overview
This project is a **CPU Scheduling Simulator** built using **HTML, CSS, and JavaScript** with a backend powered by **Node.js and Express**. It allows users to simulate different CPU scheduling algorithms and visualize the execution using a **Gantt chart and ready queue animation**.

## 🚀 Features
- **Supports Multiple Scheduling Algorithms**:
  - First Come First Serve (FCFS)
  - Shortest Job First (SJF)
  - Priority Scheduling
  - Round Robin (User can set time quantum)
  - Shortest Remaining Time First (SRTF)
- **Dynamic Gantt Chart Visualization**
- **Animated Ready Queue Updates**
- **Pause and Resume Simulation**
- **Responsive UI with Dark Theme and Green Highlights**
- **LocalStorage Integration for Data Persistence**

## 🛠️ Tech Stack
- **Frontend**: HTML, CSS, JavaScript
- **Backend**: Node.js, Express
- **Storage**: LocalStorage for temporary data handling
- **Version Control**: Git & GitHub

## 📂 File Structure
```
📂 scheduling-simulator
├── input.html      # User input page
├── output.html     # Simulation visualization page
├── style.css       # Styling for pages
├── input.js        # Handles input logic
├── output.js       # Handles simulation and animation
│── server.js       # Node.js server handling scheduling logic
│── package.json    # Node dependencies
│── README.md       # Project documentation
```

## 📌 Installation & Setup
### 1️⃣ Clone the Repository
```sh
git clone https://github.com/coder9988/scheduling-simulator.git
cd scheduling-simulator
```
### 2️⃣ Install Dependencies
```sh
npm install
```
### 3️⃣ Run the Server
```sh
node server.js
```
The server will start at: **http://localhost:3000**

### 4️⃣ Open `input.html`
Run the project by opening **input.html** in your browser.

## 🔧 Usage Guide
1. Enter the process details (ID, Arrival Time, Burst Time, and Priority if applicable).
2. Select the scheduling algorithm.
3. If using **Round Robin**, specify the Time Quantum.
4. Click **Start Simulation** to visualize the execution.
5. The **Gantt Chart** and **Ready Queue** will update dynamically.

## 📌 GitHub Workflow
- **Maintain at least 7 revisions** with clear commit messages.
- Use **branches** for feature development and merge after testing.
- Keep the repository **public** as per project requirements.

## 💡 Future Enhancements
- Add more scheduling algorithms (e.g., Multi-Level Queue Scheduling)
- Improve UI with additional themes
- Export simulation results as a PDF

## 📜 License
This project is for educational purposes. Feel free to modify and use it.

