const express = require('express');
const { MongoClient } = require('mongodb');
const cors = require('cors');
const serverless = require('serverless-http'); // Import serverless-http

const app = express();
app.use(cors());
app.use(express.json());

// Connection URI - Use environment variable for MongoDB URI
const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error('MONGODB_URI environment variable is not set.');
  // In a real deployment, you might want to throw an error or handle this more gracefully
}

// Database Name
const dbName = 'bloodDonorDB';

// Create a new MongoClient
const client = new MongoClient(uri);

async function connectToMongo() {
  if (!client.isConnected()) { // Check if client is already connected
    await client.connect();
    console.log('Connected successfully to MongoDB');
  }
  return client.db(dbName);
}

// Register a new donor
app.post('/api/donors', async (req, res) => {
  try {
    const db = await connectToMongo();
    const donorsCollection = db.collection('donors');
    const { name, bloodType, district, contact } = req.body;
    if (!name || !bloodType || !district || !contact) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    const newDonor = { name, bloodType, district, contact };
    const result = await donorsCollection.insertOne(newDonor);
    res.status(201).json(result);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all donors, with optional filtering
app.get('/api/donors', async (req, res) => {
  try {
    const db = await connectToMongo();
    const donorsCollection = db.collection('donors');
    const { bloodType, district } = req.query;
    const filter = {};
    if (bloodType) {
      filter.bloodType = bloodType;
    }
    if (district) {
      filter.district = district;
    }
    const donors = await donorsCollection.find(filter).toArray();
    res.json(donors);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new blood request
app.post('/api/requests', async (req, res) => {
  try {
    const db = await connectToMongo();
    const requestsCollection = db.collection('requests');
    const { patientName, bloodType, district, hospital, contact } = req.body;
    if (!patientName || !bloodType || !district || !hospital || !contact) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    const newRequest = { patientName, bloodType, district, hospital, contact, createdAt: new Date() };
    const result = await requestsCollection.insertOne(newRequest);
    res.status(201).json(result);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all blood requests
app.get('/api/requests', async (req, res) => {
  try {
    const db = await connectToMongo();
    const requestsCollection = db.collection('requests');
    const requests = await requestsCollection.find({}).sort({ createdAt: -1 }).toArray();
    res.json(requests);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
});

// Export the handler for Netlify Functions
module.exports.handler = serverless(app);
