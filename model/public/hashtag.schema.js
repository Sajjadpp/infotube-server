const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const HashtagSchema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    maxlength: 50
  },
  usageCount: {
    type: Number,
    default: 1
  },
  videos: [{
    type: Schema.Types.ObjectId,
    ref: 'Video'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Hashtag = mongoose.model('Hashtag', HashtagSchema);
module.exports = Hashtag;