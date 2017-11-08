/**
 * The code for the summoner page
 */
let regexRes = /\/summoner\/([A-Z]+)\/([^\/]+)/.exec(decodeURIComponent(window.location.pathname))

var server = regexRes[1]
var summoner = regexRes[2]

document.getElementById('summoner-greeting').innerHTML = summoner
