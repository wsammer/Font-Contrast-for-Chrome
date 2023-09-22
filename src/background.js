/**
 * Copyright (C) 2019 Francesco Fusco. All rights reserved.
 * License: https://github.com/Fushko/font-contrast#license
 */
'use strict';

const storage = chrome.storage.local;

const title_apply  = 'Apply contrast fix!';
const title_remove = 'Remove contrast fix!';

const tabs          = new Set();
const disabled_tabs = new Set();

chrome.runtime.onInstalled.addListener(function(details) {

	if (details.reason === 'install') {

		const defaults = {
			'globalStr': 0,
			'size': 0,
			'sizeThreshold': 12,
			'brightness': 50,
			'skipColoreds': true,
			'skipWhites': true,
			'enableEverywhere': true
		};

		storage.set(defaults);

		chrome.tabs.create({ url: 'Welcome.html' });
		return;
	}
});


chrome.runtime.onMessage.addListener( async (request, sender, sendResponse) => {

	if (request.from !== 'toggle')
		return;

	let title;
	let path;

	if (request.enabled) {
		title = title_remove;
		path = 'assets/icons/on.png';

		tabs.add(sender.tab.id);
		disabled_tabs.delete(sender.tab.id);
	} else {
		title = title_apply;
		path  = 'assets/icons/off.png';

		tabs.delete(sender.tab.id);
		disabled_tabs.add(sender.tab.id);
	}

});

chrome.tabs.onUpdated.addListener(function(tabId, change_info, tab)  {

	if (change_info.status !== 'complete')
		return;

	const url = tab.url;
	let hostname = '';

	if (url.startsWith('file://')) {
		hostname = url;
	} else {
		const matches = url.match(/\/\/(.+?)\//);

		if (matches)
			hostname = matches[1];
	}

	const data = [
		'whitelist',
		'blacklist',
		'enableEverywhere',
	];

	storage.get(data, items => {

		const blacklist = items.blacklist || [];

		if (blacklist.find(o => o.url === hostname)) {
			return;
		}

	});
});

chrome.commands.onCommand.addListener(function(command)  {

	const tabs = chrome.tabs.query({ currentWindow: true, active: true });
	const id   = tabs[0].id;

	toggle(chrome.browserAction.getTitle({ tabId: id }), id);
});

chrome.tabs.onRemoved.addListener(function(tab) {
	tabs.delete(tab.id);
	disabled_tabs.delete(tab.id);
});

function toggle(title, tab_id)
{

}
