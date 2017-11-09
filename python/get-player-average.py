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
	#print(url)

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
        # limit the matches to those that are for Summoner's Rift 5v5 Draft Pick, 5v5 Ranked Solo, 5v5 Blind Pick, and 5v5 Ranked Flex games
        url = "https://" + region + ".api.riotgames.com/lol/match/v3/matchlists/by-account/" + str(accountID) + "?queue=400&queue=420&queue=430&queue=440"

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

    accountID = getAccountIDFromSummonerName(summonerName, region)
    matchList = getMatchList(accountID, region)

    matchLimit = 10
    matchesAnalyzed = 0

    for matchInfo in matchList['matches']:
        if matchesAnalyzed < matchLimit:

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
            matchStats["cs"].append(participantStats['totalMinionsKilled'])

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
            matchStats["neutralMinionsKilledTeamJungle"].append(participantStats['neutralMinionsKilledTeamJungle'])
            matchStats["neutralMinionsKilledEnemyJungle"].append(participantStats['neutralMinionsKilledEnemyJungle'])
            matchStats["totalDamageDealtToChampions"].append(participantStats['totalDamageDealtToChampions'])
            #matchStats[""].append(participantStats[''])

            matchesAnalyzed += 1

    for statName, statValues in matchStats.items():
        #print(statName, statValues)
        averageStats[statName] = mean(statValues)

    return averageStats

region = "na1"

# accountID = getAccountIDFromSummonerName("Xero Vortex", region)
# print(accountID)
#
# matchList = getMatchList(accountID, region)
# #print(matchList['matches'][1])
#
# match = getMatchData(matchList['matches'][1]['gameId'], region)
# print(match)

averageStats = getAverageStatsFromSummonerName("Xero Vortex", region)

#print(averageStats)
#print(getAccountIDFromSummonerName("Canisback","euw1"))
print(averageStats)

#print(test)
