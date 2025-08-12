const mongoose = require("mongoose");

let connect = () => {
  console.log('Attempting MongoDB connection...');
  
  // Enable debug mode to see detailed connection logs
  mongoose.set('debug', true);

  mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 30000, // Increased timeout to 30 seconds
    socketTimeoutMS: 45000,
    maxPoolSize: 10, // Added connection pool settings
    retryWrites: true,
    retryReads: true
  })
  .then(() => console.log("✅ MongoDB Connected!"))
  .catch(err => {
    console.error("❌ MongoDB Connection Error:", err);
    console.log("Full error details:", JSON.stringify(err, null, 2));
  });

  // Event listeners for better debugging
  mongoose.connection.on('connecting', () => console.log('Mongoose connecting...'));
  mongoose.connection.on('connected', () => console.log('Mongoose connected!'));
  mongoose.connection.on('disconnecting', () => console.log('Mongoose disconnecting...'));
  mongoose.connection.on('disconnected', () => console.log('Mongoose disconnected!'));
  mongoose.connection.on('reconnected', () => console.log('Mongoose reconnected!'));
  mongoose.connection.on('error', (err) => console.error('Mongoose connection error:', err));
};

module.exports = connect;