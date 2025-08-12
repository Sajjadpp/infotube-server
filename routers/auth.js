const express = require('express')
const auth = express.Router()
const { googleLogin, refreshhWeb, updateUser } = require('../controllers/public/authController');
const { protect } = require('../middlewares/public');



auth.get("/refresh", refreshhWeb) // for generating new access token
auth.post('/google', googleLogin); // routes only for the google login.
auth.put('/user', protect ,updateUser) // for updating the user'






module.exports = auth