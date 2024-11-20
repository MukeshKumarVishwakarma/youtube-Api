const http = require('http')
const app = require('../api/app')

const port = 8000
const server = http.createServer(app)
server.listen(port, () => {
    console.log("app is running on port"+ port);
})