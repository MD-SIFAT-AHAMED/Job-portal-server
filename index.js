const express = require("express");
const cors = require("cors");
require('dotenv').config();
const { MongoClient, ServerApiVersion } = require("mongodb");
const app = express();
const port = process.env.PORT || 5000;

//Middleware
app.use(express.json());
app.use(cors());
// rXUWxnePoEQYzc0C
const uri =
  `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@jobportal.pqeysfz.mongodb.net/?retryWrites=true&w=majority&appName=jobPortal`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();


    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Job Portal server is Running");
});

app.listen(port, () => {
  console.log(`Job portal server is running on port ${port}`);
});
