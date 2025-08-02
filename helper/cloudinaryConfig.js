
const cloudinary = require('cloudinary').v2

cloudinary.config({
    cloud_name: 'di6bf7gn9',
    api_key: '499767674533855',
    api_secret: 'dY8oj5StTMrbVVh-Y0I6wnXrZ44'
  });

  const uploadToCloudinary = async(filePath,folderName) =>{
       return await cloudinary.uploader.upload(filePath,{
        folder: folderName || "default_folder",
        resource_type: "auto"  
       })
  }

module.exports = uploadToCloudinary