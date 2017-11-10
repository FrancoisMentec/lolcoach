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

const TERRIBLE_THRESHOLD = 0.5

const LEAGUES = ['unranked', 'bronze', 'silver', 'gold', 'platinum', 'diamond', 'master', 'challenger']

const ROLES = {
  'player': 'ALL',
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

const STAT_SHORT_UNITS = {
  'Farming': 'CS',
  'Kill Participation': 'KP',
  'KDA': 'KDA',
  'Vision Score': 'VS',
  'Vision Wards': 'Pink',
  'Damage Dealt to Champions': 'D2C',
  'Damage Dealt to Objectives': 'D2O',
  'Damage Dealt to Turrets': 'D2T'
}

var radarLegend = document.getElementById('radar-legend')
for (let stat in STAT_SHORT_UNITS) {
  radarLegend.innerHTML += `${STAT_SHORT_UNITS[stat]} = ${stat} <br>`
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
      <li>Avoid sharing a lane as much as possible, unless you want to teamfight or prepare an objective the top laner, the mid laner and the adc should be on different lanes.</li>
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
    <li>Improving your vision can prevent you from gank.</li>
    <li>Don't let your teammates bait you, if they're doing something stupid let them die and try to take something somewhere else to compensate.</li>
    <li>Always watch your map, especially other lanes, if you die from opponent's roaming it's because you didn't watched the map, not because your ally didn't pinged miss.</li>
  </ul>
  `,
  'Vision Score': `
  <b>Advice:</b>
  <ul>
    <li>Use your trinket and if you're using a sweeper upgrade it at level 9 (it's free).</li>
  </ul>
  `,
  'Vision Wards': `
  <b>Advice:</b>
  <ul>
    <li>Never leave the base with a free slot and 75 gold, always keep a pink on you, even if you already have one on the map.</li>
  </ul>
  `,
  'Damage Dealt to Champions': `
  <b>Advice:</b>
  <ul>
    <li>Every time you have the opportunity to deal safe damage do it, even if it seems useless it will make a difference on the long term.</li>
    <li>If you're gonna die use everything so your teamates may have the opportunity to clean up.</li>
  </ul>
  `,
  'Damage Dealt to Objectives': `
  <b>Advice:</b>
  <ul>
    <li>Objectives are more important than kill, never chase if you can take a turret or a drake.</li>
    <li>approximately : Nexus > nashor > inhibitor > first turret > drake > turret > kill</li>
  </ul>
  `,
  'Damage Dealt to Turrets': `
  <b>Advice:</b>
  <ul>
    <li>After a successfull gank you should go for turret, ask your jungle to stay and help you to push.</li>
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

var statsWeek = null
function updateStatsWeek () {
  return new Promise((resolve, reject) => {
    let xhr = new XMLHttpRequest()
    xhr.onreadystatechange = function () {
      if (this.readyState == 4 && this.status == 200) {
        statsWeek = JSON.parse(this.responseText.replace(/'/g, '"'))
        resolve()
      }
    }
    xhr.open('GET', `/weekStats/${region}/${summoner}`, true)
    xhr.send()
  })
}

// Stats
var stats = []
var statsLayout = document.getElementById('stats-layout')

function updateAllStats () {
  updateRadar()
  for (let i in stats) {
    stats[i].update()
  }
  stats.sort((a,b) => { return a.ratio - b.ratio })
  for(var i = 0; i < stats.length; i++) {
      stats[i].addToPage()
  }
}

class Stat {
  constructor (name) {
    this.name = name
    this.value = typeof statsPlayer[ROLES[role]] !== 'undefined'
      ? statsPlayer[ROLES[role]][STATS_NAME[this.name]]
      : NaN
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
    //statsLayout.appendChild(this.div)

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
    this.value = typeof statsPlayer[ROLES[role]] !== 'undefined'
      ? statsPlayer[ROLES[role]][STATS_NAME[this.name]]
      : NaN
    this.statValueDiv.innerHTML = Math.round(this.value * 100) / 100
    this.statValueLayout.classList.remove(this.state)
    this.ratio = this.value / statsDivision[ROLES[role]][STATS_NAME[this.name]]
    if (this.ratio < TERRIBLE_THRESHOLD) {
      coach.say(`Your <b>${this.name}</b> as a <b>${role}</b> looks to be a weakness, you should work on it.`)
    }
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
    if (role !== 'player') {
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
    }

    if (this.rankingDiv) {
      this.statsDiv.removeChild(this.rankingDiv)
    }
    this.rankingDiv = document.createElement('canvas')
    this.rankingDiv.setAttribute('width', 250)
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

    // update the progression stats
    let labelsP = ['-3', '-2', '-1', 'current']
    let dataP = []
    for (let i = 0; i < statsWeek.length; i++) {
      dataP.push(statsWeek[i][ROLES[role]][STATS_NAME[this.name]])
    }

    if (this.progressionDiv) {
      this.statsDiv.removeChild(this.progressionDiv)
    }
    this.progressionDiv = document.createElement('canvas')
    this.progressionDiv.setAttribute('width', 250)
    this.progressionDiv.setAttribute('height', 200)
    this.statsDiv.appendChild(this.progressionDiv)

    this.progressionChart = new Chart(this.progressionDiv, {
        type: 'line',
        data: {
          labels: labelsP,
          datasets: [{
              label: 'Your progression',
              backgroundColor: 'rgba(0, 150, 136, 0.2)',
              pointBackgroundColor: 'rgb(0, 150, 136)',
              borderColor: 'rgb(0, 150, 136)',
              data: dataP,
          }]
        }
    })
  }

  addToPage() {
    if (this.div.parentNode == statsLayout) {
      statsLayout.removeChild(this.div)
    }
    statsLayout.appendChild(this.div)
  }
}

// Coach
class Coach {
  constructor () {
    this.speakingLayout = document.getElementById('coach-speaking-layout')
    this.layout = document.getElementById('coach-layout')
    this.coach = document.getElementById('coach')
    this.counter = 0
    this.rotating = false
    this.bindCoach()
  }

  say (sentence) {
    var speakingLayout = document.getElementById("coach-speaking-layout");
    /*while (speakingLayout.firstChild) {
      speakingLayout.removeChild(speakingLayout.firstChild);
    }*/
    let speak = document.createElement('div')
    speak.classList.add('coach-speaking')
    speak.innerHTML = sentence
    speak.addEventListener('click', e => {
      this.speakingLayout.removeChild(speak)
    })
    this.speakingLayout.appendChild(speak)
    /*setTimeout(() => {
      this.speakingLayout.removeChild(speak)
  }, 12000)*/
    this.layout.scrollTop = this.layout.scrollHeight
    this.animate()
  }

  bindCoach () {
    this.coach.addEventListener('click', e => {
      if (++this.counter >= 5) {
        this.counter = 0
        this.coach.classList.add('full-rotate')
        this.rotating = true
        setTimeout(() => {
          this.coach.classList.remove('full-rotate')
          this.say('Stop it fleshling!')
          this.rotating = false
        }, 2000)
        this.say('WooWooWooWoooooooooo')
      } else {
        this.animate()
      }
    })
  }

  animate () {
    if (!this.rotating) {
      let old = this.coach
      this.coach = old.cloneNode(true)
      this.bindCoach()
      this.layout.replaceChild(this.coach, old)
    }
  }
}

var coach = new Coach()
coach.say('Greetings fleshling! I am analyzing your stats, standby.');

function updateRadar () {
  let labels = []
  let ystat = []
  let ostat = []
  for (let stat in STATS_NAME) {
    labels.push(STAT_SHORT_UNITS[stat])
    ystat.push(typeof statsPlayer[ROLES[role]] !== 'undefined'
      ? statsPlayer[ROLES[role]][STATS_NAME[stat]] / statsDivision[ROLES[role]][STATS_NAME[stat]]
      : 0)
    ostat.push(1)
  }
  let radarLayout = document.getElementById('radar-layout')
  if (typeof radar !== 'undefined') {
    document.getElementById('radar-layout').removeChild(radar)
  }
  radar = document.createElement('canvas')
  radar.setAttribute('width', 274)
  radar.setAttribute('height', 274)
  document.getElementById('radar-layout').appendChild(radar)
  radarChart = new Chart(radar, {
    type: 'radar',
    data: {
      labels: labels,
      datasets: [{
        label: 'You',
        backgroundColor: 'rgba(0, 150, 136, 0.2)',
        pointBackgroundColor: 'rgb(0, 150, 136)',
        borderColor: 'rgb(0, 150, 136)',
        data: ystat
      },{
        label: rankName,
        backgroundColor: 'rgba(244, 67, 54, 0.2)',
        pointBackgroundColor: 'rgb(244, 67, 54)',
        borderColor: 'rgb(244, 67, 54)',
        data: ostat
      }]
    }
  })
}

updateStatsAverage().then(() => {
  updateStatsPlayer().then(() => {
    updateStatsWeek().then(() => {
      // disable not played role
      let options = roleSelect.getElementsByTagName('option')
      for (let o = 0; o < options.length; o++) {
        let option = options[o]
        if (typeof statsPlayer[ROLES[option.value]] === 'undefined') {
          option.disabled = true
        }
      }
      // look for most played role
      let maxCount = 0
      let maxRole = 'top'
      for (let role in ROLES) {
        if (statsPlayer[ROLES[role]] && statsPlayer[ROLES[role]].count > maxCount) {
          maxCount = statsPlayer[ROLES[role]].count
          maxRole = role
        }
      }
      role = roleSelect.value = maxRole
      //stats-layout
      nameParts = statsPlayer['ALL']['rank'].split("_");
      rankName = nameParts[0].toLowerCase() + " " + nameParts[1];
      rankName = rankName.charAt(0).toUpperCase() + rankName.slice(1);

      coach.say(`<span>Analyzed the <b>${statsPlayer['ALL']['count']}</b> most recent games and compared stats to other <b>${rankName}</b> players.</span>`)
      // radar chart
      updateRadar()
      // create stats
      farming = new Stat('Farming');
      killParticipation = new Stat('Kill Participation');
      kda = new Stat('KDA');
      visionScore = new Stat('Vision Score');
      visionWards = new Stat('Vision Wards');
      damageDealtToChampions = new Stat('Damage Dealt to Champions');
      damageDealtToObjectives = new Stat('Damage Dealt to Objectives');
      damageDealtToTurrets = new Stat('Damage Dealt to Turrets');

      // sort the stats based on the weakness ratio of the stat
      stats.sort((a,b) => { return a.ratio - b.ratio })

      // add the stats to the page in the correct order
      for(var i = 0; i < stats.length; i++) {
          stats[i].addToPage()
      }

      coach.say('Click on a stat to learn how to improve it.');
    })
  })
})
