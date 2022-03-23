const { Server: HTTPServer } = require('node:http')

class Server extends HTTPServer {
  static EVENT_CONNECTION_IDLE = 'EVENT_CONNECTION_IDLE'
  static FORCED_STOP_TIMEOUT = 1000 * 30

  #connectionsMap = new Map()
  #isTerminating = false

  onTrackConnections(connection) {
    // possible `id` is `connection.remoteAddress + ':' + connection.remotePort`
    this.#connectionsMap.set(connection, {
      requestCount: 0,
    })
    connection.once('close', () => {
      this.#connectionsMap.delete(connection)
    })
  }

  onTrackConnectionRequests(request, response) {
    const connection = request.socket
    const connectionData = this.#connectionsMap.get(connection)

    connectionData.requestCount++

    const isConnectionMustBeClosed = this.#isTerminating && !response.headersSent
    if (isConnectionMustBeClosed) {
      response.statusCode = 503
      response.setHeader('connection', 'close')
      response.setHeader('refresh', '5')
    }

    response.on('finish', () => {
      connectionData.requestCount--
      const isConnectionIdle = connectionData.requestCount === 0
      if (isConnectionIdle) {
        connection.emit(Server.EVENT_CONNECTION_IDLE)
      }
    })
  }

  closeConnections({ isForce = false }) {
    for (const [connection, connectionData] of this.#connectionsMap) {
      const isConnectionIdle = connectionData.requestCount === 0
      const isConnectionMustBeClosed = isForce || isConnectionIdle
      if (isConnectionMustBeClosed) {
        connection.end()
        // connection.destroy()
      } else {
        connection.once(Server.EVENT_CONNECTION_IDLE, () => {
          connection.end()
          // connection.destroy()
        })
      }
    }
  }

  listen(...args) {
    super.listen(...args)
    this.on('connection', this.onTrackConnections)
    this.on('request', this.onTrackConnectionRequests)
  }

  close(callback) {
    if (this.#isTerminating) {
      return
    }
    this.#isTerminating = true

    const forceTimeout = setTimeout(() => {
      console.log('forced close conections')
      this.closeConnections({ isForce: true })
    }, Server.FORCED_STOP_TIMEOUT)

    super.close((error) => {
      clearTimeout(forceTimeout)
      if (error) {
        console.log(error)
        process.exit(1)
      }
      callback()
    })

    this.closeConnections({ isForce: false })
  }
}

module.exports = {
  Server
}