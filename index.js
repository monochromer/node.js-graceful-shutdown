const { setTimeout: delay } = require('timers/promises')
const { Server } = require('./server.js')
const fs = require('fs')

const server = new Server()

server.listen(3000, () => {
  console.log(`Server is running on http://localhost:3000`)
})

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
      await delay(3000)
      res.end(`
        <b>Hello, ${(new Date()).toISOString()}</b>
      `)
      break
    }
  }
})

setTimeout(() => {
  server.close(() => console.log('Server closed'))
}, 1000 * 3)