const express = require("express");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const port = process.env.PORT || 5000;

//Middleware
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: ["http://localhost:5173"],
    credentials: true,
  })
);


// verify token
const verifyToken =(req,res,next)=>{
  const token = req?.cookies?.token;
  if(!token)
  {
    return res.status(401).send({message: 'unauthorized'})
  }
  //verify token
  jwt.verify(token,process.env.JWT_ACCESS_TOKEN,(err,decoded)=>{
    if(err){
      return res.status(401).send({message: 'unauthorized'})
    }
    req.decoded = decoded;
    console.log(decoded);
    next();
  })
}

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@jobportal.pqeysfz.mongodb.net/?retryWrites=true&w=majority&appName=jobPortal`;

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

    const jobsCollections = client.db("job_Portal").collection("jobs");
    const applicationCollections = client
      .db("job_Portal")
      .collection("applications");

    // jwt token related api
    app.post("/jwt", async (req, res) => {
      const userData = req.body;
      const token = jwt.sign(userData, process.env.JWT_ACCESS_TOKEN, {
        expiresIn: "1d",
      });
      // set token in the cookies
      res.cookie('token',token,{
        httpOnly: true,
        secure:false
      })
      res.send({ success: true });
    });

    app.get("/jobs", async (req, res) => {
      const email = req.query.email;
      const query = {};
      if (email) {
        query.hr_email = email;
      }
      const result = await jobsCollections.find(query).toArray();
      res.send(result);
    });

    app.get("/jobs/applications",async (req, res) => {
      const email = req.query.email;
      const query = { hr_email: email };
      const jobs = await jobsCollections.find(query).toArray();

      for (const job of jobs) {
        const applicationsQuery = { jobId: job._id.toString() };
        const applications_count = await applicationCollections.countDocuments(
          applicationsQuery
        );
        job.application_count = applications_count;
      }
      res.send(jobs);
    });

    app.get("/jobs/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await jobsCollections.findOne(query);
      res.send(result);
    });

    app.post("/jobs", async (req, res) => {
      const newJobData = req.body;
      const result = await jobsCollections.insertOne(newJobData);
      res.send(result);
    });

    //Jobs applications related Apis
    app.get("/applications",verifyToken,  async (req, res) => {
      const email = req.query.email;
      // console.log('inside applications api',req.cookies);
      if(email !== req.decoded.email)
      {
        return res.status(403).send({message: 'forbidden access'})
      }
      const query = { applicant: email };
      const result = await applicationCollections.find(query).toArray();

      // bad way to aggregate data
      for (const application of result) {
        const jobId = application.jobId;
        const jobQuery = { _id: new ObjectId(jobId) };
        const job = await jobsCollections.findOne(jobQuery);
        application.company = job.company;
        application.title = job.title;
        application.company_logo = job.company_logo;
      }
      res.send(result);
    });

    app.get("/applications/job/:job_id", async (req, res) => {
      const job_id = req.params.job_id;
      const query = { jobId: job_id };
      const result = await applicationCollections.find(query).toArray();
      res.send(result);
    });

    app.post("/applications", async (req, res) => {
      const application = req.body;
      const result = await applicationCollections.insertOne(application);
      res.send(result);
    });

    app.patch("/applications/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          status: req.body.status,
        },
      };
      const result = await applicationCollections.updateOne(filter, updateDoc);
      res.send(result);
    });

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
