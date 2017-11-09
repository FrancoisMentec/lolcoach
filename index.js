var express = require('express')
var app = express()
var http = require('http')
var server = http.Server(app)
var bodyParser = require('body-parser')
var child_process = require('child_process')

var port = 8080
app.use(express.static(__dirname + '/public'))
app.use('/chart.js', express.static(__dirname + '/node_modules/chart.js/dist/Chart.min.js'))
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

app.get('/stats/:region/:summoner', (req, res) => {
  child_process.exec(`python3 python/get-player-average.py ${req.params.region} "${req.params.summoner}"`, (err, stdout, stderr) => {
    if (err) {
      console.error(err)
    } else {
      if (stderr.length > 0) {
        res.send(stderr)
      } else {
        res.send(stdout)
      }
    }
  })
})

app.get('*', (req, res) => {
  res.redirect('/')
})

app.post('/search', (req, res) => {
  res.redirect('/summoner/' + req.body.region + '/' + req.body.summoner)
})

server.listen(port, () => {
  console.log('lolcoach started on port ' + port)
})
