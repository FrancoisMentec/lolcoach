var express = require('express')
var app = express()
var http = require('http')
var server = http.Server(app)

var port = 8080
app.use(express.static(__dirname + '/public'))

app.get('*', (req, res) => {
  res.sendFile(__dirname + '/public/html/index.html')
})

server.listen(port, () => {
  console.log('lolcoach started on port ' + port)
})
