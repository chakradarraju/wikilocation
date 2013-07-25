import urllib, urllib2, json, sys
from datetime import datetime

api = 'http://en.wikipedia.org/w/api.php?action=query&format=json'

def get(url):
	return urllib2.urlopen(url).read()

def getAsJson(url):
	return json.loads(get(url))

def getUrl(title,limit):
	return api+'&prop=links&titles='+urllib.quote(title)+'&pllimit='+str(limit)

def getWikiLinks(title,limit):
	return getAsJson(getUrl(title,limit))

def getPages(response):
	return response['query']['pages']

def getFirstPage(response):
	pageid, page = getPages(response).popitem()
	return page

def isLocation(title):
	url = api+'&prop=coordinates&titles='+urllib.quote(title)
	return 'coordinates' in getFirstPage(getAsJson(url))

def getLocations(pages):
	return [page['title'] for id, page in pages.items() if ('coordinates' in page)]

def myBreak(arr,length):
	broken = []
	num = (len(arr)-1)/length
	for i in range(num):
		broken.append(arr[i*length:(i+1)*length])
	broken.append(arr[num*length:])
	return broken

def getWikiLocations(title):
	print 'Getting links for '+title
	links = [link['title'] for link in getFirstPage(getWikiLinks(title,5000))['links']]
	locations = []
	processed = 0
	print 'Got all links'
	for slice in myBreak(links,50):
		titles = "|".join([urllib.quote(link.encode('utf8')) for link in slice])
		url = api+'&prop=coordinates&titles='+titles
		locations += getLocations(getPages(getAsJson(url)))
		processed += len(slice)
		print "Processed "+str(processed)+" links, Got "+str(len(locations))+" locations"
	return locations

gstart = datetime.now()
for movie in sys.argv[1:]:
	start = datetime.now()
	locations = getWikiLocations(movie)
	print "Locations for "+movie+": "+", ".join(locations)
	timetaken = (datetime.now()-start).seconds
	print "Time taken for "+movie+": "+str(timetaken)+"s"

print "Total time taken: "+str((datetime.now()-gstart).seconds)+"s"
