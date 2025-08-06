// scripts/create-test-reviews.js
const { MongoClient, ObjectId } = require('mongodb');

async function createTestReviews() {
  const client = new MongoClient('mongodb://localhost:27017');
  
  try {
    await client.connect();
    const db = client.db('Dorcas-cake');
    
    // Get admin user and first product
    const adminUser = await db.collection('users').findOne({ email: 'admin@gmail.com' });
    const product = await db.collection('products').findOne();
    
    console.log('Admin user:', adminUser._id);
    console.log('Product:', product._id);
    
    // Create test reviews
    const testReviews = [
      {
        user: adminUser._id,
        product: product._id,
        name: adminUser.name,
        rating: 5,
        comment: 'Amazing cake! Highly recommended.',
        status: 'approved',
        isFeatured: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        user: adminUser._id,
        product: product._id,
        name: adminUser.name,
        rating: 4,
        comment: 'Very good quality and taste.',
        status: 'pending',
        isFeatured: false,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    
    const result = await db.collection('reviews').insertMany(testReviews);
    console.log('Created reviews:', result.insertedIds);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

createTestReviews();