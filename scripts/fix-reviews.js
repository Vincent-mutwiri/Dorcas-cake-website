// scripts/fix-reviews.js
const { MongoClient, ObjectId } = require('mongodb');

async function fixReviews() {
  const client = new MongoClient('mongodb://localhost:27017');
  
  try {
    await client.connect();
    const db = client.db('Dorcas-cake');
    
    // Get all reviews
    const reviews = await db.collection('reviews').find({}).toArray();
    console.log('Found reviews:', reviews.length);
    
    // Get the admin user
    const adminUser = await db.collection('users').findOne({ email: 'admin@gmail.com' });
    console.log('Admin user:', adminUser);
    
    if (adminUser) {
      // Update all reviews to have the admin user as the reviewer
      for (const review of reviews) {
        if (!review.user) {
          await db.collection('reviews').updateOne(
            { _id: review._id },
            { 
              $set: { 
                user: adminUser._id,
                name: adminUser.name 
              } 
            }
          );
          console.log(`Updated review ${review._id} with user ${adminUser._id}`);
        }
      }
    }
    
    console.log('Reviews fixed successfully');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

fixReviews();