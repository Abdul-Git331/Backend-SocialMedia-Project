const mongoose = require('mongoose')

const postSchema = mongoose.Schema({
    user :{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
    },
    date:{
        type: Date,
        default: Date.now
    },
    title:{
        type: String
    },
    content: {
        type: String
    },
    likes: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'user'
        }
    ],
    postImage:{
        type: String,
    },
    postVideo:{
        type: String,
    },
    comment:[
        {
            user: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'user',
            },
            cmtContent: String,
        }  
    ]
})

module.exports = mongoose.model('post',postSchema)