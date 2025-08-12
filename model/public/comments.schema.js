  const mongoose = require('mongoose');
  const Schema = mongoose.Schema;

  const CommentSchema = new Schema({
    video: {
      type: Schema.Types.ObjectId,
      ref: 'Video',
      required: true
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    content: {
      type: String,
      required: true,
      trim: true
    },
    parentComment: {
      type: Schema.Types.ObjectId,
      ref: 'Comment',
      default: null
    },
    likeCount: {
      type: Number,
      default: 0
    },
    dislikeCount: {
      type: Number,
      default: 0
    },
    replies: [{
      type: Schema.Types.ObjectId,
      ref: 'Comment'
    }]
  }, {
    timestamps: true
  });

  const Comment = mongoose.model('Comment', CommentSchema);
  module.exports = Comment;