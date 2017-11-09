var express = require('express')
var app = express()
var http = require('http')
var server = http.Server(app)
var bodyParser = require('body-parser')
var child_process = require('child_process')
var fs = require('fs')
//var parse = require('csv-parse/lib/sync')

// configure app
var port = 8080
app.use(express.static(__dirname + '/public'))
app.use('/chart.js', express.static(__dirname + '/node_modules/chart.js/dist/Chart.min.js'))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({
  extended: true
}))
/*
// general stats json
let arr = parse(fs.readFileSync(__dirname + '/python/data/stats.csv'))
var statsJson = {}
const ROLES = ['top', 'jungle', 'mid', 'adc', 'support']
const TRANS_ROLE = {
  'TOP_SOLO': 'top',
  'JUNGLE_NONE': 'jungle',
  'MIDDLE_SOLO': 'mid',
  'BOTTOM_DUO_CARRY': 'adc',
  'BOTTOM_DUO_SUPPORT': 'support'
}
const TRANS_DIVISION = {
  'I': 1,
  'II': 2,
  'III': 3,
  'IV': 4,
  'V': 5
}
var statsNames = []

for (let i = 2; i < arr[0].length; i++) {
  statsNames.push(arr[0][i])
}

for (let i = 1; i < arr.length; i++) {
  let role = TRANS_ROLE[arr[i][0]]
  let rank = arr[i][1].split('_')
  let league = rank[0].toLowerCase()
  let division = TRANS_DIVISION[rank[1]]

  if (typeof statsJson[role] === 'undefined') {
    statsJson[role] = {}
  }

  let stats = {}
  for (let s = 0; s < statsNames.length; s++) {
    stats[statsNames[s]] = parseFloat(arr[i][s + 2])
  }

  if (league === 'unranked' || league === 'master' || league === 'challenger') {
    statsJson[role][league] = stats
  } else {
    if (typeof statsJson[role][league] === 'undefined') {
      statsJson[role][league] = {}
    }

    statsJson[role][league][division] = stats
  }
}
*/
// routing
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/html/index.html')
})

app.get('/summoner/*', (req, res) => {
  res.sendFile(__dirname + '/public/html/summoner.html')
})

app.get('/stats', (req, res) => {
  res.send(statsJson)
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
