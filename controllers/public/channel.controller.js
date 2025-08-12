const Video = require('../../model/public/video.schema')
const View = require('../../model/public/views.schema')
const Channel = require('../../model/public/user')
const Subscription = require('../../model/public/subscribtion.schema')
const mongoose = require("mongoose")
const Notifications = require('../../model/public/notification.schema')
const User = require('../../model/public/user')

exports.getChannelInfo = async (req, res) => {
  try {
    const { channelId, userId } = req.params;
    
    // Validate channelId
    if (!mongoose.Types.ObjectId.isValid(channelId)) {
      return res.status(400).json({ error: 'Invalid channel ID' });
    }

    const channel = await Channel.findById(channelId);
    if (!channel) {
      return res.status(404).json({ error: 'Channel not found' });
    }

    // Get video count
    const videoCount = await Video.countDocuments({ user: channel._id });

    // Get total views
    const viewCountResult = await Video.aggregate([
      {
        $match: { user: channel._id }
      },
      {
        $group: {
          _id: null,
          viewCount: { $sum: "$viewCount" }
        }
      }
    ]);

    // Handle subscription status
    let subscriptionStatus = false;
    if (userId && userId !== 'undefined' && mongoose.Types.ObjectId.isValid(userId)) {
      
      subscriptionStatus = await Subscription.exists({
        subscriber: userId,
        channel: channel._id
      });
      console.log(subscriptionStatus, 'subscription stataus')

    }

    const result = {
      ...channel._doc,
      videoCount,
      totalViews: viewCountResult[0]?.viewCount || 0,
      subscriptionStatus: Boolean(subscriptionStatus) // Convert to boolean
    };

    
    res.json(result);
  } catch (error) {

    console.error('Error in getChannelInfo:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getChannelVideos = async(req, res) =>{

  try{
    let {channelId} = req.params;
    let {category, page} = req.query
    let skip = (page-1)*20
    console.log(skip, page)
    let result = []

    if(category === 'Latest'){
      console.log('inned')
      let videos = await Video.find({user: channelId}).sort({createdAt:1}).skip(skip);
      result.push(...videos);
    }
    else if(category === 'Popular'){
      let videos = await Video.find({user: channelId}).sort({viewCount:-1}).skip(skip); 
      result.push(...videos);
    }
    else{
      let videos = await Video.find({user: channelId}).sort({createdAt:-1}).skip(skip);
      result.push(...videos);
    }
    res.json(result)
  }
  catch(error){
    console.log(error)
    res.status(500).json(error.message)
  }
}
exports.postSubscribers = async (req, res) => {
  try {
    const { userId, channelId, subscribtionStatus } = req.body;
    console.log("coming here")
    // Validate inputs
    if (!userId) return res.status(400).json('User ID required');
    if (!channelId) return res.status(400).json('Channel ID required');

    if (subscribtionStatus) { // UNSUBSCRIBE
      // Delete subscription and update channel count
      await Subscription.findOneAndDelete({ subscriber: userId, channel: channelId });
      const updatedChannel = await Channel.findByIdAndUpdate(
        channelId,
        { $inc: { subscribersCount: -1 } },
        { new: true } // Return updated document
      );

      return res.json('Unsubscribed from channel');
    } 
    else { // SUBSCRIBE
      // Create subscription and update channel count
      const sub = new Subscription({ subscriber: userId, channel: channelId });
      const updatedChannel = await Channel.findByIdAndUpdate(
        channelId,
        { $inc: { subscribersCount: 1 } },
        { new: true } // Return updated document
      );
      
      await sub.save();
      
      return res.json(sub);
    }
  } catch (error) {
    console.error("Subscription error:", error);
    res.status(500).json(error.message);
  }
};


exports.getChannelHistory = async (req, res) => {
  try {
    const { userId } = req.params;
    console.log(userId)
    
    const watchHistory = await View.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(userId) }},
      { $sort: { createdAt: -1 } }, // Newest first
      {
        $lookup: {
          from: 'videos',
          localField: 'video',
          foreignField: '_id',
          as: 'video'
        }
      },
      { $unwind: '$video' },
      {
        $lookup: {
          from: 'users',
          localField: 'video.user',
          foreignField: '_id',
          as: 'channel'
        }
      },
      { $unwind: '$channel' },
      {
        $project: {
          title: '$video.title',
          channel: '$channel.username',
          thumbnail: '$video.thumbnailUrl',
          duration: '$video.duration',
          videoType: '$video.videoType',
          watchedAt: {
            $dateDiff: {
              startDate: '$createdAt',
              endDate: new Date(),
              unit: 'week'
            }
          },
          views: "$video.viewCount", 
          description: '$video.description',
          
        }
      },
      {
        $addFields: {
          watchedAt: { $concat: [{ $toString: '$watchedAt' }, ' weeks ago'] },
          watchedDuration: "$duration",
          id: "$_id"
        }
      }
    ]);
    console.log(watchHistory)
    res.status(200).json(watchHistory);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteVideoFromHistory = async(req, res) =>{

  try{
    
    
    let {id} = req.params;
    let {isFull} = req.query;

    if(isFull === 'true'){
      await View.deleteMany({user: id})
    }
    else{
      await View.deleteOne({_id: id});
    }

    res.json('video deleted from the history');
  }
  catch(error){
    console.log(error);
    res.status(500).json(error);
  }
}


exports.homeVideos = async(req, res) =>{

  let {channelId} = req.params
  console.log(channelId)
  try{
    const featured = await Video.find({user: channelId}).sort({viewVideo : -1}).limit(1);
    const popularVideos = await Video.find({user: channelId}).sort({videoVideo: -1});
    
    res.json({featuredVideo: featured[0], popularVideos});

  }
  catch(error){

    console.log('error', error)
  }
}

exports.getNotifications = async(req, res) =>{

  try{
    console.log('fetching notifications')
    let {userId} = req.params;

    if(!userId) return res.json('user authentication failed');

    const notifications = await Notifications.find({userId});
    console.log(notifications)
    res.json(notifications.reverse());
  }
  catch(error){
    console.log(error, 'error occured')
    res.status(500).json(error.message)
  }
}