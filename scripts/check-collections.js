// scripts/check-collections.js
const { MongoClient } = require('mongodb');

async function checkCollections() {
  const client = new MongoClient('mongodb://localhost:27017');
  
  try {
    await client.connect();
    const db = client.db('Dorcas-cake');
    
    // List all collections
    const collections = await db.listCollections().toArray();
    console.log('Collections:', collections.map(c => c.name));
    
    // Check each collection for data
    for (const collection of collections) {
      const count = await db.collection(collection.name).countDocuments();
      console.log(`${collection.name}: ${count} documents`);
      
      if (collection.name.includes('review')) {
        const sample = await db.collection(collection.name).findOne();
        console.log(`Sample from ${collection.name}:`, sample);
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

checkCollections();