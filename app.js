// server.js - Main Application Entry Point
const express = require('express');
const env = require('dotenv');
const morgan = require('morgan');
const session = require('express-session');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const http = require('http');
const path = require('path');
const { initSocket, getIO, sendNotification } = require('./config/socket');
const { initMediasoup } = require('./config/mediasoup');
const connect = require('./config/connection')

// Initialize environment and Express
env.config();
const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 4000;

// Initialize core services
connect();
initMediasoup();    // Mediasoup WebRTC setup
initSocket(server); // Your existing Socket.IO setup

// Middleware
app.use(cors({ origin: 'https://intotube-client.vercel.app', credentials: true }));
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: { maxAge: 1000*60*60*24 },
}));
app.use(morgan('short'));
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

// Static files
app.use('/uploads', express.static('uploads'))
app.use('/thumbnails', express.static('uploads/thumbnails'))
app.use('/profile', express.static('uploads/profileImages'))
app.use('/videos', express.static('uploads/videos'))
// Routes
const authRouter = require('./routers/auth');
const videoRouter = require('./routers/video');
const channelRouter = require('./routers/channel');
const liveRouter = require('./routers/live');

app.use('/api/auth', authRouter);
app.use('/api/video', videoRouter);
app.use('/api/channel', channelRouter);
app.use('/api/live', liveRouter);

// Start server
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});