require('dotenv').config(); 
const express = require('express')
const cookieParser = require('cookie-parser')
const userRoute = require('./routes/userRoute')
const path = require('path')
const http = require('http')
const {Server} = require('socket.io')

const app = express()

const server = http.createServer(app)

const io = new Server(server)

app.set('view engine', 'ejs')

app.use(express.json())
app.use(express.urlencoded())
app.use(express.static(path.join(__dirname,'public')))
app.use(cookieParser())

app.use('/',userRoute)

server.listen(process.env.PORT)