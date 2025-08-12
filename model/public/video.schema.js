  const mongoose = require('mongoose');
  const Schema = mongoose.Schema;

  const VideoSchema = new Schema({
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100
    },
    videoType:{
      type:String,
      required: true,
      enum:["normal", 'shorts']
    },
    description: {
      type: String,
      trim: true
    },
    thumbnailUrl: {
      type: String,
      required: true
    },
    filePath: {
      type:String,
      required: true
    },
    videoUrl:{
      type: String,
      required: true
    },
    duration: {
      type: Number, // in seconds
      required: true
    },
    size: {
      type: Number, // in bytes
      required: true
    },
    category: {
      type: String,
      required: true,
      enum: ['education', 'entertainment', 'gaming', 'music', 'tech', 'news', 'sports', 'cooking', 'other']
    },
    visibility: {
      type: String,
      enum: ['public', 'unlisted', 'private'],
      default: 'public'
    },
    status: {
      type: String,
      enum: ['processing', 'active', 'blocked'],
      default: 'processing'
    },
    viewCount: {
      type: Number,
      default: 0
    },
    likeCount: {
      type: Number,
      default: 0
    },
    dislikeCount: {
      type: Number,
      default: 0
    },
    hashtags: [{
      type: String,
    }],
    comments: [{
      type: Schema.Types.ObjectId,
      ref: 'Comment'
    }]
  }, {
    timestamps: true
  });

  // Add text index for search functionality
  VideoSchema.index({ 
    title: 'text', 
    description: 'text' 
  });

  VideoSchema.index({ title: 'text', description: 'text' });

  const Video = mongoose.model('Video', VideoSchema);

  module.exports = Video;