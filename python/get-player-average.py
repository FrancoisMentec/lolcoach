import requests
import sys, json, os, hashlib, time
import pandas as pd

try:
	API_KEY = open("./data/API_KEY").read()
	dataDir = "./data/"
	cacheDir = "./cache/"
except:
	try:
		API_KEY = open("./python/data/API_KEY").read()
		dataDir = "./python/data/"
		cacheDir = "./python/cache/"
	except:
		sys.exit("Can't locate API_KEY")


region = sys.argv[1].lower()
player = sys.argv[2]

#Cache functions
def isCached(url):
	if os.path.isfile(cacheDir + hashlib.sha1(url.encode('utf-8')).hexdigest()):
		if (time.time() - json.loads(open(cacheDir + hashlib.sha1(url.encode('utf-8')).hexdigest()).read())['time']) < 86400:
			return True
	return False

def getCache(url):
	return json.loads(open(cacheDir + hashlib.sha1(url.encode('utf-8')).hexdigest()).read())['data']


def putCache(url, data):
	open(cacheDir + hashlib.sha1(url.encode('utf-8')).hexdigest(), 'w').write(json.dumps({"time":time.time(),"data":data}))


def mean(numbers):
	return float(sum(numbers)) / max(len(numbers), 1)


def isValidRegion(region):
	return region in ["br1","eun1","euw1","jp1","kr","la1","la2","na1","oc1","tr1","ru"]

def getGlobalAverageStats(rank):
	df = pd.read_csv(dataDir + 'stats.csv')
	return df[df["rank"] == rank].mean().to_dict()

def getAPIData(url):

	if isCached(url):
		return getCache(url)

	#dictionary to hold extra headers
	HEADERS = {"X-Riot-Token":API_KEY}

	r = requests.get(url, headers=HEADERS);
	data = r.json()

	putCache(url, data)

	return data;


def getIDFromSummonerName(summonerName, region):
	#https://na1.api.riotgames.com/lol/summoner/v3/summoners/by-name/

	# make sure the region is valid
	if isValidRegion(region) == False:
		return "Invalid region"
	else:
		url = "https://" + region + ".api.riotgames.com/lol/summoner/v3/summoners/by-name/" + summonerName

		summonerInfo = getAPIData(url)

		return summonerInfo['accountId'],summonerInfo['id']


def getLeagueBySummonerId(summonerID, region):
	#https://na1.api.riotgames.com/lol/match/v3/matchlists/by-account/

	# make sure the region is valid
	if isValidRegion(region) == False:
		return "Invalid region"
	else:
		# limit the matches to those that are for Summoner's Rift 5v5 Draft Pick, 5v5 Ranked Solo, 5v5 Blind Pick, and 5v5 Ranked Flex games
		url = "https://" + region + ".api.riotgames.com/lol/league/v3/positions/by-summoner/" + str(summonerID)

		data = getAPIData(url)
		league = "UNRANKED"

		if len(data) > 0:
			for l in data:
				if l["queueType"] == "RANKED_SOLO_5x5":
					league = l['tier'] + "_" + l['rank']
					break
				else:
					league = l['tier'] + "_" + l['rank']

		return league


def getMatchList(accountID, region, maxGames = 100):
	#https://na1.api.riotgames.com/lol/match/v3/matchlists/by-account/

	# make sure the region is valid
	if isValidRegion(region) == False:
		return "Invalid region"
	else:
		# limit the matches to those that are for Summoner's Rift 5v5 Draft Pick, 5v5 Ranked Solo, 5v5 Blind Pick, and 5v5 Ranked Flex games
		url = "https://" + region + ".api.riotgames.com/lol/match/v3/matchlists/by-account/" + str(accountID) + "?queue=400&queue=420&queue=430&queue=440&endIndex=" + str(maxGames)

		return getAPIData(url)


def getMatchData(matchID, region):
	#https://na1.api.riotgames.com/lol/match/v3/matches/

	# make sure the region is valid
	if isValidRegion(region) == False:
		return "Invalid region"
	else:
		url = "https://" + region + ".api.riotgames.com/lol/match/v3/matches/" + str(matchID)

		return getAPIData(url)

def getAverageStatsByAccountID(accountID, region):
	matchStats = {
		"cs": []
		, "kda": []
		, "kp": []
		, "objectiveDamage": []
		, "turretDamage": []
		, "visionScore": []
		, "visionWardsBoughtInGame": []
		, "neutralMinionsKilledTeamJungle": []
		, "neutralMinionsKilledEnemyJungle": []
		, "totalDamageDealtToChampions": []
	}

	averageStats = {}

	matchList = getMatchList(accountID, region, maxGames = 10)

	for matchInfo in matchList['matches']:

		match = getMatchData(matchInfo['gameId'], region)
		matchKills = {
			'100': 0
			, '200': 0
		}
		matchDeaths = {
			'100': 0
			, '200': 0
		}
		matchAssists = {
			'100': 0
			, '200': 0
		}
		participantID = 0
		participantData = []
		participantStats = []

		#print(match['participantIdentities'])

		# get participant ID for given summoner name
		for participant in match['participantIdentities']:
			if participant['player']['accountId'] == accountID:
				participantID = participant['participantId']
				break

		#print("Participant: " + str(participantID))

		# get the participant's stats
		# and the kda totals for all participants
		for participant in match['participants']:
			if participant['participantId'] == participantID:
				participantData = participant
				participantStats = participant['stats']

			matchKills[str(participant['teamId'])] += participant['stats']['kills']
			matchDeaths[str(participant['teamId'])] += participant['stats']['deaths']
			matchAssists[str(participant['teamId'])] += participant['stats']['assists']


		#print(participantStats)

		# KP
		# Match timeline data
		# csDiffPerMinDeltas
		# goldPerMinDeltas
		# xpDiffPerMinDeltas
		# creepsPerMinDeltas
		# xpPerMinDeltas
		# damageTakenDiffPerMinDeltas
		# damageTakenPerMinDeltas

		# TODO: check if the stat exists first
		matchStats["cs"].append(participantStats['totalMinionsKilled'] *60 / match['gameDuration'])

		# make sure we don't divide by 0
		if participantStats['deaths'] > 0:
			matchStats["kda"].append((participantStats['kills'] + participantStats['assists']) / participantStats['deaths'])
		else:
			matchStats["kda"].append(participantStats['kills'] + participantStats['assists'])

		# make sure we don't divide by 0
		if matchKills[str(participant['teamId'])] > 0:
			matchStats["kp"].append((participantStats['kills'] + participantStats['assists']) / matchKills[str(participant['teamId'])])
		else:
			matchStats["kp"].append(0)

		matchStats["objectiveDamage"].append(participantStats['damageDealtToObjectives'])
		matchStats["turretDamage"].append(participantStats['damageDealtToTurrets'])
		matchStats["visionScore"].append(participantStats['visionScore'])
		matchStats["visionWardsBoughtInGame"].append(participantStats['visionWardsBoughtInGame'])
		matchStats["neutralMinionsKilledTeamJungle"].append(participantStats['neutralMinionsKilledTeamJungle'] *60 / match['gameDuration'])
		matchStats["neutralMinionsKilledEnemyJungle"].append(participantStats['neutralMinionsKilledEnemyJungle'] *60 / match['gameDuration'])
		matchStats["totalDamageDealtToChampions"].append(participantStats['totalDamageDealtToChampions'])
		#matchStats[""].append(participantStats[''])


	for statName, statValues in matchStats.items():
		#print(statName, statValues)
		averageStats[statName] = mean(statValues)

	return averageStats

def getAllStatsFromSummonerName(summonerName, region):
	accountID, summonerID = getIDFromSummonerName(summonerName, region)
	league = getLeagueBySummonerId(summonerID, region)

	globalStats = getGlobalAverageStats(league)
	playerStats = getAverageStatsByAccountID(accountID, region)

	print(json.dumps({"global":globalStats,"player":playerStats}))

getAllStatsFromSummonerName(player, region)
