const jwt = require('jsonwebtoken');

const jwtAuthMiddleware = (req, res, next) => {
    
    //First check if the request header has authorization or not
    const authorization = req.headers.authorization;
    if(!authorization)
        return res.status(404).json({error: "Token not found"});
    
    //Extract the jwt token from the request header
    const token = req.headers.authorization.split(' ')[1];
    if(!token) 
        return res.status(404).json({error: 'Unauthorized'});

    try{
        //verify the JWT token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        //Attach user information to the request object
        req.user = decoded;
        next()

    }
    catch(err) {
        console.log(err);
        res.status(404).json({error: 'Invalid token'});
    }
}

//Function to generate JWT token 
const generateToken = (userData) => {
    return jwt.sign(userData, process.env.JWT_SECRET);
}

module.exports = {jwtAuthMiddleware, generateToken};