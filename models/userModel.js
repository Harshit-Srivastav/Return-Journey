const mongoose = require('mongoose')
const validator = require('validator')
const bcrypt = require('bcryptjs')

const userSchema = mongoose.Schema({
    name: {
        type: String,
        required: true
    }, 
    email: {
        type: String,
        required: true,
        unique: true,
        validate(value){
            if(!validator.isEmail(value)){
                throw new Error('Email is not valid')
            }
        }
    },
    password: {
        type: String,
        required: true,
    }, 
    mobile: {
        type: Number,
        required: true,
        unique: true,
        validate(value) {
            if(validator.isMobilePhone(value.toString(), 'any', { strictMode: false })){
                if (value.toString().replace(/\D/g, '').length >= 10) {
                    return true;
                  } else {
                    throw new Error('Number not valid')
                }
            } 
        }
    },
    ip: {
        type: String,
        required: true
    }
}, {
    timestamps: true
})

const User = mongoose.model('User', userSchema)



module.exports = User