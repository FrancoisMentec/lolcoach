/**
 * The code for the summoner page
 */
let regexRes = /\/summoner\/([A-Z]+)\/([^\/]+)/.exec(decodeURIComponent(window.location.pathname))

var region = regexRes[1]
var summoner = regexRes[2]
var roleSelect = document.getElementById('role')
var role = roleSelect.value
roleSelect.addEventListener('change', e => {
  role = roleSelect.value
  farming.updateChart()
  killParticipation.updateChart()
})

document.getElementById('summoner-greeting').innerHTML = summoner

const LEAGUES = ['unranked', 'bronze', 'silver', 'gold', 'platinum', 'diamond', 'master', 'challenger']

const STAT_UNITS = {
  'farming': 'CS/min',
  'kill participation': 'KP'
}

const STATS_NAME = {
  'farming': 'csmin',
  'kill participation': 'KP'
}

const STAT_ADVICES = {
  'farming': `
    <b>Advices :</b>
    <ul>
      <li>Wait the last moment to last hit, avoid damaging creeps continiously unless you want to push.</li>
      <li>A caster minion need one turret's shot and two autos to die, so auto him before he take a shot and last it him after the shot.</li>
      <li>A close combat minions need two turret's shot and one or two autos, it depends of your attack damage.</li>
      <li>You can use your spells to farm but don't waste all your mana unless you're planning to back.</li>
      <li>When you ant to back wait a wave that precede a cannon wave, push it fast (you can spend all your mana) then back, so if your opponent push the wave under your turret you'll loose less minions because the cannon can tank more shots.</li>
      <li>Avoid sharing a lane as much as possible, unless you want to teamfight or prepare an objective the toplaner, the midlaner and the adc should be on different lanes.</li>
    </ul>
    <b>Exercise idea :</b>
    <ul>
      <li>Start a game in the sandbox tool, lock your xp to stay level 1, don't buy any item and try to last hit as many minions as possible.</li>
      <li>Do an 1v1 against a friend, the winner is the first to reach 100cs, you're not allowed to kill each other.</li>
    </ul>
    `,
  'kill participation': `
    <b>Advices :</b>
    <ul>
      <li>Try to play with your team, it doesn't mean you always have to stay with them, only when they try to take or defend an objective.</li>
    </ul>
    `
}

var statsAverage = null
function updateStatsAverage () {
  return new Promise((resolve, reject) => {
    let xhr = new XMLHttpRequest()
    xhr.onreadystatechange = function () {
      if (this.readyState == 4 && this.status == 200) {
        statsAverage = JSON.parse(this.responseText)
        resolve()
      }
    }
    xhr.open('GET', '/stats', true)
    xhr.send()
  })
}

var statsPlayer = null
function updateStatsPlayer () {
  return new Promise((resolve, reject) => {
    let xhr = new XMLHttpRequest()
    xhr.onreadystatechange = function () {
      if (this.readyState == 4 && this.status == 200) {
        statsPlayer = JSON.parse(this.responseText.replace(/'/g, '"')).player
        resolve()
      }
    }
    xhr.open('GET', `/stats/${region}/${summoner}`, true)
    xhr.send()
  })
}

var statsLayout = document.getElementById('stats-layout')
class Stat {
  constructor (name) {
    this.name = name
    this.value = statsPlayer[STATS_NAME[name]]
    this.state = 'bad'
    this.expanded = false

    this.div = document.createElement('div')
    this.div.classList.add('stat-layout')
    this.div.addEventListener('click', e => {
      if (!this.expanded) {
        this.expand()
      }
    })
    statsLayout.appendChild(this.div)

    this.expandButton = document.createElement('div')
    this.expandButton.classList.add('stat-layout-button')
    this.expandButton.addEventListener('click', e => {
      if (this.expanded) {
        e.stopPropagation()
        this.collapse()
      }
    })
    this.div.appendChild(this.expandButton)

    this.statsDiv = document.createElement('div')
    this.statsDiv.classList.add('stat-stats')
    this.div.appendChild(this.statsDiv)

    this.nameDiv = document.createElement('div')
    this.nameDiv.classList.add('stat-name')
    this.nameDiv.innerHTML = this.name
    this.statsDiv.appendChild(this.nameDiv)

    this.statValueLayout = document.createElement('div')
    this.statValueLayout.classList.add('stat-value-layout')
    this.statValueLayout.classList.add(this.state)
    this.statsDiv.appendChild(this.statValueLayout)
    this.statValueDiv = document.createElement('span')
    this.statValueDiv.classList.add('stat-value')
    this.statValueDiv.innerHTML = Math.round(this.value * 100) / 100
    this.statValueLayout.appendChild(this.statValueDiv)
    this.statValueLayout.appendChild(document.createTextNode(' ' + STAT_UNITS[this.name]))

    this.rankingDiv = document.createElement('canvas')
    this.rankingDiv.setAttribute('width', 251)
    this.rankingDiv.setAttribute('height', 200)
    this.statsDiv.appendChild(this.rankingDiv)

    this.statAdvices = document.createElement('div')
    this.statAdvices.classList.add('stat-advices')
    this.statAdvices.innerHTML = STAT_ADVICES[this.name]
    this.div.appendChild(this.statAdvices)

    this.updateChart()
  }

  expand () {
    this.expanded = true
    this.div.classList.add('expanded')
  }

  collapse () {
    this.expanded = false
    this.div.classList.remove('expanded')
  }

  updateChart () {
    let labels = []
    let dataOthers = []
    let dataYourself = []
    for (let l = 0; l < LEAGUES.length; l++) {
      let league = LEAGUES[l]
      if (league === 'unranked' || league === 'master' || league === 'challenger') {
        labels.push(league)
        dataOthers.push(statsAverage[role][league][STATS_NAME[this.name]])
        dataYourself.push(this.value)
      } else {
        for (let i = 5; i > 0; i--) {
          labels.push(league + ' ' + i)
          dataOthers.push(statsAverage[role][league][i][STATS_NAME[this.name]])
          dataYourself.push(this.value)
        }
      }
    }
    this.rankingChart = new Chart(this.rankingDiv, {
        type: 'line',
        data: {
          labels: labels,
          datasets: [{
              label: 'Others',
              pointRadius: 0,
              backgroundColor: 'rgba(244, 67, 54, 0.2)',
              pointBackgroundColor: 'rgb(244, 67, 54)',
              borderColor: 'rgb(244, 67, 54)',
              data: dataOthers,
          },{
              label: 'Yourself',
              pointRadius: 0,
              backgroundColor: 'rgba(0, 150, 136, 0.2)',
              pointBackgroundColor: 'rgb(0, 150, 136)',
              borderColor: 'rgb(0, 150, 136)',
              data: dataYourself,
          }]
        }
    })
  }
}

updateStatsAverage().then(() => {
  updateStatsPlayer().then(() => {
    farming = new Stat('farming')
    killParticipation = new Stat('kill participation')
  })
})
