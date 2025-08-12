const { createWorker } = require('mediasoup');
const { getIO } = require('./socket');

const state = {
  worker: null,
  routers: new Map(), // streamId -> router
  transports: new Map(),
  producers: new Map(),
  consumers: new Map()
}; 

async function initMediasoup() {
  state.worker = await createWorker({
    logLevel: 'warn',
    rtcMinPort: 40000,
    rtcMaxPort: 49999
  });
}

async function createRouter(streamId) {
  const router = await state.worker.createRouter({
    mediaCodecs: [
      {
        kind: 'audio',
        mimeType: 'audio/opus',
        clockRate: 48000,
        channels: 2
      },
      {
        kind: 'video',
        mimeType: 'video/VP8',
        clockRate: 90000,
        parameters: {
          'x-google-start-bitrate': 1000
        }
      }
    ]
  });

  state.routers.set(streamId, router);
  setupStreamHandlers(streamId);
  return router;
}

function setupStreamHandlers(streamId) {
  const io = getIO().of(`/live-${streamId}`);

  io.on('connection', (socket) => {
    console.log(`New stream connection to ${streamId}: ${socket.id}`);

    // [Your existing WebRTC handlers here]
    // createTransport, connectTransport, produce, consume, etc.
  });
}

module.exports = {
  initMediasoup,
  createRouter,
  getRouter: (streamId) => state.routers.get(streamId),
  getRtpCapabilities: (streamId) => state.routers.get(streamId).rtpCapabilities
};