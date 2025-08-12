const express = require('express');
const { createRouter, getRtpCapabilities, getRouter } = require('../config/mediasoup');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// Create new stream
router.post('/streams', async (req, res) => {
  try {
    const streamId = uuidv4();
    await createRouter(streamId);
    
    res.json({ 
      streamId,
      rtpCapabilities: getRtpCapabilities(streamId)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get stream info
router.get('/streams/:id', (req, res) => {
  const router = getRouter(req.params.id);
  if (!router) return res.status(404).json({ error: 'Stream not found' });
  
  res.json({
    activeProducers: Array.from(state.producers.values())
      .filter(p => p.appData.streamId === req.params.id).length
  });
});

module.exports = router;