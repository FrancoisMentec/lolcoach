/**
 * The code for the summoner page
 */
let regexRes = /\/summoner\/([A-Z0-9]+)\/([^\/]+)/.exec(decodeURIComponent(window.location.pathname))

var region = regexRes[1]
var summoner = regexRes[2]
var roleSelect = document.getElementById('role')
var role = roleSelect.value
roleSelect.addEventListener('change', e => {
  role = roleSelect.value
  updateAllStats()
})

document.getElementById('summoner-greeting').innerHTML = summoner

const LEAGUES = ['unranked', 'bronze', 'silver', 'gold', 'platinum', 'diamond', 'master', 'challenger']

const ROLES = {
  'top': 'TOP_SOLO',
  'jungle': 'JUNGLE_NONE',
  'mid': 'MIDDLE_SOLO',
  'adc': 'BOTTOM_DUO_CARRY',
  'support': 'BOTTOM_DUO_SUPPORT'
}

const STAT_UNITS = {
  'Farming': 'CS/min',
  'Kill Participation': 'KP',
  'KDA': 'KDA',
  'Vision Score': 'Vision Score',
  'Vision Wards': 'Vision Wards Per Game',
  'Damage Dealt to Champions': 'Dmg to Champs',
  'Damage Dealt to Objectives': 'Dmg to Objectives',
  'Damage Dealt to Turrets': 'Dmg to Turrets'
}

// value should match the json webservice key
const STATS_NAME = {
  'Farming': 'cs',
  'Kill Participation': 'kp',
  'KDA': 'KDA',
  'Vision Score': 'visionScore',
  'Vision Wards': 'visionWardsBoughtInGame',
  'Damage Dealt to Champions': 'damageDealtToChampions',
  'Damage Dealt to Objectives': 'damageDealtToObjectives',
  'Damage Dealt to Turrets': 'damageDealtToTurrets'
}

const STAT_ADVICES = {
  'Farming': `
    <b>Advice:</b>
    <ul>
      <li>Wait until the last moment to last hit, avoid damaging minions continiously unless you want to push.</li>
      <li>A caster minion needs one turret shot and two auto attacks to die, so auto it before it takes a shot and again after.</li>
      <li>Melee minions need two turret shots and one or two auto attacks, depending on your attack damage.</li>
      <li>You can use your spells to farm but don't waste all your mana unless you're planning to back.</li>
      <li>When you can't to back wait a wave that precede a cannon wave, push it fast (you can spend all your mana) then back, so if your opponent push the wave under your turret you'll loose less minions because the cannon can tank more shots.</li>
      <li>Avoid sharing a lane as much as possible, unless you want to teamfight or prepare an objective the toplaner, the midlaner and the adc should be on different lanes.</li>
    </ul>
    <b>Exercise idea :</b>
    <ul>
      <li>Start a game in the sandbox tool, lock your xp to stay level 1, don't buy any item and try to last hit as many minions as possible.</li>
      <li>Do an 1v1 against a friend, the winner is the first to reach 100cs, you're not allowed to kill each other.</li>
    </ul>
    `,
  'Kill Participation': `
    <b>Advice:</b>
    <ul>
      <li>Try to play with your team, it doesn't mean you always have to stay with them, only when they try to take or defend an objective.</li>
    </ul>
    `,
  'KDA': `
  <b>Advice:</b>
  <ul>
    <li>If you have several deaths, start playing safer and closer to turrets.</li>
  </ul>
  `,
  'Vision Score': `
  <b>Advice:</b>
  <ul>
    <li>Wards save lives.</li>
  </ul>
  `,
  'Vision Wards': `
  <b>Advice:</b>
  <ul>
    <li>Vision Wards save lives.</li>
  </ul>
  `,
  'Damage Dealt to Champions': `
  <b>Advice:</b>
  <ul>
    <li>Do more damage to your opponent than they do to you.</li>
  </ul>
  `,
  'Damage Dealt to Objectives': `
  <b>Advice:</b>
  <ul>
    <li>Taking objectives is a good way to gain an advantage over the enemy team.</li>
  </ul>
  `,
  'Damage Dealt to Turrets': `
  <b>Advice:</b>
  <ul>
    <li>Destroying turrets is a good way to gain an advantage over the enemy team.</li>
  </ul>
  `//Damage Dealt to Turrets
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
var statsDivision = null
function updateStatsPlayer () {
  return new Promise((resolve, reject) => {
    let xhr = new XMLHttpRequest()
    xhr.onreadystatechange = function () {
      if (this.readyState == 4 && this.status == 200) {
        let res = JSON.parse(this.responseText.replace(/'/g, '"'))
        statsPlayer = res.player
        statsDivision = res.global
        resolve()
      }
    }
    xhr.open('GET', `/stats/${region}/${summoner}`, true)
    xhr.send()
  })
}

// Stats
var stats = []
var statsLayout = document.getElementById('stats-layout')

function updateAllStats () {
  for (let i in stats) {
    stats[i].update()
  }
}

class Stat {
  constructor (name) {
    this.name = name
    this.value = statsPlayer[STATS_NAME[this.name]]
    this.ratio = this.value / statsDivision[ROLES[role]][STATS_NAME[this.name]]
    this.state = this.ratio < 0.95
      ? 'bad'
      : this.ratio <= 1.05
        ? 'avg'
        : 'good'
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

    this.statAdvices = document.createElement('div')
    this.statAdvices.classList.add('stat-advices')
    this.statAdvices.innerHTML = STAT_ADVICES[this.name]
    this.div.appendChild(this.statAdvices)

    this.update()

    stats.push(this)
  }

  expand () {
    this.expanded = true
    this.div.classList.add('expanded')
  }

  collapse () {
    this.expanded = false
    this.div.classList.remove('expanded')
  }

  update () {
    this.statValueLayout.classList.remove(this.state)
    this.ratio = this.value / statsDivision[ROLES[role]][STATS_NAME[this.name]]
    this.state = this.ratio < 0.95
      ? 'bad'
      : this.ratio <= 1.05
        ? 'avg'
        : 'good'
    this.statValueLayout.classList.add(this.state)
    // update the charts
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

    if (this.rankingDiv) {
      this.statsDiv.removeChild(this.rankingDiv)
    }
    this.rankingDiv = document.createElement('canvas')
    this.rankingDiv.setAttribute('width', 251)
    this.rankingDiv.setAttribute('height', 200)
    this.statsDiv.appendChild(this.rankingDiv)

    this.rankingChart = new Chart(this.rankingDiv, {
        type: 'line',
        data: {
          labels: labels,
          datasets: [{
              label: 'Others',
              pointRadius: 2,
              backgroundColor: 'rgba(244, 67, 54, 0.2)',
              pointBackgroundColor: 'rgb(244, 67, 54)',
              borderColor: 'rgb(244, 67, 54)',
              data: dataOthers,
          },{
              label: 'You',
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

// Coach
class Coach {
  constructor () {
    this.speakingLayout = document.getElementById('coach-speaking-layout')
    this.layout = document.getElementById('coach-layout')
    this.coach = document.getElementById('coach')
  }

  say (sentence) {
    let speak = document.createElement('div')
    speak.classList.add('coach-speaking')
    speak.innerHTML = sentence
    this.speakingLayout.appendChild(speak)
    let old = this.coach
    this.coach = old.cloneNode(true)
    this.layout.replaceChild(this.coach, old)
  }
}

var coach = new Coach()
coach.say('Hello fleshling! I am analyzing your stats, standby.')

updateStatsAverage().then(() => {
  updateStatsPlayer().then(() => {
    /*let labels = []
    let ystat = []
    let ostat = []
    for (let stat in statsPlayer) {
      labels.push(stat)
      ystat.push(statsPlayer[stat])
      ostat.push(statsDivision[stat])
    }
    radarChart = new Chart(document.getElementById('radar'), {
      type: 'radar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Yourself',
          backgroundColor: 'rgba(0, 150, 136, 0.2)',
          pointBackgroundColor: 'rgb(0, 150, 136)',
          borderColor: 'rgb(0, 150, 136)',
          data: ystat
        },{
          label: 'Others',
          backgroundColor: 'rgba(244, 67, 54, 0.2)',
          pointBackgroundColor: 'rgb(244, 67, 54)',
          borderColor: 'rgb(244, 67, 54)',
          data: ostat
        }]
      }
    })*/
    farming = new Stat('Farming');
    killParticipation = new Stat('Kill Participation');
    kda = new Stat('KDA');
    visionScore = new Stat('Vision Score');
    visionWards = new Stat('Vision Wards');
    damageDealtToChampions = new Stat('Damage Dealt to Champions');
    damageDealtToObjectives = new Stat('Damage Dealt to Objectives');
    damageDealtToTurrets = new Stat('Damage Dealt to Turrets');
    coach.say('Click on a stat to learn how to improve it.');
  })
})
