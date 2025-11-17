import express from 'express';
const router = express.Router();
import Session from 'db/session-schema.js';

router.post('/', async(req, res) => {
    const {sessionID, iconID, sessionType, startTime, endTime} = req.body; 

    try{
        const session = new Session({sessionID, iconID, sessionType, startTime, endTime})
    } catch(err){
        console.log("Error adding session to database: ", err.message);
    }
})