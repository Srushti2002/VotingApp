const express = require('express');
const router = express.Router();

const User = require('../models/user');
const Candidate = require('../models/candidate');
const { jwtAuthMiddleware, generateToken } = require('../jwt');

//Check admin role
const checkAdminRole = async (userID) => {
    try{
        const user = await User.findById(userID);
        if(user.role === 'admin'){
            return true;
        }
    }
    catch(err) {
        return false;
    }
}
//Get the List of candidates
router.get('/', jwtAuthMiddleware, async(req, res) => {
    try{
        const data = await Candidate.find({}, 'name party -_id');
        console.log('data fetched');
        res.status(200).json(data);
    }
    catch(err){
        console.log(err);
        res.status(500).json({error : 'Internal server error'});
    }
})

//POST - create a new candidate
router.post('/', jwtAuthMiddleware, async (req, res) => {
    try{
        if(!checkAdminRole(req.user.id)){
            return res.status(403).json({message: 'user does not have admin role'});
        }

        const data = req.body; //Asuming the request body contains candidates data
        const newCandidate = new Candidate(data);

        const response = await newCandidate.save();
        console.log('data saved');
        res.status(200).json({response: response});
    }
    catch(err) {
        console.log(err);
        res.status(500).json({error: 'Internal Server Error'});
    }
})

//PUT - Update the existing candidate
router.put('/:candidateID', jwtAuthMiddleware, async(req, res) => {
    try{
        if(!checkAdminRole(req.user.id)) {
            return res.status(403).json({message: 'user does not have admin role'});
        }
        const candidateID = req.params.candidateID;
        const updatedCandidateData = req.body;

        const response = await Candidate.findByIdAndUpdate(candidateID, updatedCandidateData, {
            new: true,
            runValidators: true,
        })

        if(!response) {
            return res.status(404).json({error: 'Person not found'});
        }

        console.log("Data updated");
        res.status(200).json(response);
    }

    catch(err) {
        console.log(err);
        re.status(500).json({error: 'Internal Server Error'});
    }
})

//DELETE the existing candidate 
router.delete('/:candidateID', jwtAuthMiddleware, async (req, res) => {
    
    try{
        if(!checkAdminRole(req.user.id))
            return res.status(403).json({message: 'user does not have admin role'});

        const candidateID = req.params.candidateID; //Extract the id from URL parameter 

        const response = await Candidate.findByIdAndDelete(candidateID);

        if(!response) {
            return res.status(404).json({error: 'Caniddate not found'});
        }

        console.log('Candidate deleted');
        res.status(200).json(response);
            
    }
    catch(err) {
        console.log(err);
        res.status(500).json({error: 'Internal Server Error'});
    }
})

//Lets start voting
router.post('/vote/:candidateID', jwtAuthMiddleware, async (req, res) => {
    //no admin can vote
    //no user can vote twice
    
    const candidateID = req.params.candidateID;
    const userId = req.user.id;

    try{
        //Find the candidate document with specific candidateID
        const candidate = await Candidate.findById(candidateID);
     
        if(!candidate){
            return res.status(404).json({message : 'Candidate not found'})
        }

        const user = await User.findById(userId);
        if(!user) {
            return res.status(404).json({message : 'User not found'})
        }

        if(user.role === 'admin') {
            return res.status(403).json({message : 'User is not allowed'})
        }

        if(user.isVoted){
            return res.status(400).json({message : 'You have already voted'});
        }

        //Update the candidate documrnt to record the vote
        candidate.votes.push({user: userId});
        candidate.voteCount++;
        
        await candidate.save();

        user.isVoted = true;
        await user.save();

        return res.status(200).json({message: 'Vote recorded successfully'});
    }

    catch(err) {
        console.log(err);
        return res.status(500).json({error: 'Internal Server Error'});
    }
})

//Get the count of vote
router.get('/vote/count', async (req, res) => {
    try {
        //Find all candidates and sort them by voteCount in descending order
        const candidate = await Candidate.find().sort({voteCount : 'desc'});

        //Map the candidates to only return their name and voteCount
        const voteRecord = candidate.map((data) => {
            return {
                party: data.party,
                count: data.voteCount
            }
        });

        return res.status(200).json(voteRecord);
    }
    catch(err) {
        console.log(err);
        res.status(500).json({error : 'Internal Server Error'})
    }
})

module.exports = router;