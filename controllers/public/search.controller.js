const Video = require('../../model/public/video.schema');
const Channel = require('../../model/public/user');
const User = require('../../model/public/user')

// Search suggestions (autocomplete)
exports.getSearchSuggestions = async (req, res) => {
    try {
      const { q } = req.query;
      
      if (!q || q.length < 2) {
        return res.json([]);
      }
  
      // Create case-insensitive regex pattern
      const regex = new RegExp(q, 'i');
  
      // Search videos and channels in parallel
      const [videoResults, channelResults] = await Promise.all([
        Video.find(
          { title: regex },
          { title: 1 }
        ).limit(5),
        
        User.find(
          { username: regex },
          { username: 1 }
        ).limit(5)
      ]);
  
      // Format results
      const suggestions = [
        ...videoResults.map(v => ({ type: 'video', title: v.title })),
        ...channelResults.map(c => ({ type: 'channel', title: c.username }))
      ];
      console.log(suggestions,'s')
      res.json(suggestions.slice(0, 8));
    } catch (error) {
      console.error('Search suggestion error:', error);
      res.status(500).json({ error: 'Failed to get search suggestions' });
    }
};
exports.getSearchResults = async (req, res) => {
  try {
      const { q, type } = req.query;
      
      if (!q) {
          return res.status(400).json({ 
              success: false,
              message: 'Search query is required' 
          });
      }

      // Channel-specific search
      if (type === 'channel') {
          const channels = await User.aggregate([
              {
                  $match: {
                      $or: [
                          { username: { $regex: q, $options: 'i' } },
                          { channelName: { $regex: q, $options: 'i' } }
                      ]
                  }
              },
              {
                  $project: {
                      _id: 1,
                      username: 1,
                      channelName: 1,
                      profileImage: 1,
                      subscribersCount: 1,
                      type: { $literal: 'channel' }
                  }
              },
              { $limit: 20 }
          ]);

          return res.status(200).json({
              success: true,
              count: channels.length,
              data: channels
          });
      }

      // Video-specific search
      if (type === 'video') {
          const videos = await Video.aggregate([
              {
                  $match: {
                      $or: [
                          { title: { $regex: q, $options: 'i' } },
                          { description: { $regex: q, $options: 'i' } },
                          { hashtags: { $in: [new RegExp(q, 'i')] } }
                      ]
                  }
              },
              {
                  $lookup: {
                      from: 'users',
                      localField: 'user',
                      foreignField: '_id',
                      as: 'channel'
                  }
              },
              { $unwind: '$channel' },
              {
                  $addFields: {
                      // Calculate relevance score
                      score: {
                          $sum: [
                              { $cond: [{ $regexMatch: { input: "$title", regex: q, options: "i" } }, 3, 0] },
                              { $cond: [{ $regexMatch: { input: "$description", regex: q, options: "i" } }, 2, 0] },
                              { $cond: [{ $in: [new RegExp(q, 'i'), "$hashtags"] }, 1, 0] }
                          ]
                      }
                  }
              },
              {
                  $project: {
                      _id: 1,
                      title: 1,
                      thumbnailUrl: 1,
                      viewCount: 1,
                      duration: 1,
                      createdAt: 1,
                      score: 1,
                      type: { $literal: 'video' },
                      'channel._id': 1,
                      'channel.username': 1,
                      'channel.profileImage': 1,
                      'channel.channelName': 1
                  }
              },
              { $sort: { score: -1, viewCount: -1 } },
              { $limit: 20 }
          ]);

          return res.status(200).json({
              success: true,
              count: videos.length,
              data: videos
          });
      }

      // Combined search (videos + channels when no type specified)
      const [videos, channels] = await Promise.all([
        // Video search with hashtag support
        Video.aggregate([
          {
            $match: {
              $or: [
                { title: { $regex: q, $options: 'i' } },
                { description: { $regex: q, $options: 'i' } },
                { hashtags: { $in: [new RegExp(q, 'i')] } }
              ]
            }
          },
          {
            $lookup: {
              from: 'users',
              localField: 'user',
              foreignField: '_id',
              as: 'channel'
            }
          },
          { $unwind: '$channel' },
          {
            $addFields: {
              score: {
                $sum: [
                  { $cond: [{ $regexMatch: { input: "$title", regex: q, options: "i" } }, 3, 0] },
                  { $cond: [{ $regexMatch: { input: "$description", regex: q, options: "i" } }, 2, 0] },
                  { $cond: [{ $in: [new RegExp(q, 'i'), "$hashtags"] }, 1, 0] }
                ]
              }
            }
          },
          {
            $project: {
              _id: 1,
              title: 1,
              thumbnailUrl: 1,
              viewCount: 1,
              duration: 1,
              createdAt: 1,
              score: 1,
              type: { $literal: 'video' },
              'channel._id': 1,
              'channel.username': 1,
              'channel.profileImage': 1,
              'channel.channelName': 1
            }
          },
          { $sort: { score: -1, viewCount: -1 } },
          { $limit: 10 }
        ]),
        
        // Channel search
        User.aggregate([
          {
            $match: {
              $or: [
                { username: { $regex: q, $options: 'i' } },
                { channelName: { $regex: q, $options: 'i' } }
              ]
            }
          },
          {
            $addFields: {
              score: {
                $sum: [
                  { $cond: [{ $regexMatch: { input: "$channelName", regex: q, options: "i" } }, 3, 0] },
                  { $cond: [{ $regexMatch: { input: "$username", regex: q, options: "i" } }, 2, 0] }
                ]
              }
            }
          },
          {
            $project: {
              _id: 1,
              username: 1,
              channelName: 1,
              profileImage: 1,
              subscribersCount: 1,
              score: 1,
              type: { $literal: 'channel' }
            }
          },
          { $sort: { score: -1, subscribersCount: -1 } },
          { $limit: 10 }
        ])
      ]);

      // Combine and sort by relevance
      const results = [...videos, ...channels]
          .sort((a, b) => b.score - a.score || 
              (b.type === 'channel' ? b.subscribersCount : b.viewCount) - 
              (a.type === 'channel' ? a.subscribersCount : a.viewCount));

      res.status(200).json({
          success: true,
          count: results.length,
          data: results.slice(0, 20) // Return top 20 results
      });

  } catch (error) {
      console.error('Search error:', error);
      res.status(500).json({
          success: false,
          message: 'Server error during search'
      });
  } 
};