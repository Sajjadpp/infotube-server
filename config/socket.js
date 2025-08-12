const { Server } = require('socket.io');
let io;
const Subscription = require("../model/public/subscribtion.schema");
const Notification = require("../model/public/notification.schema");
let userSocketMap = new Map()
function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: process.env.CORS_PATH, // Update with your client URL
      methods: ["GET", "POST"],
      credentials: true
    }
  });

  // Authentication middleware
  io.use((socket, next) => {
    const userId = socket.handshake.query.userId;
    if (!userId) {
      return next(new Error("Missing userId"));
    }
    socket.userId = userId;
    next();
  });

  io.on("connection", (socket) => {
    console.log(`New connection: ${socket.id} (User: ${socket.userId})`);

    // Join user room
    socket.join(socket.userId);

    // notify the users that stream is started
    socket.on('stream-started', async({streamerId, type})=>{
      let subscribers = await Subscription.find({channel: streamerId}).populate('subscriber');
      subscribers.forEach(async sub => {

        // storing to the db
        let not = await Notification.create({
          userId: sub.subscriber._id,
          type: "live",
          relatedId: streamerId,
          message: `Channel ${sub.subscriber.username} started live`
        })

        // emiting to the client side for real time notification
        console.log(sub.subscriber.username,'messaged')
        socket.to(sub.subscriber._id.toString()).emit('newNotification', not)
      })
    })

    // gettig the signal
    socket.on("signal", ({ to:targetId, from, ...rest }) => {
      console.log('signal from user ', from, ' to ', targetId,' on ', ...rest.type)
      console.log(targetId,"to")
      io.to(targetId).emit("signal", { from, ...rest });
       
    });

    // viewer trying to join
    socket.on('viewer-join', ({from, to}) => {
      console.log('viewer joined ', from, ' to ', to);
      
      // Get the streamer's socket instance
      const streamerSocket = Array.from(io.sockets.sockets.values())
        .find(s => s.userId === to.toString());
      
      if (streamerSocket) {
        // Emit only to the streamer, not to all sockets in the room
        streamerSocket.emit('viewer-join', from);
      } else {
        console.error('Streamer not found:', to);
      }
    });

    // stream endend
    socket.on('stream-ended', ({viewers=[], streamerId}) =>{
      viewers.forEach(viewer =>{
        socket.to(viewer.toString()).emit('stream-ended', {streamerId})
      })
    })

    // send comment
    socket.on('send-comment', ({streamerId, ...rest})=>{
      console.log('sending comment A')
      socket.to(streamerId.toString()).emit('add-comment', rest)
    })

    socket.on('add-comment',({viewers, senderId, ...rest})=>{
      console.log('sending comment B time')
      viewers.forEach(viewer => {
        socket.to(viewer.toString()).emit('new-comment', {...rest, senderId});
      })
    })


    // Broadcast to all in user room
    io.to(socket.userId).emit("sample", {
      message: `User ${socket.userId} has connected`,
      timestamp: new Date().toISOString()
    });

    // Handle disconnection
    socket.on("disconnect", () => {
      console.log(`Disconnected: ${socket.id} (User: ${socket.userId})`);
      socket.leave(socket.userId);
    });

    // Error handling
    socket.on("error", (err) => {
      console.error(`Socket error (${socket.id}):`, err);
    });
    
  });
}

function getIO() {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
}

// Helper function to send notifications
function sendNotification(userId, notification) {
  const io = getIO();
  io.to(userId).emit("newNotification", notification);
}

module.exports = { 
  initSocket, 
  getIO,
  sendNotification
};