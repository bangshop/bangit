// server/index.js
const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
require('dotenv').config();

// --- Base64 Decoding for Firebase Credentials ---
const encodedCredentials = process.env.GOOGLE_APPLICATION_CREDENTIALS_BASE64;
const decodedCredentials = Buffer.from(encodedCredentials, 'base64').toString('ascii');
const serviceAccount = JSON.parse(decodedCredentials);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
// --- End of Initialization ---

const db = admin.firestore();
const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;

// --- API ROUTES (No changes here) ---

app.get('/api/products', async (req, res) => {
  try {
    const snapshot = await db.collection('products').get();
    res.status(200).json(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

app.post('/api/products', async (req, res) => {
  try {
    const newProduct = req.body;
    const addedDoc = await db.collection('products').add(newProduct);
    res.status(201).json({ id: addedDoc.id, ...newProduct });
  } catch (error) {
    console.error("Error adding product:", error);
    res.status(500).json({ error: 'Failed to add product' });
  }
});

app.post('/api/orders', async (req, res) => {
    try {
      const newOrder = {
        ...req.body,
        status: 'pending',
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      };
      const addedDoc = await db.collection('orders').add(newOrder);
      res.status(201).json({ message: 'Order placed!', orderId: addedDoc.id });
    } catch (error) {
      console.error("Error placing order:", error);
      res.status(500).json({ error: 'Failed to place order' });
    }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});