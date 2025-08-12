const Video = require('../../model/public/video.schema');
const upload = require('../../service/uploads');
const { getVideoDuration } = require('../../service/videoProcessor');
const mongoose = require('mongoose')
const fs = require('fs');
const Comment = require('../../model/public/comments.schema');
const { sendCommentReplyNotification } = require('../../service/nodemailer');
const Like = require('../../model/public/likes.schema');
const Subscription = require('../../model/public/subscribtion.schema');
const Notification = require('../../model/public/notification.schema')
const Views = require('../../model/public/views.schema');
const { getIO } = require('../../config/socket');

const uploadVideo = async (req, res) => {
    try {
      // Check for required video file
      if (!req.files?.video?.[0]) {
        return res.status(400).json({ error: 'No video file uploaded' });
      }
  
      const videoFile = req.files.video[0];
      const thumbnailFile = req.files.thumbnail?.[0];
  
      // Validate video file type
      if (!videoFile.mimetype.startsWith('video/')) {
        fs.unlinkSync(videoFile.path);
        return res.status(400).json({ error: 'Invalid video file type' });
      }
  
      // Process video metadata
      const duration = await getVideoDuration(videoFile.path);
      
      // Generate URLs
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const videoUrl = `${baseUrl}/videos/${videoFile.filename}`;
      const thumbnailUrl = thumbnailFile 
        ? `${baseUrl}/thumbnails/${thumbnailFile.filename}`
        : `${baseUrl}/thumbnails/default.jpg`;
      // Create video document
      const videoData = {
        title: req.body.title?.trim() || 'Untitled Video',
        description: req.body.description?.trim() || '',
        duration,
        filePath: videoFile.filename,
        size: videoFile.size,
        owner: req.user.user,
        user: req.user.user,
        category: req.body.category?.trim() || 'entertainment',
        hashtags: req.body.hashtags ? JSON.parse(req.body.hashtags) : [],
        videoType: req.body.videoType,
        visibility: req.body.visibility
      };
  
      // Validate against video schema
      const newVideo = new Video(videoData);
      await newVideo.validate(); // Trigger mongoose validation
      
      // Save to database
      await newVideo.save();
      console.log('uploading video proggress 60%')
      // send notification to the subscribers 
      const subscribers =  await Subscription.find({channel: newVideo.user}).populate('subscriber');

      for(let sub of subscribers){
        console.log('sending notfication to:', sub.subscriber)
        let not = await Notification.create({
          userId: sub.subscriber._id,
          type: "upload",
          isRead: false,
          message: `New video uploaded: ${newVideo.title}`,
          relatedId: newVideo._id
        })

        getIO().to(sub.subscriber._id.toString()).emit('newNotification', not)
      }

      // Send response
      res.status(201).json({
        success: true,
        video: {
          id: newVideo._id,
          title: newVideo.title,
          duration: newVideo.duration,
          thumbnailUrl: newVideo.thumbnailUrl,
          videoUrl: newVideo.videoUrl
        }
      });
  
    } catch (err) {
      console.error('Upload error:', err);
  
      // Cleanup uploaded files on error
      if (req.files?.video?.[0]) {
        fs.unlinkSync(req.files.video[0].path);
      }
      if (req.files?.thumbnail?.[0]) {
        fs.unlinkSync(req.files.thumbnail[0].path);
      }
  
      // Handle validation errors
      if (err.name === 'ValidationError') {
        return res.status(400).json({ error: err.message });
      }
  
      res.status(500).json({ 
        error: 'Failed to upload video',
        message: err.message 
      });
    }
};

const getVideos = async(req, res) =>{

    try{
        let videos;
        
        
        if(req.query){
          if(!req.query.shorts) req.query.shorts = false
          
          videos = await Video.find({...req.query}).populate('user')
        }
        videos = await Video.find().populate('user');


        res.json(videos)
    
    }
    catch(error){
        console.log(error);
        res.status(500).json('new error in server')
    }
}
const getSingleVideo = async (req, res) => {
    try {
        const { id: videoId } = req.params;
        let { userId } = req.query;
        
        // Validate video ID format
        if (!mongoose.Types.ObjectId.isValid(videoId)) {
            return res.status(400).json({
                success: false,
                error: "Invalid video ID format"
            });
        }

        const video = await Video.findById(videoId)
            .populate('user', 'username profileImage subscribersCount')
            .populate('category', 'name')
            .lean();

        if (!video) {
            return res.status(404).json({
                success: false,
                error: "Video not found"
            });
        }

        // Initialize response data
        let userLikeStatus = null;
        let subscriptionStatus = null;
        let lastSeenDuration = 0;
        let videoLikes = [];
        let prevShort = null;
        let nextShort = null;
        

        // Only fetch user-specific data if userId is valid
        if (userId && mongoose.Types.ObjectId.isValid(userId)) {
            videoLikes = await Like.find({ video: video._id });
            userLikeStatus = videoLikes.find(like => String(like.user) === userId)?.type;
            
            subscriptionStatus = await Subscription.findOne({
                subscriber: userId, 
                channel: video.user._id
            });

            console.log(subscriptionStatus,'status')

            const view = await Views.findOne({ user: userId, video: video._id });
            lastSeenDuration = view?.duration || 0;
        }

        // Get previous/next shorts if it's a short video
        if (video.videoType === 'shorts') {
            [prevShort, nextShort] = await Promise.all([
                Video.findOne({ videoType: 'shorts', _id: { $lt: video._id } }, { _id: 1 }).sort({ _id: -1 }),
                Video.findOne({ videoType: 'shorts', _id: { $gt: video._id } }, { _id: 1 }).sort({ _id: 1 })
            ]);
        }

        let commentCount = await Comment.countDocuments({video: videoId});
        console.log(commentCount,'commentcount')

        // Format response
        const response = {
            success: true,
            data: {
                ...video,
                viewCount: await Views.countDocuments({ video: videoId }),
                user: {
                    _id: video.user._id,
                    username: video.user.username,
                    avatar: video.user.profileImage,
                    subscribersCount: video.user.subscribersCount
                },
                category: video.category?.name || 'Uncategorized',
                videoLikes: videoLikes.filter(like => like.type === 'like').length,
                userLikeStatus,
                isSubscribed: !!subscriptionStatus,
                subscriptionStatus,
                prevShort: prevShort?._id,
                nextShort: nextShort?._id,
                lastSeenDuration,
                commentCount: commentCount ?? 0
            }
        };

        res.status(200).json(response);

    } catch (error) {
        console.error("Error fetching video:", error);
        
        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                error: "Invalid ID format"
            });
        }

        res.status(500).json({
            success: false,
            error: "Server error while fetching video",
            message: error.message
        });
    }
};

const postComment = async (req, res) => {
  let { content, video, user, parentComment } = req.body;
  
  let commentDataObj = {
    video,
    user,
    content,
    parentComment,
    likeCount: 0,
    dislikeCount: 0,
  }

  try {
    // Create and save the comment
    const comment = new Comment(commentDataObj);
    await comment.save();

    
    // Populate the user data before sending response
    const populatedComment = await Comment.findById(comment._id)
      .populate('user', 'username email') // Specify fields you want
      .exec();

    // send mail to the preson that he got replay if the comment is replay
    if(comment.parentComment){
      const originalComment = await Comment.findById(comment.parentComment).populate('user')
      let email = originalComment.user.email;
      
      const commentData = {
        recipientName: originalComment.user.username,
        replierName: populatedComment.user.username,
        originalCommentContent: originalComment.content,
        originalCommentDate: new Date(originalComment.createdAt).toLocaleDateString(),
        replyContent: populatedComment.content,
        replyDate: new Date(populatedComment.createdAt).toLocaleDateString(),
        companyName: 'InfoTube',
        videoUrl: `video/${originalComment.video}?comm`
      };
      let success = await sendCommentReplyNotification(email, commentData);
      // real time notification to user

      let not = await Notification.create({
        userId: originalComment.user._id,
        type: 'comment',
        isRead: false,
        message: `User ${populatedComment.user.username} replayed on your comment`,
        relatedId: originalComment.video,
        relatedId2: originalComment._id
      })
      console.log(not, 'notification of commenting')
      getIO().to(originalComment.user._id.toString()).emit('newNotification',not)
    }


    res.json(populatedComment);
  } catch (error) {
    console.log(error);
    res.status(500).json(error.message);
  }
}

const getCommentByVideo = async (req, res) => {
  try {
    let { videoId } = req.params;
    
    // First fetch top-level comments (where parentComment is null)
    const comments = await Comment.find({ video: videoId, parentComment: null })
      .populate('user')
      .sort({ createdAt: -1 }); // Sort by newest first
    
    // Then fetch all replies for these comments
    const commentsWithReplies = await Promise.all(
      comments.map(async (comment) => {
        const replies = await Comment.find({ parentComment: comment._id })
          .populate('user')
          .sort({ createdAt: 1 }); // Sort replies by oldest first
        return {
          ...comment.toObject(),
          replies
        };
      })
    );
    console.log(commentsWithReplies,"replay")
    res.json(commentsWithReplies);
  } catch (error) {
    console.log(error);
    res.status(500).json(error.message);
  }
};

const getRecommendedVideo = async (req, res) => {
  try {
    console.log('entered');
    const { videoId } = req.params;

    // Validate format (optional)
    if (!videoId || !mongoose.Types.ObjectId.isValid(videoId)) {
      return res.status(400).json({ success: false, error: "Invalid video ID format" });
    }

    // Find current video by its _id
    const currentVideo = await Video.findById(videoId);
    if (!currentVideo) {
      return res.status(404).json({ success: false, error: "Video not found" });
    }

    // Find recommended videos by matching hashtags
    const recommended = await Video.find({
      _id: { $ne: videoId }, // exclude current video,
      videoType: {$ne: 'shorts'},
      hashtags: { $in: currentVideo.hashtags }
    })
    .populate('user');
    console.log(recommended, currentVideo)
    res.json(recommended);
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
};

const changeLikeStatus = async(req, res) =>{

  try{
    
    let {videoId, commentId, userId, likeStatus} = req.body;
    console.log(likeStatus,"likeStatus" ,videoId, userId)
    if( !videoId || !userId ){
      return res.status(305).json('videoId and userId is invalid');
    }
    
    if(!userId){
      return res.status(401).json('user Not Found')
    }

    let Obj = {
      user: userId, video: videoId, comment: commentId
    }
    if(!commentId){
      delete Obj['comment'];
    }
    console.log('workingss')
    let isLikedByUser = await Like.findOne(Obj);
    
    if(isLikedByUser){
      console.log(isLikedByUser,"is liked by user")
      if(likeStatus){
        console.log(likeStatus,'likeStatus')
        isLikedByUser.type = likeStatus;
        await isLikedByUser.save();
      }
      else{
        await Like.deleteOne(Obj);
      }
    }
    else{
      console.log(likeStatus)
      let likedByUser = new Like({...Obj, type:likeStatus});
      await likedByUser.save();
    }
    console.log(isLikedByUser, Obj);

    res.json(`user ${likeStatus === 'like' ? 'liked' : "disliked"} the ${commentId ? 'comment' : 'video'}`);
  }
  catch(error){
    console.log(error);
    res.status(500).json(error.message)
  }
}

const getHomePageVideo = async(req, res) =>{

  try{

    let [trending, recommended, featured, shorts] = await Promise.all([
      Video.find({videoType: {$ne:"shorts"}}).sort({viewCount: -1}).limit(5).populate('user'),
      Video.find({videoType: {$ne:"shorts"}}).populate('user'),
      Video.find({videoType: {$ne:"shorts"}}).sort({createdAt: 1}).limit(5).populate('user'),
      Video.find({videoType: "shorts"}).sort({createdAt: 1}).limit(5).populate('user'),
      
    ])
    res.json({trending, recommended, featured, shorts});
  }
  catch(error){

    console.log(error)
    res.status(500).json(error.message)
  }
}

const updateViewStatus = async(req, res) =>{

  try{
    let {userId ,videoId} = req.params;
    console.log(userId, videoId)
    let {duration} = req.body
    const updatedStatus = await Views.findOneAndUpdate({video: videoId, user: userId}, {$set:{duration}})
    console.log(updatedStatus,"updated status")
    res.json(updatedStatus)
  }
  catch(error){
    console.log(error);
    res.status(500).json(error.message)
  }
}

  

module.exports = {
    uploadVideo,
    getVideos,
    getSingleVideo,
    postComment,
    getCommentByVideo,
    getRecommendedVideo,
    changeLikeStatus,
    getHomePageVideo,
    updateViewStatus
}