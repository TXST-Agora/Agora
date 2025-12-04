import mongoose from 'mongoose';
const {Schema, model} = mongoose;

const sessionSchema = new Schema ({
    sessionID: String,
    sessionCode: String, // New field for the new endpoint
    title: String,
    description: String,
    iconID: Number,
    sessionType: String,
    mode: String, // New field for the new endpoint
    startTime: Date,
    hostStartTime: Date, // New field for the new endpoint
    endTime: Date,
    actions: { type: [Schema.Types.Mixed], default: [] } // New field for the new endpoint
},
{
    timestamps: false,
    versionKey: false
});

const Session = model('session', sessionSchema, 'host');

export default Session;