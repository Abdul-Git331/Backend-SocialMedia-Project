const multer = require('multer')
const path = require('path')
const crypto = require('crypto')

const storage = multer.diskStorage({
    destination: function(req,file,cb){
       cb(null, './public/images')
    },
    filename: function(req,file,cb){
       crypto.randomBytes(12, (error,bytes) =>{
        const fn = bytes.toString("Hex") + path.extname(file.originalname)
        cb(null,fn)
       })
    }
})

const upload = multer({storage: storage})

module.exports = upload