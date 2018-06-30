function explore(pointer, string, orig, target) {
	for (var i = 0; i < string.length; i++) {
		var letter = string[i];
		if (letter == outside) continue;
		if (!(letter in pointer)) return 0;
		pointer = pointer[letter];
	}
	var max_count = 1, target_count = 1, orig_count = 1;
	if (typeof pointer != "number") {
		for (possibility in pointer) {
			if (possibility == self) continue;
			freq = extract_freq(pointer[possibility]);
			if (freq > max_count) max_count = freq;
		}
		if (target in pointer) target_count = extract_freq(pointer[target])
		for (var i = 0; i < orig.length; i++) {
			letter = orig[i];
			if (i == orig.length - 1) letter = anything;
			if (!(letter in pointer)) break;
			pointer = pointer[letter];
			orig_count = Math.max(extract_freq(pointer), 1);
		}
	}
	return target_count/max_count;
}

function extract_freq(dic) {
	var freq = dic;
	if (typeof freq != "number") {
		if (self in dic) freq = dic[self];
		else freq = 0;
	}
	return freq;
}

function pad(x) {
	return padding+boundary+x+boundary+padding;
}

function suggest(word) {
	word = pad(word);
	var string = word.toLowerCase();
	var confidence = 1;
	var couldWork = false;
	for (potential in unreplace) {
		if (string.indexOf(potential) > -1) {
			couldWork = true;
			break;
		}
	}
	if (couldWork) {
		for (var pos = 2; pos < string.length-3; pos++) {
			orig = string.substring(pos, pos+2);
			if (orig in unreplace) {
				target = unreplace[orig];
				prob_b = explore(probs_before, string.substring(pos-lookaround-1, pos), orig, target);
				prob_a = explore(probs_after, string.substring(pos+2, pos+lookaround+2).split("").reverse().join(""), orig, target);
				prob = Math.max(prob_a, prob_b);
				if (prob > 0.02) {
					word = word.substring(0, pos)+target+word.substring(pos+2, word.length);
					string = string.substring(0, pos)+target+string.substring(pos+2, string.length);
					pos -= 2;
					confidence *= prob;
				} else {
					confidence *= (1 - prob);
				}
			}
		}
	}
	return [word.substring(lookaround+1, word.length-lookaround-1), confidence];
}

var enabled = true, data = {}, unreplace, outside, boundary, self, anything, lookaround, padding, probs_before, probs_after;

fetch(chrome.extension.getURL("/src/dump.json"))
	.then(function(response) { return response.json(); })
	.then(function(payload) {
		data = payload;
		outside = data.params.outside;
		boundary = data.params.boundary;
		self = data.params.self;
		anything = data.params.anything;
		lookaround = data.params.lookaround;
		unreplace = data.params.unreplace;
		probs_before = data.before;
		probs_after = data.after;
		padding = new Array(lookaround+1).join(outside);
	});

chrome.storage.sync.get(["enabled"], function(result) {
	if (typeof result.enabled == "undefined") result.enabled = true;
	enabled = result.enabled;
	updateIcon();
});

function updateIcon() {
	if (enabled) {
		chrome.browserAction.setIcon({
			path : {
				"16": "icons/icon16.png",
				"48": "icons/icon48.png",
				"32": "icons/icon32.png",
				"128": "icons/icon128.png"
			}
		});
		chrome.browserAction.setTitle({ title: "Umlauter" });
	} else {
		chrome.browserAction.setIcon({
			path : {
				"16": "icons/disabled/icon16.png",
				"48": "icons/disabled/icon48.png",
				"32": "icons/disabled/icon32.png",
				"128": "icons/disabled/icon128.png"
			}
		});
		chrome.browserAction.setTitle({ title: "Umlauter aus" });
	}
}

chrome.runtime.onMessage.addListener(function(req, sender, sendResponse) {
	if (enabled) {
		suggestion = suggest(req.word);
		req.replacement = suggestion[0];
		req.confidence = suggestion[1];
		sendResponse(req);
	} else {
		sendResponse(false);
	}
});

chrome.browserAction.onClicked.addListener(function() {
	chrome.storage.sync.get(["enabled"], function(result) {
		enabled = !result.enabled;
		chrome.storage.sync.set({ "enabled": enabled }, updateIcon);
	});
})

chrome.runtime.onInstalled.addListener(function(e) {
	if (chrome.runtime.OnInstalledReason.INSTALL == e.reason) {
		var region = "";
		if (chrome.i18n.getMessage("@@ui_locale").indexOf("de") > -1) region = "_de";
		chrome.tabs.create({
			url: chrome.extension.getURL("/src/install/index"+region+".html")
		});
	}
});
