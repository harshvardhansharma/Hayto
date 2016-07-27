chrome.runtime.onInstalled.addListener(function(details){
	if(details.reason === "install"){
		chrome.tabs.create({url: "index.html"});	
	}
});

//tab switch
chrome.tabs.onCreated.addListener(function(tab){
	chrome.notifications.getAll(function(notifications){
		if(typeof notifications.haytoTab != 'undefined'){
			chrome.notifications.clear("haytoTab");
		}
	});
});

chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab){
	if(!tab.url.startsWith("chrome:") && tab.status == 'complete'){
		changeAndUpdate(tab);
	}
});

function changeAndUpdate(tab){	
	var queryObject = {active: false, currentWindow: true, status: 'complete', url: tab.url, title: tab.title};
	chrome.tabs.query(queryObject, function(result){
		if(result.length > 0 && tab.id != result[0].id){
			var i = result[0].id;
			var nIcon = chrome.extension.getURL("iconNotification.png");
			var nTitle = "Hayto!";
			var nMessage = "Same tab already open. Switch?";
			var nButtons = [{ title: "Yes", iconUrl: "success.png" }, { title: "No", iconUrl: "unsuccess.png" }];
			var nOptions = { type: "basic", iconUrl: nIcon, priority: 1, title: nTitle, message: nMessage, buttons: nButtons };

			chrome.notifications.create("haytoTab", nOptions, function(nid){
				setTimeout(function(){
						chrome.notifications.clear(nid);
				}, 5000);

				chrome.notifications.onButtonClicked.addListener(function(nid, bid){
					chrome.notifications.clear(nid);
					if(bid == 0){
						chrome.tabs.update(i, {active: true});
						if(tab != null){
							chrome.tabs.remove(tab.id);	
						}
					}
				});
			});
		}
	});
}

chrome.downloads.onCreated.addListener(function(result){
	if(result.state == 'in_progress'){
		chrome.downloads.pause(result.id, function(){
			var query = {urlRegex: extractDomain(result.url), url: result.url, state: 'complete', exists: true, mime: result.mime};
			chrome.downloads.search(query, function(downloadHistory){
				if(downloadHistory.length > 0 && downloadHistory[0].fileSize > 0){
					console.log(result);
					openDownloadNotification(downloadHistory[0].id, result.id, downloadHistory[0].filename, function(downloaded){
						if(!downloaded){
							chrome.downloads.setShelfEnabled(false);
							chrome.downloads.cancel(result.id);

							var timeSaved = new Date(downloadHistory[0].endTime).getTime() - new Date(downloadHistory[0].startTime).getTime();
							var bandwidthSaved = downloadHistory[0].fileSize;
							console.log("timeSaved: "+ timeSaved);
							console.log("timeSaved: "+ bandwidthSaved);
							updateTimeSaved(timeSaved);
							updateBandwidthSaved(bandwidthSaved);
							updateDownloadsSaved(1);
							
							var eraseQuery = {id: result.id};
							chrome.downloads.erase(eraseQuery);
						}
						else if(downloaded == 'closed'){
							chrome.downloads.setShelfEnabled(true);
							chrome.downloads.cancel(result.id);
							chrome.runtime.reload();
						}
						else{
							chrome.downloads.setShelfEnabled(true);
							chrome.downloads.resume(result.id);
							chrome.runtime.reload();
						}
					});
				}
				else{
					chrome.downloads.setShelfEnabled(true);
					chrome.downloads.resume(result.id);	
				}
			});
		});
	}
});

function openDownloadNotification(oldDownloadId, newDownloadId, absFileName, callback){
	var fileName = getFileName(absFileName);

	var nIcon = chrome.extension.getURL("iconNotification.png");
	var nTitle = "Hayto!";
	var nMessage = fileName + " is already downloaded.";
	var nButtons = [{ title: "Open already downloaded file", iconUrl: "success.png" }, { title: "Download again", iconUrl: "unsuccess.png" }];

	var nOptions = { type: "basic", iconUrl: nIcon, priority: 2, title: nTitle, message: nMessage, buttons: nButtons };

	chrome.notifications.create(oldDownloadId + "", nOptions, function(nid){
		setTimeout(function(){
				chrome.notifications.clear(nid);
		}, 10000);

		chrome.notifications.onButtonClicked.addListener(function(nid, bid){
			if(bid == 0){
				callback(false);
				chrome.downloads.open(parseInt(oldDownloadId));
				chrome.notifications.clear(nid);
			}
			else{
				callback(true);
				chrome.notifications.clear(nid);
			}
		});

		chrome.notifications.onClosed.addListener(function (nid, byUser){
			callback("closed");
		});
	});
}

function getFileName(absFileName){
	orgFileName = absFileName.replace(/^.*(\\|\/|\:)/, '');
	if(orgFileName.length > 18){
		return orgFileName.substring(0, 9) + "...  " + orgFileName.substring(orgFileName.length - 4);
	}
	else{
		return orgFileName;
	}
}

function extractDomain(url) {
    var domain;
    if (url.indexOf("://") > -1) {
        domain = url.split('/')[2];
    }
    else {
        domain = url.split('/')[0];
    }

    domain = domain.split(':')[0];
    return domain;
}

function updateTimeSaved(timeSaved){
	getTimeSaved(function(result){
		if(typeof result == 'undefined'){
			result = 0;
		}
		setTimeSaved(result + timeSaved);
	});
}

function updateBandwidthSaved(bandwidthSaved){
	getBandwidthSaved(function(result){
		if(typeof result == 'undefined'){
			result = 0;
		}
		setBandwidthSaved(result + bandwidthSaved);
	});
}

function updateDownloadsSaved(downloadsSaved){
	getDownloadsSaved(function(result){
		if(typeof result == 'undefined'){
			result = 0;
		}
		setDownloadsSaved(result + downloadsSaved);
	});
}

function setTimeSaved(time){
	chrome.storage.sync.set({ "time" : time });	
}

function setDownloadsSaved(download){
	chrome.storage.sync.set({ "download" : download }, function(){
		//chrome.runtime.reload();
	});		
}

function setBandwidthSaved(bandwidth){
	chrome.storage.sync.set({ "bandwidth" : bandwidth });			
}

function getTimeSaved(callback){
	chrome.storage.sync.get("time", function(items){
		if(!chrome.runtime.error){
			callback(items.time);
		}
		else if(typeof items == 'undefined'){
			callback(0);	
		}
		else{
			callback(0);
		}			
	});
}

function getDownloadsSaved(callback){
	chrome.storage.sync.get("download", function(items){
		if(!chrome.runtime.error){
			callback(items.download);
		}
		else{
			callback(0);
		}			
	});
}

function getBandwidthSaved(callback){
	chrome.storage.sync.get("bandwidth", function(items){
		if(!chrome.runtime.error){
			callback(items.bandwidth);
		}
		else{
			callback(0);
		}
	});
}