const express = require('express');
const router = express.Router();

const User = require('./../models/user');
const {jwtAuthMiddleware, generateToken} = require('./../jwt');

//POST the user Data - signup
router.post('/signup', async (req, res) => {
    try{
        const data = req.body;

        //Check if there is already an already an admin user
        const adminUser = await User.findOne({role: 'admin'});
        if (data.role === 'admin' && adminUser) {
            return res.status(400).json({error: 'Admin user already exist'})
        }

        //Validate Adhar Card Number must have exactly 12 digits
        if(!/^\d{12}$/.test(data.aadharCardNumber)) {
            return res.status(400).json({error: 'Adhar Card Number must be exactly 12 digits'})
        }

        //Check if a user with the same Aadhar Card Number already exists
        const existingUser = await User.findOne({aadharCardNumber: data.aadharCardNumber});
        if(existingUser) {
            return res.status(400).json({error: 'User with the same Aadhar Card Number already exist' });
        }
        const newUser = new User(data);

        const response = await newUser.save();
        console.log('Data saved');

        const payload = {
            id: response.id
        }
        console.log(JSON.stringify(payload));
        const token = generateToken(payload);
        console.log("Token is : ", token);

        res.status(200).json({response: response, token: token});
    }
    catch(err) {
        console.log(err);
        res.status(500).json({error: 'Internal server error'});
    }
})


//login route
router.post('/login', async (req, res) => {
    try{
        //Extract user name and passsword
        const {aadharCardNumber, password} = req.body;

        //Check if Adhaar card number or password from request body
        if(!aadharCardNumber || !password) {
            return res.status(400).json({error: 'Adhar card number and password are required'})
        }

        //Find the user by username
        const user = await User.findOne({aadharCardNumber: aadharCardNumber});

        //Check if the username and password is correct or not
        if(!user || !(await user.comparePassword(password))) {
            return res.status(401).json({error: 'Invalid username or password'});
        }

        //if its correct generate payload
        const payload = {
            id: user.id
        }
        
        //generate token
        const token = generateToken(payload);

        //send response
        res.json(token);
    }

    catch(err){
        console.log(err);
        res.status(500).json({error: 'Internal Server Error'});
    }
})

//Get the profile of the user
router.get('/', jwtAuthMiddleware, async (req, res) => {
    try{
        const userData = req.user;
        console.log("user data : ", userData);

        const userId = userData.id;
        const user = await User.findById(userId);

        res.status(200).json({user});
    }
    catch(err) {
        console.log(err);
        res.status(500).json({error: 'Internal server Error'});
    }
})

//Update the password of user
router.put('/password', jwtAuthMiddleware, async (req, res) => {
    try{
        //extract the user ID from token
        const id = req.user.id;
        //extract the new password and current password from req body
        const {currentPassword, newPassword} = req.body;
        //check if the current password and new password is there or not in re body
        if(!currentPassword || !newPassword) {
            return res.status(400).json({error: 'Both currentPassword and newPassword are required'})
        }
        //find the user by user ID
        const user = await User.findById(id);
        //if user does not exist or password does not match return error
        if(!user || !(await user.comparePassword(currentPassword))) {
            return res.status(401).json({error: 'Invalid current password'})
        }
        //if everything is clear update the password
        user.password = newPassword;
        //Save the new password
        await user.save();

        console.log("password updated");
        res.status(200).json({message: 'Password updated'});
    }
    catch(err) {
        console.log(err);
        res.status(500).json({error: 'Internal server error'});
    }
})

module.exports = router;