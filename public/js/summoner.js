/**
 * The code for the summoner page
 */
let regexRes = /\/summoner\/([A-Z]+)\/([^\/]+)/.exec(decodeURIComponent(window.location.pathname))

var region = regexRes[1]
var summoner = regexRes[2]

document.getElementById('summoner-greeting').innerHTML = summoner

const STAT_UNITS = {
  'farming': 'CS/min'
}

const STAT_ADVICES = {
  'farming': `
    Advice :
    <ul>
      <li>Wait the last moment to last hit, avoid damaging creeps continiously unless you want to push.</li>
      <li>A caster minion need one turret's shot and two autos to die, so auto him before he take a shot and last it him after the shot.</li>
      <li>A close combat minions need two turret's shot and one or two autos, it depends of your attack damage.</li>
      <li>You can use your spells to farm but don't waste all your mana unless you're planning to back.</li>
      <li>When you ant to back wait a wave that precede a cannon wave, push it fast (you can spend all your mana) then back, so if your opponent push the wave under your turret you'll loose less minions because the cannon can tank more shots.</li>
      <li>Avoid sharing a lane as mush as possible, unless you want to teamfight or prepare an objective the toplaner, the midlaner and the adc should be on different lanes.</li>
    </ul>
    Exercise idea :
    <ul>
      <li>Start a game in the sandbox tool, lock your xp to stay level 1, don't buy any item and try to lost the less minions as possible.</li>
      <li>Do an 1v1 against a friend, the winner is the first to reach 100cs, you're not allowed to kill each other.</li>
    </ul>
    `
}

class Stat {
  constructor (name, value, state='avg') {
    this.name = name
    this.value = value
    this.state = state
    this.expanded = false

    this.div = document.createElement('div')
    this.div.classList.add('stat-layout')
    this.div.addEventListener('click', e => {
      if (!this.expanded) {
        this.expand()
      }
    })
    document.body.appendChild(this.div)

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
    this.statValueDiv.innerHTML = this.value
    this.statValueLayout.appendChild(this.statValueDiv)
    this.statValueLayout.appendChild(document.createTextNode(' ' + STAT_UNITS[this.name]))

    this.rankingDiv = document.createElement('canvas')
    this.rankingDiv.setAttribute('width', 251)
    this.rankingDiv.setAttribute('height', 150)
    this.statsDiv.appendChild(this.rankingDiv)
    this.rankingChart = new Chart(this.rankingDiv, {
        type: 'line',
        data: {
          labels: ['gold 5', 'gold 4', 'gold 3', 'gold 2', 'gold 1', 'plat 5', 'plat 4'],
          datasets: [{
              label: 'Other',
              backgroundColor: 'rgba(244, 67, 54, 0.2)',
              borderColor: 'rgb(244, 67, 54)',
              data: [4.2, 4.8, 5, 5.3, 5.7, 6, 6.8],
          },{
              label: 'Yourself',
              backgroundColor: 'rgba(0, 150, 136, 0.2)',
              borderColor: 'rgb(0, 150, 136)',
              data: [this.value, this.value, this.value, this.value, this.value, this.value, this.value],
          }]
        }
    })

    this.statAdvices = document.createElement('div')
    this.statAdvices.classList.add('stat-advices')
    this.statAdvices.innerHTML = STAT_ADVICES[this.name]
    this.div.appendChild(this.statAdvices)
  }

  expand () {
    this.expanded = true
    this.div.classList.add('expanded')
  }

  collapse () {
    this.expanded = false
    this.div.classList.remove('expanded')
  }
}

var farming = new Stat('farming', 5.4, 'bad')
