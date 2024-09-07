const express = require('express');
const cors = require('cors');
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb'); // Import ObjectId
require('dotenv').config();
const port = process.env.PORT || 3000;

app.use(cors()); // This will allow requests from any origin
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.vkv4ktv.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    const productCollection = client.db("FurniFlex").collection('Products');
    const cartCollection = client.db("FurniFlex").collection('Cart');

    app.get('/products', async (req, res) => {
      const result = await productCollection.find().toArray();
      res.send(result);
    });

    app.get('/products/:id', async (req, res) => {
      const id = req.params.id;
      if (!ObjectId.isValid(id)) {
        return res.status(400).send({ message: 'Invalid ObjectId format' });
      }
      const query = { _id: new ObjectId(id) };
      const result = await productCollection.findOne(query);
      res.send(result);
    });

    app.post('/cart', async (req, res) => {
      const Cart = req.body;
      const result = await cartCollection.insertOne(Cart);
      res.send(result);
    });

    app.get('/cart', async (req, res) => {
      const email = req.query.email;
      const query = { email: email };  // Filter by email
      const result = await cartCollection.find(query).toArray();
      res.send(result);
    });

    app.delete('/cart/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await cartCollection.deleteOne(query);
      res.send(result);
    });

    // New route for updating item quantity in the cart
    app.put('/cart/:id', async (req, res) => {
        const id = req.params.id;
        const { quantity } = req.body;
      
        if (!ObjectId.isValid(id)) {
          return res.status(400).send({ message: 'Invalid ObjectId format' });
        }
      
        if (typeof quantity !== 'number' || quantity <= 0) {
          return res.status(400).send({ message: 'Invalid quantity' });
        }
      
        const query = { _id: new ObjectId(id) };
        const updateDoc = {
          $set: { quantity: quantity } // Update the quantity
        };
      
        const result = await cartCollection.updateOne(query, updateDoc);
      
        if (result.matchedCount > 0) {
          res.send(result);
        } else {
          res.status(404).send({ message: 'Item not found' });
        }
      });
      

    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);

app.get('/', (req, res) => {
  res.send("server is running");
});

app.listen(port, () => {
  console.log(`FurniFlex is Running on port ${port}`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await client.close();
  console.log("MongoDB connection closed");
  process.exit(0);
});
