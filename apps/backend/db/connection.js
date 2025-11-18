import 'dotenv/config';
import { MongoClient, ServerApiVersion } from "mongodb";
import mongoose from "mongoose";

const uri = process.env.MONGO_URI;

if (!uri) {
    console.error("Error: MONGO_URI is not defined in .env file");
    process.exit(1);
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
        // Connect the client to the server
        await mongoose.connect(uri, clientOptions);
        // Send a ping to confirm a successful connection
        await mongoose.connection.db.admin().command({ ping: 1 });
        console.log("Successfully connected to MongoDB.");
    } catch(err) {
        console.log("Error: Failed to connect to MongoDB: ", err.message);
    }
}

databaseConnect();

//let db = client.db("questions");
//export default db;