const jwt = require("jsonwebtoken") 

const generateAccessToken =(userData)=>{

    try{
        
        return jwt.sign({...userData}, process.env.JWT_SECRET, {
            expiresIn: "15m"
        })
        
    }
    catch(err){
        console.log(err)
        return 
    }
}

const generateRefreshToken = (userData) =>{

    try{
        return jwt.sign({...userData}, process.env.JWT_SECRET,{
            expiresIn: '7d'
        })
    }
    catch(error){
        console.log(error); 
        return 
    }
}

const verifyToken = (token) => {
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log(decoded)
        return decoded.user; // assuming your payload is { user: ... }
    } catch (err) {
        console.log("JWT Error:", err.message);
        return null;
    }
}

module.exports={

    generateAccessToken,
    generateRefreshToken,
    verifyToken
}