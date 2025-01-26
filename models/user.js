const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

//Define the user Schema
const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },

    age: {
        type: String
    },

    email: {
        type: String
    },

    mobile: {
        type: String
    },

    address: {
        type: String,
        required: true
    },

    aadharCardNumber: {
        type: Number,
        required: true,
        unique: true
    },

    password: {
        type: String,
        required: true
    },

    role: {
        type: String,
        enum: ['voter', 'admin'],
        default: 'voter'
    },

    isVoted: {
        type: Boolean,
        default: false
    }
});

userSchema.pre('save', async function(next) {
    const user = this;

    //hash the password only if it has been modifed (or is new)
    if(!user.isModified('password')) return next();

    try {
        //generate salt 
        const salt = await bcrypt.genSalt(10);

        //hash password generation
        const hashedPassword = await bcrypt.hash(user.password, salt);

        //hash the password
        this.password = hashedPassword;
        next();
    }

    catch(err) {
        return next(err);
    }
});

userSchema.methods.comparePassword = async function(candidatePassword) {
    try {
        const isMatch = await bcrypt.compare(candidatePassword, this.password);
        return isMatch;
    }
    catch(err) {
        throw err;
    }
}
const User = mongoose.model('User', userSchema);
module.exports = User;