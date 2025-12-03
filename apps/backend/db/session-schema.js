import mongoose from 'mongoose';
const {Schema, model} = mongoose;

const sessionSchema = new Schema ({
    sessionID: String,
    title: String,
    description: String,
    iconID: Number,
    sessionType: String,
    startTime: Date,
    endTime: Date},
{
    timestamps: false,
    versionKey: false
});

const Session = model('session', sessionSchema, 'host');

export default Session;