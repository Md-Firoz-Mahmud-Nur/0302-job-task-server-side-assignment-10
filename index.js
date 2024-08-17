const express = require("express");
const app = express();
const cors = require("cors");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const port = process.env.PORT || 7000;
const { MongoClient, ServerApiVersion } = require("mongodb");

// Middleware
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
      "http://localhost:5175",
    ],
    credentials: true,
  })
);
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_SECRET_KEY}@cluster0.fp5eepf.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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
    // Connect the client to the server (optional starting in v4.7)
    await client.connect();

    const database = client.db("gadgetGalaxyDB");
    const productsCollection = database.collection("products");
    const priceCollection = database.collection("price");

    app.post("/jwt", async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1h",
      });
      res.send({ token });
    });

    app.get("/products", async (req, res) => {
      const page = parseInt(req.query.page);
      const testData = JSON.parse(req.query.testData);
      console.log(testData);
      let query = {};
      if (testData.search) {
        query = { name: { $regex: testData.search, $options: "i" } };
      }
      if (testData.brand.length > 0) {
        query.brand = { $in: testData.brand };
      }
      if (testData.category.length > 0) {
        query.category = { $in: testData.category };
      }

      if (testData.priceSelected.length === 2) {
        query.price = {
          $gte: Number(testData.priceSelected[0]),
          $lte: Number(testData.priceSelected[1]),
        };
      }

      console.log(testData.priceSelected[0]);

      const result = await productsCollection
        .find(query)
        .skip(page * 12)
        .limit(12)
        .toArray();
      res.send({ result });
    });

    app.get("/filter", async (req, res) => {
      const brands = await productsCollection
        .aggregate([{ $group: { _id: "$brand" } }, { $sort: { _id: 1 } }])
        .toArray();

      res.send(brands);
    });
    app.get("/filter2", async (req, res) => {
      const categories = await productsCollection
        .aggregate([{ $group: { _id: "$category" } }, { $sort: { _id: 1 } }])
        .toArray();

      res.send(categories);
    });
    app.get("/filter3", async (req, res) => {
      const categories = await priceCollection
        .aggregate([{ $group: { _id: "$price" } }, { $sort: { _id: 1 } }])
        .toArray();
      res.send(categories);
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("0302-job-task-server-side-assignment-10");
});

app.listen(port, () => {
  console.log(
    `0302-job-task-server-side-assignment-10 listening on port ${port}`
  );
});
