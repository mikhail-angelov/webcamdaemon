const NodeWebcam = require("node-webcam")
const { promisify } = require('util');
const io = require('socket.io-client')
console.log('-', process.env)

const opts = {
  width: 640,
  height: 480,
  quality: 100,
  delay: 0,
  output: "jpeg",
  device: false, //default
  callbackReturn: "base64", //base64
  verbose: false
}
const capture = promisify(NodeWebcam.capture)
const socket = io(process.env.SOCKET_HOST || 'http://localhost:3000',{
  query: process.env.SECRET
})

socket.on('event',async (data)=>{
  try{
    const buffer = await capture('temp', opts)
    socket.emit('cam', { buffer })
  }catch(e){
    console.log("capture error", e)
  }
})
