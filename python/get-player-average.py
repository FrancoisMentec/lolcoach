import requests

API_KEY = open("./data/API_KEY").read()

def mean(numbers):
    return float(sum(numbers)) / max(len(numbers), 1)


def isValidRegion(region):
    # TODO: fill this in
    return True


def getAPIData(url):
	#dictionary to hold extra headers
	HEADERS = {"X-Riot-Token":API_KEY}
	print(url)
	r = requests.get(url, headers=HEADERS);
	return r.json();


def getAccountIDFromSummonerName(summonerName, region):
    #https://na1.api.riotgames.com/lol/summoner/v3/summoners/by-name/

    # make sure the region is valid
    if isValidRegion(region) == False:
        return ""
    else:
        url = "https://" + region + ".api.riotgames.com/lol/summoner/v3/summoners/by-name/" + summonerName

        summonerInfo = getAPIData(url)

        return summonerInfo['accountId']


def getMatchList(accountID, region):
    #https://na1.api.riotgames.com/lol/match/v3/matchlists/by-account/

    # make sure the region is valid
    if isValidRegion(region) == False:
        return ""
    else:
        url = "https://" + region + ".api.riotgames.com/lol/match/v3/matchlists/by-account/" + str(accountID)

        return getAPIData(url)


def getMatchData(matchID, region):
    #https://na1.api.riotgames.com/lol/match/v3/matches/

    # make sure the region is valid
    if isValidRegion(region) == False:
        return ""
    else:
        url = "https://" + region + ".api.riotgames.com/lol/match/v3/matches/" + str(matchID)

        return getAPIData(url)

def getAverageStatsFromSummonerName(summonerName, region):

    matchStats = {
        "cs": []
        , "kda": []
        #, "kp": []
        #, "assists": []
    }

    averageStats = {}

    accountID = getAccountIDFromSummonerName(summonerName, region)
    matchList = getMatchList(accountID, region)

    matchLimit = 10
    matchesAnalyzed = 0

    for matchInfo in matchList['matches']:
        if matchesAnalyzed < matchLimit:

            match = getMatchData(matchInfo['gameId'], region)
            participantID = 0
            participantStats = []

            #print(match['participantIdentities'])

            # get participant ID for given summoner name
            for participant in match['participantIdentities']:
                if participant['player']['accountId'] == accountID:
                    participantID = participant['participantId']
                    break

            #print("Participant: " + str(participantID))

            # get the participant's stats
            for participant in match['participants']:
                if participant['participantId'] == participantID:
                    participantStats = participant['stats']
                    break


            #print(participantStats)

            # CS
            # KDA
            # KP
            # Objective (Dragon, Herald, Turrets, ...)
            # Damage objective (damageDealtToObjectives)
            # Damage to buildings (damageDealtToTurrets)
            # Match timeline data
            # csDiffPerMinDeltas
            # goldPerMinDeltas
            # xpDiffPerMinDeltas
            # creepsPerMinDeltas
            # xpPerMinDeltas
            # damageTakenDiffPerMinDeltas
            # damageTakenPerMinDeltas
            # visionScore (matches)
            # visionWardsBoughtInGame (matches)
            # neutralMinionsKilledTeamJungle
            # neutralMinionsKilledEnemyJungle
            # totalDamageDealtToChampions

            # TODO: check if the stat exists first
            matchStats["cs"].append(participantStats['totalMinionsKilled'])
            # make sure we don't divide by 0
            if participantStats['deaths'] > 0:
                matchStats["kda"].append((participantStats['kills'] + participantStats['assists']) / participantStats['deaths'])
            else:
                matchStats["kda"].append(participantStats['kills'] + participantStats['assists'])

            #matchStats["kp"].append(participantStats['deaths'])
            #matchStats["assists"].append(participantStats['assists'])
            #, "objectiveDamage":

            matchesAnalyzed += 1

    for statName, statValues in matchStats.items():
        #print(statName, statValues)

        averageStats[statName] = mean(statValues)

    return averageStats

#match = getAPIData("https://na1.api.riotgames.com/lol/match/v3/matches/2625251884")
#print(match)

region = "na1"

# accountID = getAccountIDFromSummonerName("Xero Vortex", region)
# print(accountID)
#
# matchList = getMatchList(accountID, region)
# #print(matchList['matches'][1])
#
# match = getMatchData(matchList['matches'][1]['gameId'], region)
# print(match)

#averageStats = getAverageStatsFromSummonerName("Xero Vortex", region)

#print(averageStats)
#print(getAccountIDFromSummonerName("Canisback","euw1"))