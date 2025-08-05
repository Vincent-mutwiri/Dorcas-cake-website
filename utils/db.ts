// utils/db.ts
import mongoose from 'mongoose';

// Interface for the cached connection
interface CachedConnection {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

// Extend NodeJS global to include mongoose cache
declare global {
  // eslint-disable-next-line no-var
  var mongoose: CachedConnection;
}

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error(
    'Please define the MONGODB_URI environment variable inside .env.local'
  );
}

// Initialize the global cache if it doesn't exist
let cached = global.mongoose || { conn: null, promise: null };

if (!global.mongoose) {
  global.mongoose = cached;
}

/**
 * Establishes a connection to MongoDB using Mongoose with connection pooling and retry logic
 */
async function dbConnect() {
  // Extract database name from the connection string
  const dbName = MONGODB_URI ? new URL(MONGODB_URI).pathname.replace('/', '') : 'unknown';
  
  console.log('Attempting to connect to MongoDB...', {
    hasCachedConnection: !!cached.conn,
    nodeEnv: process.env.NODE_ENV,
    dbName: dbName
  });

  // Return cached connection if available
  if (cached.conn) {
    console.log('Using cached database connection');
    return cached.conn;
  }

  const isDevelopment = process.env.NODE_ENV === 'development';

  // Configure connection options
  const options: mongoose.ConnectOptions = isDevelopment
    ? {
        // Development-specific options (less strict)
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 30000,
        family: 4, // Use IPv4, skip trying IPv6
      }
    : {
        // Production-ready options for MongoDB Atlas
        serverSelectionTimeoutMS: 30000,
        socketTimeoutMS: 45000,
        connectTimeoutMS: 30000,
        maxPoolSize: 10,
        minPoolSize: 1,
        maxIdleTimeMS: 30000,
        tls: true,
        tlsAllowInvalidCertificates: false,
        tlsAllowInvalidHostnames: false,
        w: 'majority',
        wtimeoutMS: 2500,
        retryWrites: true,
        retryReads: true,
        authMechanism: 'SCRAM-SHA-1',
        authSource: 'admin',
        appName: 'Dorcas-Cake-Shop',
        autoIndex: false, // Let the application manage indexes in production
        family: 4,
      };

  try {
    if (!cached.promise) {
      console.log('Creating new database connection...');
      
      // Set strict query mode
      mongoose.set('strictQuery', false);
      
      // Set up event listeners for connection events
      mongoose.connection.on('connected', () => {
        console.log('MongoDB connected successfully');
      });

      mongoose.connection.on('error', (error) => {
        console.error('MongoDB connection error:', error);
      });

      mongoose.connection.on('disconnected', () => {
        console.log('MongoDB disconnected');
      });

      // Create the connection promise
      if (!MONGODB_URI) {
        throw new Error('MONGODB_URI is not defined');
      }
      
      cached.promise = mongoose.connect(MONGODB_URI, options).then((mongoose) => {
        console.log('MongoDB connection established');
        return mongoose;
      });
    }

    // Wait for the connection to be established
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    // Clear the promise on error to allow retries
    cached.promise = null;
    throw error;
  }
}

export default dbConnect;
