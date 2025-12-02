import 'dotenv/config';
import { MongoClient, ServerApiVersion } from "mongodb";
import mongoose from "mongoose";

let uri = process.env.MONGO_URI;

if (!uri) {
    console.error("Error: MONGO_URI is not defined in .env file");
    process.exit(1);
}

// Ensure the database name is in the URI
// If URI ends with '/', append 'session' database name
if (uri.endsWith('/')) {
    uri = uri + 'session';
} else if (!uri.match(/\/[^\/?]+(\?|$)/)) {
    // If URI doesn't have a database name before query params, add it
    const queryIndex = uri.indexOf('?');
    if (queryIndex !== -1) {
        uri = uri.substring(0, queryIndex) + '/session' + uri.substring(queryIndex);
    } else {
        uri = uri + '/session';
    }
}

/*const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});*/

const clientOptions = {serverApi: {version: '1', strict: true, deprecationErrors: true}};

async function databaseConnect(){
    try {
        // Ensure we're disconnected before connecting (in case of previous connection)
        if (mongoose.connection.readyState !== 0) {
            await mongoose.disconnect();
        }
        
        // Connect the client to the server
        await mongoose.connect(uri, clientOptions);
        
        // Send a ping to confirm a successful connection
        await mongoose.connection.db.admin().command({ ping: 1 });
        console.log("Successfully connected to MongoDB.");
        console.log("Connected to database:", mongoose.connection.db.databaseName);
    } catch(err) {
        console.log("Error: Failed to connect to MongoDB: ", err.message);
    }
}

// Only connect if not in test environment
if (process.env.NODE_ENV !== 'test' && !process.env.VITEST) {
    databaseConnect();
}

//let db = client.db("questions");
//export default db;