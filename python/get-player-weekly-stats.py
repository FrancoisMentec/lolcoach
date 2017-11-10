import requests
import sys, json, os, hashlib, time
import pandas as pd
import asyncio

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


def isValidRegion(region):
	return region in ["br1","eun1","euw1","jp1","kr","la1","la2","na1","oc1","tr1","ru"]


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


def getMatchList(accountID, region, beginTime = False, endTime = False):
	#https://na1.api.riotgames.com/lol/match/v3/matchlists/by-account/

	# make sure the region is valid
	if isValidRegion(region) == False:
		return "Invalid region"
	else:
		# limit the matches to those that are for Summoner's Rift 5v5 Draft Pick, 5v5 Ranked Solo, 5v5 Blind Pick, and 5v5 Ranked Flex games
		url = "https://" + region + ".api.riotgames.com/lol/match/v3/matchlists/by-account/" + str(accountID) + "?queue=400&queue=420&queue=430&queue=440&beginTime=" + str(beginTime) + "&endTime=" + str(endTime)
		
		return getAPIData(url)

async def getMatchData(matchID, region):
	#https://na1.api.riotgames.com/lol/match/v3/matches/

	# make sure the region is valid
	if isValidRegion(region) == False:
		return "Invalid region"
	else:
		url = "https://" + region + ".api.riotgames.com/lol/match/v3/matches/" + str(matchID)

		return getAPIData(url)


def getWeekPlayerStats(accountID, region):


	times = []
	for i in range(0,4):
		times.append({
			"end": int(time.time())*1000 - (3-i) * 604800000,
			"begin": int(time.time()) * 1000 - ((3-i)+1) * 604800000 + 1
		})
	
	
	#matchList = getMatchList(accountID, region, beginTime = begin, endTime = end)
	
	loopMatchList = asyncio.get_event_loop()
	
	matchLists = asyncio.gather(*[getMatchList(accountID, region, timeData['begin'], timeData['end']) for timeData in times])
	
	matchListInfo = loopMatchList.run_until_complete(matchLists)

	loopMatchList.close()
	
	print(matchListInfo)
	
	'''
	# if "status" in matchList:
		# return "Not Found"
	
	matchIDs = [ match['gameId'] for match in matchList['matches']]
	

	loop = asyncio.get_event_loop()

	matches = asyncio.gather(*[getMatchData(matchID, region) for matchID in matchIDs])

	matchInfo = loop.run_until_complete(matches)

	loop.close()

	playerData = []
	

	for match in matchInfo:

		totalKills={100:0,200:0}

		playerRow = {}

		participantID = 0

		#print(match['participantIdentities'])

		# get participant ID for given summoner name
		for participant in match['participantIdentities']:
			if participant['player']['accountId'] == accountID:
				participantID = participant['participantId']
				break
		if participantID == 0:
			continue
			
		if participantID > 5:
			teamId = 200
		else:
			teamId = 100

		# get the participant's stats
		# and the kda totals for all participants
		enemyEarlyDeltaGold = []
		enemyPositions = []
		for participant in match['participants']:
			totalKills[participant['teamId']] += participant['stats']['kills']
			
			if not participant['teamId'] == teamId :
				if "goldPerMinDeltas" in participant['timeline']:
					if participant['timeline']['lane'] + "_" + participant['timeline']['role'] == "MIDDLE_DUO_SUPPORT":
						enemyPositions.append("JUNGLE_NONE")
						enemyEarlyDeltaGold.append({"lane":"JUNGLE", "role":"NONE", "goldPerMin":participant['timeline']['goldPerMinDeltas']['0-10']})
					else:
						enemyPositions.append(participant['timeline']['lane'] + "_" + participant['timeline']['role'])
						enemyEarlyDeltaGold.append({"lane":participant['timeline']['lane'], "role":participant['timeline']['role'], "goldPerMin":participant['timeline']['goldPerMinDeltas']['0-10']})
			
			if participant['participantId'] == participantID:
				participantStats = participant['stats']
				participantTimeline = participant['timeline']
				playerRow['position'] = participant['timeline']['lane'] + "_" + participant['timeline']['role']
				if playerRow['position'] == "MIDDLE_DUO_SUPPORT":
					playerRow['position'] = "JUNGLE_NONE"

		if (not playerRow['position'] in ["JUNGLE_NONE","TOP_SOLO","MIDDLE_SOLO","BOTTOM_DUO_CARRY","BOTTOM_DUO_SUPPORT"]) or (not playerRow['position'] in enemyPositions) or (not len(participantTimeline)>3):
			continue
			
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
		playerRow["cs"] = participantStats['totalMinionsKilled'] *60 / match['gameDuration']

		# make sure we don't divide by 0
		if participantStats['deaths'] > 0:
			playerRow["KDA"] = (participantStats['kills'] + participantStats['assists']) / participantStats['deaths']
		else:
			playerRow["KDA"] = participantStats['kills'] + participantStats['assists']

		# make sure we don't divide by 0
		if totalKills[participant['teamId']] > 0:
			playerRow["kp"] = (participantStats['kills'] + participantStats['assists']) / totalKills[participant['teamId']]
		else:
			playerRow["kp"] = 0

		playerRow["damageDealtToObjectives"] = participantStats['damageDealtToObjectives']
		playerRow["damageDealtToTurrets"] = participantStats['damageDealtToTurrets']
		playerRow["visionScore"] = participantStats['visionScore']
		playerRow["visionWardsBoughtInGame"] = participantStats['visionWardsBoughtInGame']
		playerRow["neutralMinionsKilledTeamJungle"] = participantStats['neutralMinionsKilledTeamJungle'] *60 / match['gameDuration']
		playerRow["neutralMinionsKilledEnemyJungle"] = participantStats['neutralMinionsKilledEnemyJungle'] *60 / match['gameDuration']
		playerRow["damageDealtToChampions"] = participantStats['totalDamageDealtToChampions']
		
		playerRow["csDiffPerMinDeltas"] = participantTimeline['csDiffPerMinDeltas']['0-10'] if "csDiffPerMinDeltas" in participantTimeline else 0
		playerRow["damageTakenDiffPerMinDeltas"] = participantTimeline['damageTakenDiffPerMinDeltas']['0-10'] if "damageTakenDiffPerMinDeltas" in participantTimeline else 0
		playerRow["xpDiffPerMinDeltas"] = participantTimeline['xpDiffPerMinDeltas']['0-10'] if "xpDiffPerMinDeltas" in participantTimeline else 0
		
		for e in enemyEarlyDeltaGold:
			if playerRow['position'] == e["lane"] + "_" + e['role']:
				positionFound = True
				playerRow["goldDiffPerMinDeltas"] = participantTimeline['goldPerMinDeltas']['0-10'] - e['goldPerMin']
			
		
		playerData.append(playerRow)

	df = pd.DataFrame(playerData)
	sMean = df.mean()
	sMean.name="ALL"
	dfSend = df.groupby("position").mean()
	dfSend['count'] = df.groupby("position").size()
	sMean['count'] = dfSend['count'].sum()
	dfSend = dfSend.append(sMean)
	return dfSend.T.to_dict()'''

	
def getPlayerStats(summonerName, region):
	
	accountID, summonerID = getIDFromSummonerName(summonerName, region)
	
	playerStats = getWeekPlayerStats(accountID, region)
	
	
	print(json.dumps(playerStats))

getPlayerStats(player, region)