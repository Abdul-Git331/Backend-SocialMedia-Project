const mongoose = require("mongoose");

mongoose.connect(process.env.URI).then(() => console.log("MongoDB connected"));

const userSchema = mongoose.Schema({
  userName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  post: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "post",
    },
  ],
  reel: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "reel",
    },
  ],
  password: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  profilepic: {
    type: String,
    default: "default.png",
  },
  friends: [
    {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
    }

  ],
  sent_friend_request:[
    {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
      },
  ],
  recieved_friend_request:[
    {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
      },
  ],
  is_Verified: {
    type: String,
    default: 0,
  }
});

module.exports = mongoose.model("user", userSchema);
