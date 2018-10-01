const micro = require('micro')
const { router, get, post, put } = require('microrouter')
const fs = require('fs')
const path = require('path')
const NodeWebcam = require("node-webcam")
const { promisify } = require('util');
const io = require('socket.io-client')
const TEMP_FILE_NAME = 'temp'

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
const socket = io(process.env.SOCKET_HOST || 'http://localhost:4000', {
  query: {
    token: process.env.SECRET,
    cam: 'test-camera'
  }
})

socket.on('event', async (data) => {
  try {
    console.log('onEvent: ', data)
    const buffer = await capture(TEMP_FILE_NAME, opts)
    socket.emit('event', { buffer, chatId: data.chatId })
  } catch (e) {
    console.log("capture error", e)
  }
})
socket.on('connect', () => {
  console.log('onConnect')
})
socket.on('disconnect', () => {
  console.log('onDisconnect')
})
const html = fs.readFileSync(path.join(__dirname, 'main.html'))
const server = micro(router(
  get('/', async (req, res) => {
    console.log('Serving index.html')
    res.end(html)
  }),
  get(`/${TEMP_FILE_NAME}.jpg`, async (req, res) => {
    console.log('Serving jpeg')
    const jpeg = fs.readFileSync(path.join(__dirname, `${TEMP_FILE_NAME}.jpg`))
    res.end(jpeg)
  }),
  post('/refresh', async (req, res) => {
    try {
      await capture('temp', opts)
      micro.send(res, 200, { status: 'ok' });
    } catch (e) {
      console.error('refresh error: ', e)
      micro.send(res, 400, { error: e })
    }
  })))

server.listen(process.env.PORT || 3003)
