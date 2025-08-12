const jwtN = require('../service/JWT')
const jwt = require('jsonwebtoken')

const protect = (req, res, next) =>{

    const authHeader = req.headers.authorization;
    const token = authHeader?.split(" ")[1];
    if (!token) return res.status(401).json({ msg: "Unauthorized" });
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        console.log(decoded)
        req.user = decoded;
        next();
    } catch (err) {
        console.log(err)
        return res.status(403).json({ msg: "Access token expired" });
    }
}


module.exports = {
    protect,

}