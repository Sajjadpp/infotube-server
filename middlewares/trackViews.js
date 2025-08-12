const mongoose = require('mongoose');
const Video = require('../model/public/video.schema')
const Views = require('../model/public/views.schema')

const trackView = async (req, res, next) => {
    try {
        const videoId = req.params.id;
        let { userId } = req.query;

        if (!videoId) {
            console.log('Invalid video ID format');
            return next();
        }

        const video = await Video.findById(videoId, { videoType: 1 }).lean();
        if (!video) {
            console.log('Video not found');
            return next();
        }
        console.log(userId, 'userId')
        if (userId && !mongoose.Types.ObjectId.isValid(userId)) {
            console.log('Invalid user ID format');
            userId = null;
        }

        const viewFilter = { video: videoId };
        if (userId) viewFilter.user = userId;

        const existingView = await Views.findOne(viewFilter);
        
        if (!existingView) {
            const newView = {
                video: videoId,
                device: getDeviceType(req),
                location: getLocationData(req),
                isShort: video.videoType === "shorts"
            };

            if (userId) newView.user = userId;

            await Views.create(newView);
            await updateViewCount(videoId);
        }

        next();
    } catch (err) {
        console.error('View tracking failed:', err);
        next();
    }
};

async function updateViewCount(videoId) {
    await Video.findByIdAndUpdate(videoId, {
        $inc: { viewCount: 1 }
    });
}

function getDeviceType(req) {
    const ua = req.headers['user-agent'];
    if (/mobile/i.test(ua)) return 'mobile';
    if (/tablet/i.test(ua)) return 'tablet';
    if (/smart-tv|smarttv|tv/i.test(ua)) return 'smarttv';
    return 'desktop';
}

function getLocationData(req) {
    return {
        ipAddress: req.ip,
        country: req.headers['cf-ipcountry'] || null,
        region: null,
        city: null
    };
}

module.exports = {
    trackView
};