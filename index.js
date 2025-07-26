// server/index.js
const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
require('dotenv').config(); // For local development

// --- Robust Firebase Admin Initialization ---
// This code is smarter and works perfectly on Render
const serviceAccount = process.env.GOOGLE_APPLICATION_CREDENTIALS
  ? JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS)
  : require('./' + process.env.LOCAL_FIREBASE_KEY_PATH); // Assumes you have a different variable for local key path

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
// --- End of Initialization ---

const db = admin.firestore();
const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;

// --- API ROUTES ---

// GET all products
app.get('/api/products', async (req, res) => {
  try {
    const snapshot = await db.collection('products').get();
    const products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.status(200).json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ error: 'Something went wrong fetching products' });
  }
});

// POST a new product (for admin)
app.post('/api/products', async (req, res) => {
  try {
    const newProduct = req.body;
    if (!newProduct.name || !newProduct.price) {
        return res.status(400).json({ error: 'Missing name or price' });
    }
    const addedDoc = await db.collection('products').add(newProduct);
    res.status(201).json({ id: addedDoc.id, ...newProduct });
  } catch (error) {
    console.error("Error adding product:", error);
    res.status(500).json({ error: 'Something went wrong adding product' });
  }
});

// POST a new order
app.post('/api/orders', async (req, res) => {
    try {
      const newOrder = {
        ...req.body,
        status: 'pending',
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      };
      const addedDoc = await db.collection('orders').add(newOrder);
      res.status(201).json({ message: 'Order placed successfully!', orderId: addedDoc.id });
    } catch (error) {
      console.error("Error placing order:", error);
      res.status(500).json({ error: 'Something went wrong placing order' });
    }
});


app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});