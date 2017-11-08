var express = require('express')
var app = express()
var http = require('http')
var server = http.Server(app)
var bodyParser = require('body-parser')

var port = 8080
app.use(express.static(__dirname + '/public'))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({
  extended: true
}))

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/html/index.html')
})

app.get('/summoner/*', (req, res) => {
  res.sendFile(__dirname + '/public/html/summoner.html')
})

app.get('*', (req, res) => {
  res.redirect('/')
})

app.post('/search', (req, res) => {
  res.redirect('/summoner/' + req.body.server + '/' + req.body.summoner)
})

server.listen(port, () => {
  console.log('lolcoach started on port ' + port)
})
