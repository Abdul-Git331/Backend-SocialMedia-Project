const mongoose = require('mongoose')

const reelSchema = mongoose.Schema({
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
    },
    content:{
        type: String,   
    },
    timeStamp: {
        type: Date,
        default: Date.now,
    },
    likes:[
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'user'
        }
    ],
    reelMedia: {
        type: String,
        require: true,
    },
    tags:[
        {
            type: String,
        }
    ]
})

module.exports = mongoose.model('reel', reelSchema)