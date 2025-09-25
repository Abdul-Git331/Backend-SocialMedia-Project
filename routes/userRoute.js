const express = require("express");
const userModel = require("../model/userModel");
const postModel = require("../model/postModel");
const reelModel = require("../model/reelModel");
const bcrypt = require("bcryptjs");
const verifyToken = require("../helper/verifyToken");
const jwt = require("jsonwebtoken");
const upload = require("../utils/multerConfig");
const sendMail = require("../helper/mailer");
const uploadToCloudinary = require("../helper/cloudinaryConfig");
const fs = require("fs");
const path = require("path");
const { timeStamp } = require("console");

const userRoute = express.Router();

//register new user

userRoute.get("/", (req, res) => {
  res.render("registerPage");
});

userRoute.post("/", async (req, res) => {
  const { email, userName, password } = req.body;

  const user = await userModel.findOne({ email });

  if (user) {
    return res.send("user already found");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = {
    email,
    userName,
    password: hashedPassword,
  };

  const savedUser = await userModel.create(newUser);

  const msg = `Hello <strong>${userName}</strong> please verify your mail<br><a href='/verify-mail'>Click to verify</a>`;

  sendMail(email, "Mail Verification", msg);

  res.redirect("/login");
});

// API for uplaod picture

userRoute.get("/register/uploadpic", async (req, res) => {
  res.render("uploadpic");
});

userRoute.post(
  "/uploadpic",
  verifyToken,
  upload.single("profilepic"),
  async (req, res) => {
    const { userId, email } = req.user;

    const user = await userModel.findOne({ _id: userId });

    const uploadedProfilepic = await uploadToCloudinary(
      req.file.path,
      "default_folder"
    );

    user.profilepic = uploadedProfilepic.url;

    user.save();

    fs.unlinkSync(req.file.path);

    res.redirect("/profile");
  }
);

//login api

userRoute.get("/login", (req, res) => {
  res.render("loginPage");
});

userRoute.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const user = await userModel.findOne({ email });

  if (!user) {
    return res.send("email or password is incorrect");
  }

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    return res.send("email or password is incorrect");
  }

  const token = jwt.sign({ email: email, userId: user._id }, "dfvkjfkv");

  res.cookie("token", token);

  res.redirect("/profile");
});

//Logout api

userRoute.get("/logout", verifyToken, (req, res) => {
  res.cookie("token", " ");
  res.redirect("/login");
});

//Api for Profile and Create Post

userRoute.get("/profile", verifyToken, async (req, res) => {
  const { email, userId } = req.user;

  const user = await userModel.findOne({ _id: userId }).populate("post");
  // .populate({
  //   path: 'friends',
  //   select: 'post userName',
  //   populate: {
  //     path: 'post',
  //     select: 'content date likes'
  //   }
  // });

  const page = parseInt(req.query.page) || 1;
  const limit = 3;
  const skip = (page - 1) * limit;

  const posts = await postModel
    .find({ user: { $in: user.friends } })
    .sort({ date: -1 })
    .skip(skip)
    .limit(limit)
    .populate({ path: "user", select: "userName profilepic" });

  const totalPost = await postModel
    .find({ user: { $in: user.friends } })
    .countDocuments();
  const totalPage = Math.ceil(totalPost / limit);

  const excludedId = [
    userId,
    ...user.friends,
    ...user.sent_friend_request,
    ...user.recieved_friend_request,
  ];

  const suggestions = await userModel
    .find({ _id: { $nin: excludedId } })
    .select("-password");

  res.render("profilePage", { user, suggestions, posts, totalPage });
});

userRoute.post("/something-in-mind", verifyToken, async (req, res) => {
  const { email, userId } = req.user;

  const user = await userModel.findOne({ _id: userId });

  const { content } = req.body;

  const newPost = {
    content,
    user: userId,
  };

  const postCreated = await postModel.create(newPost);

  user.post.unshift(postCreated._id);
  await user.save();

  res.redirect("/profile");
});

//API forn new Post

userRoute.get("/create-post", verifyToken, async (req, res) => {
  res.render("createPost");
});

userRoute.post(
  "/create-post",
  verifyToken,
  upload.single("file"),
  async (req, res) => {
    const { userId } = req.user;
    const { content, title } = req.body;

    let newPost = {};

    if (req.file !== undefined) {
      const fileMime = req.file.mimetype;

      const folder = fileMime.startsWith("video") ? "video" : "image";

      const cloudinaryRes = await uploadToCloudinary(req.file.path, folder);

      newPost = {
        user: userId,
        content: content,
        title: title,
        postImage: fileMime.startsWith("image") ? cloudinaryRes.url : undefined,
        postVideo: fileMime.startsWith("video") ? cloudinaryRes.url : undefined,
      };
    } else {
      newPost = {
        user: userId,
        content: content,
        title: title,
      };
    }

    const savedPost = await postModel.create(newPost);

    const user = await userModel.findOne({ _id: userId });

    await user.post.unshift(savedPost._id);

    const savedUser = await user.save();

    if (req.file !== undefined) {
      fs.unlinkSync(req.file.path);
    }

    res.redirect('/view-user-profile')
  }

   
);

//Api for view your profile

userRoute.get("/view-user-profile", verifyToken, async (req, res) => {
  const { userId, email } = req.user;

  const user = await userModel.findOne({ _id: userId }).populate("post");

  res.render("viewUserProfile", { user });
});

//Api for like

userRoute.get("/like", verifyToken, async (req, res) => {
  const { id } = req.query;
  const { email, userId } = req.user;

  const post = await postModel.findOne({ _id: id }).populate("user");

  const userFound = post.likes.indexOf(userId);

  if (userFound === -1) {
    post.likes.push(userId);
  } else {
    post.likes.splice(userFound, 1);
  }

  post.save();

  return res.redirect("/profile");
});

//Api for comment

userRoute.get("/comment", verifyToken, async (req, res) => {
  const postId = req.query.postid;
  const { userId } = req.user;

  const post = await postModel
    .findOne({ _id: postId })
    .populate({
      path: "comment",
      select: "cmtContent user",
      populate: { path: "user", select: "userName" },
    });

  res.render("commentPage", { postId, userId, post });
});

userRoute.post("/comment", verifyToken, async (req, res) => {
  const postId = req.query.postid;
  const { userId } = req.user;
  const { cmtContent } = req.body;

  const post = await postModel.findOne({ _id: postId });

  if (cmtContent !== "") {
    post.comment.unshift({ user: userId, cmtContent: cmtContent });

    post.save();

    return res.redirect("/profile");
  }
});

//Friend request handling

userRoute.get("/send-friend-request", verifyToken, async (req, res) => {
  const { email, userId } = req.user;
  const friendId = req.query.friendId;

  const sender = await userModel.findOne({ _id: userId });

  const reciever = await userModel.findOne({ _id: friendId });

  if (sender.sent_friend_request.includes(friendId)) {
    return res.send("Already sent a request");
  }

  sender.sent_friend_request.unshift(reciever._id);
  reciever.recieved_friend_request.unshift(sender._id);

  await sender.save();
  await reciever.save();

  const msg = `Hello ${reciever.userName}, you have recieved a friend request from ${sender.userName} `;

  sendMail(reciever.email, "Friend request recieved", msg);

  res.redirect("/profile");
});

//Api for view friend request

userRoute.get("/view-friend-request", verifyToken, async (req, res) => {
  const { email, userId } = req.user;

  const user = await userModel
    .findOne({ _id: userId })
    .populate("recieved_friend_request");

  res.render("friendRequestPage", { user });
});

// Api for accept-friend-request/

userRoute.get("/accept-friend-request", verifyToken, async (req, res) => {
  const { email, userId } = req.user;
  const friendId = req.query.friendId;

  const reciever = await userModel.findOne({ _id: userId });
  const sender = await userModel.findOne({ _id: friendId });

  sender.friends.unshift(reciever._id);
  reciever.friends.unshift(sender._id);

  sender.sent_friend_request.shift(reciever._id);
  reciever.recieved_friend_request.shift(sender._id);

  await sender.save();
  await reciever.save();

  res.redirect("/profile");
});

//Api for view friend list

userRoute.get("/friend-list", verifyToken, async (req, res) => {
  const { email, userId } = req.user;

  const user = await userModel.findOne({ _id: userId }).populate("friends");

  res.render("viewFriend", { user });
});

//Api for view friend's profile

userRoute.get("/view-friend-profile", verifyToken, async (req, res) => {
  const friendId = req.query.friendId;
  const { userId } = req.user;

  const friend = await userModel
    .findOne({ _id: friendId })
    .populate("post")
    .select("-_id");

  res.render("friendProfile", { friend, userId });
});


//Api for creating reels

userRoute.get("/create-reel", verifyToken, (req, res) => {
  const { userId } = req.user;

  res.render("createReel", { userId });
});

userRoute.post("/create-reel",upload.single("file"),verifyToken,async (req, res) => {
    const { userId } = req.user;
    const { content } = req.body;
    const mimeType = req.file.mimetype;

    const user = await userModel.findOne({ _id: userId });

    if (!mimeType.startsWith("video")) {
      alert("Please upload valid media type");
    }

    const cloudinaryRes = await uploadToCloudinary(req.file.path, "reel_Store");

    const newReel = {
      author: userId,
      content: content,
      reelMedia: cloudinaryRes.url,
    };

    const savedReel = await reelModel.create(newReel);

    user.reel.unshift(savedReel._id);

    await user.save();

    fs.unlinkSync(req.file.path);
  }
);

//Api for watching reels

userRoute.get("/reels", verifyToken, async (req, res) => {
  const { userId } = req.user;

  const user = await userModel.findOne({ _id: userId });
  // .populate({
  //   path: 'friends',
  //   select: 'reel',
  //   populate: {
  //     path: 'reel',
  //   }
  // });

  const page = parseInt(req.query.page) || 1;
  const limit = 1;
  const skip = (page - 1) * 1;

  const reels = await reelModel
    .find({ author: { $in: user.friends } })
    .sort({ timeStamp: -1 })
    .limit(limit)
    .skip(skip);

  const totalReels = await reelModel
    .find({ author: { $in: user.friends } })
    .countDocuments();
  const totalPages = totalReels / limit;

  res.render("reel", {
    reels,
  });
});

//Demo ------------------------------------------------------------------------------------------

userRoute.get("/view-post", verifyToken, async (req, res) => {
  const { userId } = req.user;

  const user = await userModel.findOne({ _id: userId }).populate("post");

  res.render("post", { user });
});

module.exports = userRoute;
