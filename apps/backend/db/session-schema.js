import { time } from 'console';
import mongoose from 'mongoose';
const {Schema, model} = mongoose;

const sessionSchema = new Schema ({
    sessionID: String,
    iconID: Number,
    sessionType: String,
    startTime: Date,
    endTime: Date},
{timestamps: true});

const Session = model('Session', sessionSchema);

export default Session;