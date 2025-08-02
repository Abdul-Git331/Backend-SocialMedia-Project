const jwt = require('jsonwebtoken')

const verifyToken = (req,res,next) => {
    
    if( req.cookies.token == " "){
        return res.send('Please login')
    }

    const data = jwt.verify(req.cookies.token, "dfvkjfkv")
    req.user = data

    return next()

}

module.exports = verifyToken