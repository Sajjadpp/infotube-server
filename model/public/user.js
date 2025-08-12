const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true
  },
  username: {
    type: String,
    required: [true, "Username is required"],
    unique: true,
    lowercase: true,
    trim: true
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    minlength: 6,
    select: false
  },
  googleId: {
    type: String,
    default: null
  },
  profileImage: {
    type: String,
    default: '',
  },
  coverImage: {
    type: String,
    default: '',
  },
  bio: {
    type: String,
    maxlength: 200,
    default: ''
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  subscribersCount: {
    type: Number,
    default: 0
  },
  subscribedUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  contentPreferences: {
    entertainment: { type: Boolean, default: true },
    education: { type: Boolean, default: true },
    gaming: { type: Boolean, default: false },
    music: { type: Boolean, default: false },
    tech: { type: Boolean, default: false }
  },
  playlists: [{
    name: { type: String, required: true },
    videos: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Video' }],
    createdAt: { type: Date, default: Date.now }
  }],
  likedVideos: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Video'
  }],
  watchHistory: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Video'
  }],
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  refreshToken: {
    type: String,
    default: ''
  }
}, { timestamps: true });



userSchema.index({ username: 'text' });
// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
