import express from 'express';
const app = express();
const port = 3001; // Using different port to avoid conflict with main backend (3000)
import './connection.js';
import Session from './session-schema.js';

app.use(express.json());

// Helper function to calculate the time passed since the start time
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

// Helper function to format the time passed since the start time to be human readable
function formatTimePassed(ms) {
    if (ms == null) return null;

    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours   = Math.floor(minutes / 60);
    const days    = Math.floor(hours / 24);

    if (days > 0) {
        return `${days} day${days !== 1 ? 's' : ''} ago`;
    } else if (hours > 0) {
        return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    } else if (minutes > 0) {
        return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    } else {
        return `${seconds} second${seconds !== 1 ? 's' : ''} ago`;
    }
}

// Helper function to create a dictionary of actionID to time passed (margin)
// Takes an array of actions and returns an object where key is actionID and value is time passed in milliseconds
function createActionTimeMarginDictionary(actions) {
    const timeMarginDict = {};
    
    if (Array.isArray(actions)) {
        actions.forEach(action => {
            if (action.actionID !== undefined && action.actionID !== null && action.start_time) {
                const timePassed = getTimePassed(action.start_time);
                timeMarginDict[action.actionID] = timePassed; // time passed in milliseconds
            }
        });
    }
    
    return timeMarginDict;
}

// GET request to get the content of a specific action by sessionCode and actionID
// Path parameters: sessionCode (required), actionID (required)
app.get('/api/session/:sessionCode/:actionID', async (req, res) => {
    try {
        const { sessionCode, actionID } = req.params;

        if (!sessionCode) {
            res.status(400).json({ error: 'sessionCode is required' });
            return;
        }

        if (!actionID) {
            res.status(400).json({ error: 'actionID is required' });
            return;
        }

        // Parse actionID to integer
        const numericActionID = parseInt(actionID, 10);
        if (isNaN(numericActionID)) {
            res.status(400).json({ error: 'actionID must be a valid number' });
            return;
        }

        // Find session by sessionCode or sessionID
        const session = await Session.findOne({
            $or: [
                { sessionCode: sessionCode },
                { sessionID: sessionCode }
            ]
        });

        if (!session) {
            res.status(404).json({ error: 'Session not found' });
            return;
        }

        // Find the action with matching actionID
        let foundAction = null;
        if (Array.isArray(session.actions)) {
            foundAction = session.actions.find(action => action.actionID === numericActionID);
        }

        if (!foundAction) {
            res.status(404).json({ 
                error: 'Action not found',
                sessionCode: session.sessionCode || session.sessionID,
                actionID: numericActionID
            });
            return;
        }

        // Return only the content of the action
        res.json({
            content: foundAction.content
        });
    } catch (err) {
        console.error('Error fetching action content from database: ', err.message);
        res.status(500).json({ error: err.message });
    }
});

// GET request to get all actionIDs and their start_time for a specific session
// Path parameter: sessionCode (required)
app.get('/api/session/:sessionCode/actions/times', async (req, res) => {
    try {
        const { sessionCode } = req.params;

        if (!sessionCode) {
            res.status(400).json({ error: 'sessionCode is required' });
            return;
        }

        // Find session by sessionCode or sessionID
        const session = await Session.findOne({
            $or: [
                { sessionCode: sessionCode },
                { sessionID: sessionCode }
            ]
        });

        if (!session) {
            res.status(404).json({ error: 'Session not found' });
            return;
        }

        // Extract actionID and start_time for each action
        const actions = [];
        if (Array.isArray(session.actions)) {
            session.actions.forEach(action => {
                if (action.actionID !== undefined && action.actionID !== null) {
                    actions.push({
                        actionID: action.actionID,
                        start_time: action.start_time
                    });
                }
            });
        }

        // Create dictionary with actionID as key and time passed (margin) as value
        const timeMarginDict = createActionTimeMarginDictionary(session.actions);

        res.json({
            actions: actions,
            timeMargins: timeMarginDict
        });
    } catch (err) {
        console.error('Error fetching actionIDs and start times from database: ', err.message);
        res.status(500).json({ error: err.message });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
    console.log(`Test endpoints:`);
    console.log(`  - http://localhost:${port}/api/session/:sessionCode/:actionID`);
    console.log(`  - http://localhost:${port}/api/session/:sessionCode/actions/times`);
});