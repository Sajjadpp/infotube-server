const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const LikeSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  video: {
    type: Schema.Types.ObjectId,
    ref: 'Video'
  },
  comment: {
    type: Schema.Types.ObjectId,
    ref: 'Comment'
  },
  type: {
    type: String,
    enum: ['like', 'dislike'],
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});



const Like = mongoose.model('Like', LikeSchema);
module.exports = Like;