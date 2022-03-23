const { setTimeout: delay } = require('timers/promises')
const { Server } = require('./server.js')
const fs = require('fs')

const server = new Server()

server.on('request', async (req, res) => {
  switch (req.url) {
    case '/': {
      fs.createReadStream('index.html').pipe(res)
      break
    }
    case '/sse/': {
      res.writeHead(200, {
        'content-type': 'text/event-stream',
        'connection': 'keep-alive',
        'cache-control': 'no-cache'
      })
      for (let iter = 1; iter <= 5; iter++) {
        res.write(`data: ${JSON.stringify(new Date)}\n\n`)
        await delay(2000)
      }
      res.end()
      break
    }
    default: {
      res.writeHead(200, {
        'content-type': 'text/html'
      })
      for (let iter = 1; iter <= 10; iter++) {
        res.write(`<div>Hello, ${(new Date()).toISOString()}</div>`)
        await delay(1000)
      }
      res.end()
      break
    }
  }
})

function startServer() {
  server.listen(3000, () => {
    console.log(`Server is running on http://localhost:3000`)
  })
}

function closeServer() {
  console.log('Server is attempted to stop')
  server.close(() => console.log('Server closed'))
}

for (const signal of ['SIGTERM', 'SIGINT', 'SIGHUP']) {
  process.on(signal, closeServer)
}

startServer()

setTimeout(() => {
  // closeServer()
}, 1000 * 3)