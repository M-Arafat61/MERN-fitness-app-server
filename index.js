const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const jwt = require("jsonwebtoken");
const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.8ni3cgn.mongodb.net/?retryWrites=true&w=majority`;

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

    //
    //
    // db collection

    const userCollection = client.db("syncFitDb").collection("users");
    const reviewCollection = client.db("syncFitDb").collection("reviews");
    const subscriberCollection = client
      .db("syncFitDb")
      .collection("subscribers");
    const imageCollection = client.db("syncFitDb").collection("exerciseImages");
    const trainerCollection = client.db("syncFitDb").collection("trainers");
    const trainerApplicationCollection = client
      .db("syncFitDb")
      .collection("trainerApplications");
    const forumCollection = client.db("syncFitDb").collection("forums");
    const classCollection = client.db("syncFitDb").collection("classes");
    const packageCollection = client.db("syncFitDb").collection("packages");
    const trainerBookingCollection = client
      .db("syncFitDb")
      .collection("trainersSlotBooking");

    //
    //

    // jwt related apis
    //  creation of jwt token and sending as obj to frontend

    app.post("/jwt", async (req, res) => {
      const user = req.body;
      // console.log(user);
      const token = jwt.sign(user, process.env.JWT_ACCESS_TOKEN, {
        expiresIn: "1h",
      });
      res.send({ token });
    });

    //  verify if the token is valid, then send to protected api

    const verifyToken = (req, res, next) => {
      // console.log("inside verify token", req.headers.authorization);
      if (!req.headers.authorization) {
        return res.status(401).send({ message: "unauthorized access" });
      }
      const token = req.headers.authorization.split(" ")[1];
      jwt.verify(token, process.env.JWT_ACCESS_TOKEN, (err, decoded) => {
        if (err) {
          return res.status(401).send({ message: "unauthorized access" });
        }
        req.decoded = decoded;
        next();
      });
    };

    //

    // users related apis
    // saving a user while log in/registration for first time
    app.post("/users", async (req, res) => {
      const user = req.body;
      const query = { email: user.email };
      const isExist = await userCollection.findOne(query);
      if (isExist) {
        return res.send({ status: "user already exists" });
      }
      const result = await userCollection.insertOne(user);
      res.send(result);
    });

    // testimonial/reviews api
    app.get("/reviews", async (req, res) => {
      const result = await reviewCollection.find().toArray();
      res.send(result);
    });

    // subscriptions user api
    app.post("/subscriptions", async (req, res) => {
      const subscriber = req.body;
      const result = await subscriberCollection.insertOne(subscriber);
      res.send(result);
    });
    app.get("/subscribers", async (req, res) => {
      const result = await subscriberCollection.find().toArray();
      res.send(result);
    });

    // images api
    app.get("/images", async (req, res) => {
      const result = await imageCollection.find().toArray();
      res.send(result);
    });

    // trainers api
    app.get("/trainers", async (req, res) => {
      const result = await trainerCollection.find().toArray();
      res.send(result);
    });

    // specific trainer details
    app.get("/trainer-details/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await trainerCollection.findOne(query);
      res.send(result);
    });

    // trainer slot getting api
    app.get("/get-timeslot/:id/:day/:index", async (req, res) => {
      const { id, day, index } = req.params;

      try {
        const trainer = await trainerCollection.findOne({});
        const timeSlotOfDay = trainer.timeSlotOfDays[day];

        if (!timeSlotOfDay || index >= timeSlotOfDay.length) {
          return res.status(404).json({ message: "Time slot not found" });
        }

        const clickedSlot = timeSlotOfDay[index];
        res.json(clickedSlot);
      } catch (err) {
        res.status(500).json({ message: err.message });
      }
    });

    //
    // trainer slot booking api
    //

    app.post("/trainer-bookings", async (req, res) => {
      const bookedPackage = req.body;
      const result = await trainerBookingCollection.insertOne(bookedPackage);
      res.send(result);
    });

    //
    // packages api
    app.get("/packages", async (req, res) => {
      const result = await packageCollection.find().toArray();
      res.send(result);
    });

    // trainer application from (become a trainer)
    app.post("/trainer-applications", async (req, res) => {
      const form = req.body;
      const result = await trainerApplicationCollection.insertOne(form);
      res.send(result);
    });

    // community/forum api
    app.get("/forums", async (req, res) => {
      const result = await forumCollection.find().toArray();
      res.send(result);
    });
    app.post("/forums", async (req, res) => {
      const classes = req.body;
      const result = await forumCollection.insertOne(classes);
      res.send(result);
    });

    //
    //
    // Dashboard Trainer all apis
    //
    // classes api
    app.post("/classes", async (req, res) => {
      const classes = req.body;
      const result = await classCollection.insertOne(classes);
      res.send(result);
    });
    app.get("/classes", async (req, res) => {
      const result = await classCollection.find().toArray();
      res.send(result);
    });

    await client.db("admin").command({ ping: 1 });
    console.log("Successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("SyncFit Connect server...");
});

app.listen(port, () => {
  console.log(`SyncFit Connect is running on port ${port}`);
});
