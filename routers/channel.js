  const express = require('express');
  const mongoose = require('mongoose');
  const {
    getChannelInfo,
    getChannelVideos,
    postSubscribers,
    getChannelHistory,
    deleteVideoFromHistory,
    homeVideos,
    getNotifications
  } = require('../controllers/public/channel.controller');
  const { protect } = require('../middlewares/public');

  const channel = express.Router();

  // Specific routes first
  channel.get('/video/:channelId', getChannelVideos);
  channel.get('/history/:userId', protect, getChannelHistory);
  channel.delete('/history/:id', protect ,deleteVideoFromHistory)
  channel.put("/subscribe", protect, postSubscribers);
  channel.get('/home/:channelId', homeVideos)
  channel.get("/notifications/:userId", getNotifications)
  // Generic routes last
  channel.get('/:channelId/:userId', validateObjectId, getChannelInfo);





  // ObjectId validation middleware
  function validateObjectId(req, res, next) {
    console.log('working 1')
    if (!req.params.channelId) {
      return res.status(400).json({ error: 'Invalid ID format' });
    }
    next();
  }

  module.exports = channel;

