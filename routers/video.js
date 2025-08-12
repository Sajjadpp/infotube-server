const express = require('express');
const { protect } = require('../middlewares/public');
const upload = require('../service/uploads');
const { uploadVideo, getVideos, getHomePageVideo, getRecommendedVideo , getSingleVideo, postComment, getCommentByVideo, changeLikeStatus, updateViewStatus } = require('../controllers/public/video.controller');
const { getSearchSuggestions, getSearchResults } = require('../controllers/public/search.controller');
const { trackView } = require('../middlewares/trackViews');
const video = express.Router();



video.post('/upload', protect, upload, uploadVideo);
video.get('/', getVideos)
video.get('/homepage', getHomePageVideo)
video.get('/:id/', trackView, getSingleVideo)
video.put('/view/:videoId/:userId', updateViewStatus)
video.post('/comment', protect, postComment)
video.get('/comments/:videoId', getCommentByVideo)
video.get('/recommended/:videoId', getRecommendedVideo)
video.get('/search/suggestions', getSearchSuggestions)
video.get('/search/result', getSearchResults);
video.put('/like/:videoId', changeLikeStatus);



module.exports = video;