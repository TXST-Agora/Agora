import express from 'express';
import './connection.js';
import Session from './session-schema.js';
const app = express();
const port = 3000;

app.use(express.json());

//Helper function to format the time passed since the start time to be human readable
function formatTimePassed(ms) {
    if (ms == null) return null;

    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours   = Math.floor(minutes / 60);

    if (hours > 0) {
        return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    } else if (minutes > 0) {
        return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    } else {
        return `${seconds} second${seconds !== 1 ? 's' : ''} ago`;
    }
}

//Function to calculate the time passed since the start time
function getTimePassed(startTime) {
    if (!startTime) {
        return null;
    }

    // Accept either Date objects or ISO strings from MongoDB
    const startDate = startTime instanceof Date ? startTime : new Date(startTime);

    if (isNaN(startDate.getTime())) {
        return null;
    }

    const now = new Date();
    return now.getTime() - startDate.getTime(); // milliseconds
}

app.get('/', async (req, res) => {
    try {
        const sessions = await Session.find({});

        const sessionsWithTime = sessions.map((session) => {
            const sessionObj = session.toObject();

            const hostMs = getTimePassed(sessionObj.hostStartTime);
            sessionObj.hostTimePassedMs  = hostMs;                  // raw ms
            sessionObj.hostTimePassedStr = formatTimePassed(hostMs); // "2 minutes ago"

            if (Array.isArray(sessionObj.actions)) {
                sessionObj.actions = sessionObj.actions.map((action) => {
                    const actionMs = getTimePassed(action.start_time);
                    return {
                        ...action,
                        timePassedMs: actionMs,
                        timePassedStr: formatTimePassed(actionMs),
                    };
                });
            }

            return sessionObj;
        });

        res.json(sessionsWithTime);
    } catch (err) {
        console.error('Error fetching sessions from database: ', err.message);
        res.status(500).json({ error: err.message });
    }
});


app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

