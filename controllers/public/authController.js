const {OAuth2Client, PassThroughClient} = require('google-auth-library')
const jwt = require('../../service/JWT')
const User = require('../../model/public/user');
const {downloadImageToServer} = require('../../service/imgToServer') 

const client = new OAuth2Client(process.env.GOOGLE_ID)
const googleLogin = async(req, res)=>{
    
    let responseData = {}
    let googleToken = req.body.idToken;
    try{

        const ticket = await client.verifyIdToken({
        idToken: googleToken,
        audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        let localimage = await downloadImageToServer(payload.picture);

        let user = await User.findOne({email: payload.email});

        if(user){
            console.log(payload)
            user.profileImage ??= localimage; // if profile kept that otherways payload
            user.googleId ??= payload.sub
            let refreshToken = await jwt.generateRefreshToken({user: user._id});
            let AccessToken = await jwt.generateAccessToken({user: user._id})   
            await user.save()
            console.log(refreshToken, " refresh token is ready");

            res.cookie('INFO_REFRESH_TOKEN', refreshToken, {
                httpOnly: true,         // 🔐 Prevents client-side JS from accessing the cookie
                secure: false,          // 🔒 Set to `true` in production (with HTTPS)
                sameSite: 'lax',        // 💡 Use 'none' if frontend and backend are on different domains
                maxAge: 1000 * 60 * 60 * 24, // 1 day
                path: '/'   // 👈 Optional but helps scope the cookie
            });

            console.log(user)
            responseData = {...user._doc, AccessToken}
        }
        else{
            let newUser = new User({
                username : payload.name,
                email :payload.email,
                googleId : payload.sub,
                profileImage : localimage,
                isVerified: true
            })
            let refreshToken = await jwt.generateRefreshToken({user: newUser._id});
            newUser.refreshToken = refreshToken;
            await newUser.save()
            let AccessToken = await jwt.generateAccessToken({user: newUser._id})
            res.cookie('INFO_REFRESH_TOKEN', refreshToken, {
                httpOnly: true,         
                secure: true,          
                sameSite: 'None',        
                maxAge: 1000 * 60 * 60 * 24, // 1 day
                path: '/'   // 👈 Optional but helps scope the cookie
            });

            responseData = {...newUser._doc, AccessToken}
        }
        
        res.status(200).json({message: "user logined successfully", user: responseData})
    }
    catch(error){
        console.log("error", error)
        res.status(500).json({message: "server error please try again later"})
    }
};

const refreshhWeb = async(req, res) =>{
    try{
        let refreshToken = req.cookies.INFO_REFRESH_TOKEN;
        console.log('wrokgin', refreshToken)

        if(!refreshToken) return res.status(401).json('DOLOGIN');

        let decoded = jwt.verifyToken(refreshToken);    
        
        let user = await User.findById(decoded);
        
        if(!user){
            console.log('no user exist')
            return res.status(403).json("invalid refresh token")
        }

        let newAccessToken = jwt.generateAccessToken({user: user._id});
        res.json({AccessToken: newAccessToken, user})


    }
    catch(error){
        console.log(error)
        return res.status(403).json('token expired or invalid refreshToken')
    }
}

const updateUser = async (req, res) => {
    try {
      const newUserData = req.body;
      
      if (!newUserData) {
        return res.status(400).json({ message: 'No user data to update' });
      }
  
      const user = await User.findById(newUserData._id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      // Update fields individually
      if (newUserData.name) user.name = newUserData.name;
      if (newUserData.username) user.username = newUserData.username;
      if (newUserData.bio) user.bio = newUserData.bio;
      if (newUserData.profileImage) user.profileImage = newUserData.profileImage;
      if (newUserData.videoReferance) user.videoReferance = newUserData.videoReferance;
      
      // Save the updated user
      const updatedUser = await user.save();
      
      // Return the updated user (excluding sensitive fields)
      const userToReturn = updatedUser.toObject();
      delete userToReturn.password;
      delete userToReturn.refreshToken;
      
      res.json(userToReturn);
    } catch (error) {
      console.error('Update user error:', error);
      res.status(500).json({ message: 'Server error updating user' });
    }
  };




module.exports = {
    googleLogin,
    refreshhWeb,
    updateUser

}