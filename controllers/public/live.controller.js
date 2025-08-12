const uuidv4 = require('uuidv4')

exports.startLive = async(req, res) =>{

    const streamId = uuidv4();
    state.streams.set(streamId, {
        router: await createRouter(),
        transports: new Map(),
        producers: new Map()
    });
    res.json({ streamId });
}

exports.endLive = async(req, res) =>{

}