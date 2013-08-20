var apiBase = 'http://en.wikipedia.org/w/api.php?action=query&format=json&callback=?',
	movie = new EJS({url: 'movie.ejs'}),
	movieReqs = null,
	linkReqs = null,
	pageReqs = null,
	startTime;

var movieActorHash = {"Dr._No_(film)":"Sean Connery;Ursula Andress;Joseph Wiseman;Jack Lord;John Kitzmiller","From_Russia_with_Love_(film)":"Sean Connery;Pedro Armendáriz;Lotte Lenya;Robert Shaw;Bernard Lee;Daniela Bianchi","Goldfinger_(film)":"Sean Connery;Gert Fröbe;Honor Blackman;Harold Sakata;Bernard Lee","Thunderball_(film)":"Sean Connery;Claudine Auger;Adolfo Celi;Luciana Paluzzi;Rik Van Nutter;Desmond Llewelyn;Bernard Lee","You_Only_Live_Twice_(film)":"Sean Connery;Mie Hama;Donald Pleasence;Akiko Wakabayashi","On_Her_Majesty's_Secret_Service_(film)":"George Lazenby;Diana Rigg;Telly Savalas;Bernard Lee;Gabriele Ferzetti","Diamonds_Are_Forever_(film)":"Sean Connery;Jill St. John;Charles Gray;Lana Wood;Bernard Lee","Live_and_Let_Die_(film)":"Roger Moore;Yaphet Kotto;Jane Seymour;David Hedison;Bernard Lee","The_Man_with_the_Golden_Gun_(film)":"Roger Moore;Christopher Lee;Britt Ekland;Maud Adams;Hervé Villechaize;James Cossins;Clifton James;Bernard Lee","The_Spy_Who_Loved_Me_(film)":"Roger Moore;Barbara Bach;Curd Jürgens;Richard Kiel;Caroline Munro;Geoffrey Keen;Walter Gotell;Bernard Lee","Moonraker_(film)":"Roger Moore;Michael Lonsdale;Lois Chiles;Richard Kiel;Bernard Lee","For_Your_Eyes_Only_(film)":"Roger Moore;Julian Glover;Carole Bouquet;Chaim Topol;Lynn-Holly Johnson","Octopussy":"Roger Moore;Maud Adams;Louis Jourdan;Steven Berkoff;Desmond Llewelyn;Kristina Wayborn","Never_Say_Never_Again":"Sean Connery;Kim Basinger;Klaus Maria Brandauer;Barbara Carrera;Max von Sydow;Bernie Casey;Rowan Atkinson","A_View_to_a_Kill":"Roger Moore;Tanya Roberts;Grace Jones;Patrick Macnee;Christopher Walken","The_Living_Daylights":"Timothy Dalton;Maryam d'Abo;Jeroen Krabbé;Art Malik;John Rhys-Davies;Joe Don Baker","Licence_to_Kill":"Timothy Dalton;Carey Lowell;Robert Davi;Talisa Soto","GoldenEye":"Pierce Brosnan;Sean Bean;Izabella Scorupco;Famke Janssen;Judi Dench","Tomorrow_Never_Dies":"Pierce Brosnan;Jonathan Pryce;Michelle Yeoh;Teri Hatcher;Judi Dench","The_World_Is_Not_Enough":"Pierce Brosnan;Sophie Marceau;Robert Carlyle;Denise Richards;Judi Dench","Die_Another_Day":"Pierce Brosnan;Halle Berry;Toby Stephens;Rick Yune;Rosamund Pike;Judi Dench","Casino_Royale_(2006_film)":"Daniel Craig;Eva Green;Mads Mikkelsen;Judi Dench","Quantum_of_Solace":"Daniel Craig;Olga Kurylenko;Mathieu Amalric;Gemma Arterton;Judi Dench;Jeffrey Wright;Giancarlo Giannini","Skyfall":"Daniel Craig;Javier Bardem;Ralph Fiennes;Naomie Harris;Bérénice Marlohe;Albert Finney;Judi Dench"};

$("#exportedPage").hide();
$("#export").hide();

function br(arr,sz) {
	var broken = []
	for(var i=0;i<arr.length;i+=sz) broken.push(arr.slice(i,i+sz));
	return broken;
}

function constructLocation(location, moviePage) {
	var i = moviePage.indexOf(location.title),
			text = [],
			titleLen = location.title.length;

	while(i!=-1) {
		var start = Math.max(0,i-50), end = Math.min(moviePage.length,i+titleLen+50), length = end-i+titleLen+1;
		while(start > 0 && moviePage.charAt(start) != ' ') start--;
		while(end < moviePage.length && moviePage.charAt(end) != ' ') end++;
		text.push("...."+moviePage.substr(start,end-start+1)+"....");
		//text.push("...."+moviePage.substr(start,50)+"<b><i>"+location.title+"</i></b>"+moviePage.substr(i+titleLen,length)+"....");
		i = moviePage.indexOf(location.title,i+1);
	}
	return {
		title: location.title,
		coordinates: {
			lat: location.coordinates[0].lat,
			lon: location.coordinates[0].lon,
		},
		text: text,
	}
}

function getLocations(locationPages, moviePage) {
	var locations = [];
	$.each(locationPages, function(index,page) {
		if(page.coordinates) locations.push(constructLocation(page, moviePage));
	});
	return locations;
}

function getOnlyValue(obj) {
	for(var key in obj) return obj[key];
}

function showLocations(info) {
	$("#movieList").append(movie.render(info));
}

function searchForLocations(movie, titles, page, imageurl) {
	var slices = br(titles,50),
		locations = [],
		replyCount = 0;

	for(var i=0;i<slices.length;i++) {
		linkReqs.push($.get(apiBase+'&prop=coordinates&titles='+$.map(slices[i],encodeURIComponent).join("|"), 
			function(data) {
				locations = locations.concat(getLocations(data.query.pages,page));
				if(++replyCount == slices.length) showLocations({movie:movie,locations:locations,imageurl:imageurl,actors:movieActorHash[movie]});
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
	$("#movieList").html("");
	movieReqs = [], linkReqs = [], pageReqs = [];
	$.each(movies, function(index, movie) {
		movieReqs.push($.get(apiBase+"&prop=links|extracts|pageimages&titles="+movie+"&pllimit=5000&explaintext&pithumbsize=250", function(data) {
			props = getOnlyValue(data.query.pages);
			linkList = props.links; // a list of links, not linked list
			page = props.extract;
			imageurl = props.thumbnail.source;
			titles = $.map(linkList, function(link) { return link.title; });
			searchForLocations(movie,titles,page,imageurl);
		}, "json"));
	});
	whenDone(movieReqs, function() {
		whenDone(linkReqs, function() {
			$("#status").html("done");
			$("#timeTaken").html((new Date()-startTime)/1000 + "s");
			$("#export").show();
		});
	});
});

$("#export").click(function(e) {
	var csv = "";
	$.each($("input:radio:checked"),function(index,value) {
		csv += value.value + "\n";
	});
	$("#csv").html(csv);
	$("#exportedPage").show();
});

$("#back").click(function(e) {
	$("#exportedPage").hide();
})

function removeSpecialChars(a) {
	return a.replace(/[\n,]/g,'');
}