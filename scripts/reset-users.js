// scripts/reset-users.js
const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

async function resetUsersCollection() {
  const client = new MongoClient('mongodb://localhost:27017');
  
  try {
    await client.connect();
    const db = client.db('Dorcas-cake');
    
    // Get existing admin user data first
    const existingUser = await db.collection('users').findOne({ email: 'admin@gmail.com' });
    console.log('Existing user:', existingUser);
    
    // Drop the existing users collection
    await db.collection('users').drop();
    console.log('Dropped users collection');
    
    // Hash password for admin user
    const hashedPassword = await bcrypt.hash('admin123', 12);
    
    // Create a new user with the correct structure
    const newUser = {
      name: 'Admin',
      email: 'admin@gmail.com',
      password: existingUser?.password || hashedPassword,
      isAdmin: true,
      profilePicture: '/images/default-avatar.png',
      addresses: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      __v: 0
    };
    
    const result = await db.collection('users').insertOne(newUser);
    console.log('Created new user with ID:', result.insertedId);
    console.log('New user structure:', newUser);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

resetUsersCollection();