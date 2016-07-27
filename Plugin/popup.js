chrome.extension.getBackgroundPage().getTimeSaved(function(result){
	if(typeof result === 'undefined'){
		document.getElementById("time").innerHTML = "0";
	}
	else{
		document.getElementById("time").innerHTML = Math.round(result/1000) + " seconds";	
	}
});

chrome.extension.getBackgroundPage().getDownloadsSaved(function(result){
	if(typeof result === 'undefined'){
		document.getElementById("downloads").innerHTML = "0";
	}
	else{
		document.getElementById("downloads").innerHTML = result + "";	
	}
});

chrome.extension.getBackgroundPage().getBandwidthSaved(function(result){
	if(typeof result === 'undefined'){
		document.getElementById("bandwidth").innerHTML = "0";
	}
	else{
		document.getElementById("bandwidth").innerHTML = Math.round(result/1024) + " KBs";	
	}
});