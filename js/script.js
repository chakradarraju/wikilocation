var apiBase = 'http://en.wikipedia.org/w/api.php?action=query&format=json&callback=?',
	movie = new EJS({url: 'movie.ejs'}),
	movieReqs = null,
	linkReqs = null,
	startTime;

function br(arr,sz) {
	var broken = []
	for(var i=0;i<arr.length;i+=sz) broken.push(arr.slice(i,i+sz));
	return broken;
}

function getLocations(pages) {
	var locations = [];
	$.each(pages, function(index,page) {
		if(page.coordinates) locations.push(page.title);
	});
	return locations;
}

function getOnlyValue(obj) {
	for(var key in obj) return obj[key];
}

function showLocations(info) {
	$("#movieList").append(movie.render(info));
}

function searchForLocations(movie, titles) {
	var slices = br(titles,50),
		locations = [],
		replyCount = 0;

	for(var i=0;i<slices.length;i++) {
		linkReqs.push($.get(apiBase+'&prop=coordinates&titles='+$.map(slices[i],encodeURIComponent).join("|"), 
			function(data) {
				locations = locations.concat(getLocations(data.query.pages));
				if(++replyCount == slices.length) showLocations({movie:movie,locations:locations});
			}, "json"));
	}
}

function whenDone(promiseArray, callback) {
	$.when.apply({}, promiseArray).done(callback);
}

$("#fetchBtn").click(function(e) {
	if(!movie) alert("Empty movie name");
	startTime = new Date();
	$("#status").html("fetching");
	var movies = $("#movieNames").val().split(",");
	movieReqs = [], linkReqs = [];
	$.each(movies, function(index, movie) {
		movieReqs.push($.get(apiBase+"&prop=links&titles="+movie+"&pllimit=5000", function(data) {
			linkList = getOnlyValue(data.query.pages).links; // a list of links, not linked list
			titles = $.map(linkList, function(link) { return link.title; });
			searchForLocations(movie,titles);
		}, "json"));
	});
	whenDone(movieReqs, function() {
		whenDone(linkReqs, function() {
			$("#status").html("done");
			$("#timeTaken").html((new Date()-startTime)/1000 + "s");
		});
	});
});
