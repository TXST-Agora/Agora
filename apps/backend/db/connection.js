import { MongoClient, ServerApiVersion } from "mongodb";
import mongoose from "mongoose";

const uri = "mongodb+srv://trintb04_db_user:yAomVq9hF2X5Wi3R@agora-db.i1gktmu.mongodb.net/";

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