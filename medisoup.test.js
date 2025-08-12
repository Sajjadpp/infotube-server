const { createWorker } = require('mediasoup');

(async () => {
  try {
    const worker = await createWorker({
      logLevel: 'debug'
    });
    console.log('✅ mediasoup worker created successfully!');
    worker.close();
  } catch (error) {
    console.error('❌ mediasoup failed:', error);
  }
})();