const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const { fcfs, sjf, srtf, roundRobin, priorityScheduling } = require("./scheduling"); // Import functions

const app = express();
const PORT = 4000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(__dirname + "/public"));

app.post("/simulate", (req, res) => {
    try {
        const { processes, algorithm, timeQuantum } = req.body;

        if (!processes || !algorithm) {
            return res.status(400).json({ error: "Invalid request body" });
        }

        let schedule = [];

        switch (algorithm) {
            case "FCFS":
                schedule = fcfs(processes);
                break;
            case "SJF":
                schedule = sjf(processes);
                break;
            case "SRTF":
                schedule = srtf(processes);
                break;
            case "RoundRobin":
                schedule = roundRobin(processes, timeQuantum);
                break;
            case "Priority":
                schedule = priorityScheduling(processes);
                break;
            default:
                return res.status(400).json({ error: "Invalid algorithm selected" });
        }

        console.log("Sending JSON:", JSON.stringify(schedule));
        res.json(schedule);

    } catch (error) {
        console.error("Error processing request:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
