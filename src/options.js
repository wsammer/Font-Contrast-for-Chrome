/**
 * Copyright (C) 2019 Francesco Fusco. All rights reserved.
 * License: https://github.com/Fushko/font-contrast#license
 */


let doc = document;

// Sliders
let strSlider       = doc.querySelector("#strSlider");
let strLabel        = doc.querySelector("#strLabel");
let sizeSlider      = doc.querySelector("#sizeSlider");
let sizeLabel       = doc.querySelector("#sizeLabel");
let threshSlider    = doc.querySelector("#threshSlider");
let threshLabel     = doc.querySelector("#threshLabel");
const brt_slider    = doc.querySelector('#brt-slider');
const brt_label     = doc.querySelector('#brt-label');

// Options
let skipHeadings    = doc.querySelector('#skipHeadings');
let skipColoreds    = doc.querySelector('#skipColoreds');
let globalEnabled   = doc.querySelector('#defaultEn');
let advDimming      = doc.querySelector('#advDimming');
let boldText        = doc.querySelector('#boldText');
let forcePlhdr      = doc.querySelector('#forcePlhdr');
let forceOpacity    = doc.querySelector('#forceOpacity');
let skipWhites      = doc.querySelector('#skipWhites');
let underlineLinks  = doc.querySelector('#underlineLinks');
const input_border  = doc.querySelector('#input-border');

// Whitelist
let WLtable         = doc.querySelector('#whitelist');
let WLaddButton     = doc.querySelector('#add');
let WLresetButton   = doc.querySelector('#reset');
let WLtextarea      = doc.querySelector('#urltext');
let WLheader        = doc.getElementById("header");
let WLtbody         = doc.querySelector("#WLtbody");

// Blacklist
let BLtable         = doc.querySelector('#blacklist');
let BLaddButton     = doc.querySelector('#BLadd');
let BLresetButton   = doc.querySelector('#BLreset');
let BLtextarea      = doc.querySelector('#BLurltext');
let BLheader        = doc.getElementById("BLheader");
let BLtbody         = doc.querySelector("#BLtbody");

let wl = [];
let bl = [];

function addRow(item, is_wl)
{
	let table;
	let list, list_name;

	if (is_wl) {
		list = wl;
		list_name = 'whitelist';
		header = WLheader;
		table = WLtbody;
	} else {
		list = bl;
		list_name = 'blacklist';
		header = BLheader;
		table = BLtbody;
	}

	const row = table.insertRow(-1);

	const url_cell = row.insertCell(0);

	url_cell.innerText = item.url;
	url_cell.setAttribute("contenteditable", "true");

	url_cell.onkeyup = () => {
		item.url = url_cell.innerText;
		chrome.storage.local.set({ [list_name]: list });
	};

	if (is_wl) {
		const strCell = row.insertCell(1);
		strCell.innerText = item.strength;
		strCell.setAttribute("contenteditable", "true");

		strCell.onkeyup = (e) => {
			let new_str = parseInt(strCell.innerText);

			if (new_str > 100)
				new_str = 100;
			else if (new_str < -100)
				new_str = -100;

			item.strength = new_str || strSlider.value;

			list[list.findIndex(o => o.url === url_cell.innerText)] = item;

			chrome.storage.local.set({'whitelist': list});
		};

		strCell.onkeydown = (e) => {

			/**
			 * Keyup/Keydown
			 * left arrow:   e.which = 37,  e.keyCode = 37
			 * right arrow:  e.which = 39,  e.keyCode = 39
			 * backspace:    e.which = 8,   e.keyCode = 8
			 * dash:         e.which = 173, e.keyCode = 173
			 * enter:        e.which = 13,  e.keyCode = 13
			 * We need both keyup and keydown if we want to save the settings immmediately
			 * Because keydown lags behind one character, but keyup's preventDefault() doesn't work
			 */
			const allowed_keys = [8, 37, 39, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 173];
			const is_allowed = allowed_keys.includes(e.keyCode) || allowed_keys.includes(e.which);

			if (!is_allowed)
				e.preventDefault();
		};
	}

	const rem_btn = doc.createElement("button");

	rem_btn.innerText = "Remove";
	rem_btn.setAttribute("class", "remove");

	rem_btn.onclick = () => {
		table.deleteRow(row.rowIndex - 1);
		list.splice(list.findIndex(o => o.url === url_cell.innerText), 1);
		chrome.storage.local.set({[list_name]: list});
	};

	let cell_pos = 2;

	if (!is_wl)
		--cell_pos;

	row.insertCell(cell_pos).appendChild(rem_btn);
}

function init()
{
	addListeners();

	chrome.storage.local.get(['globalStr', 'size', 'sizeThreshold', 'brightness'], items => {
		strSlider.value       = items.globalStr;
		strLabel.innerText    = items.globalStr;
		sizeSlider.value      = items.size;
		sizeLabel.innerText   = items.size;
		threshSlider.value    = items.sizeThreshold;
		threshLabel.innerText = items.sizeThreshold;
		brt_slider.value      = items.brightness || 50;
		brt_label.innerText   = items.brightness || 50;
	});

	const checks = [
		"enableEverywhere",
		"skipColoreds",
		"skipHeadings",
		"advDimming",
		"boldText",
		"forceOpacity",
		"forcePlhdr",
		"skipWhites",
		"underlineLinks",
		"input_border"
	];

	chrome.storage.local.get(checks, i => {
		doc.getElementById("defaultEn").checked      = i.enableEverywhere;
		doc.getElementById("skipColoreds").checked   = i.skipColoreds;
		doc.getElementById("skipHeadings").checked 	 = i.skipHeadings;
		doc.getElementById("advDimming").checked     = i.advDimming;
		doc.getElementById("boldText").checked       = i.boldText;
		doc.getElementById("forceOpacity").checked   = i.forceOpacity;
		doc.getElementById("forcePlhdr").checked     = i.forcePlhdr;
		doc.getElementById("skipWhites").checked     = i.skipWhites;
		doc.getElementById("underlineLinks").checked = i.underlineLinks;
		input_border.checked = i.input_border;
	});

	chrome.storage.local.get('whitelist', item => {
		if (!item.whitelist)
			return;

		wl = item.whitelist;

		const list = Array.from(item.whitelist);

		for(const item of list)
			addRow(item, true);
	});

	chrome.storage.local.get('blacklist', item => {
		if (!item.blacklist)
			return;

		bl = item.blacklist;

		const list = Array.from(item.blacklist);

		for(const item of list)
			addRow(item, false);
	});
}

init();

function isChecked(check)
{
	return doc.getElementById(check).checked;
}

function addListeners()
{
	if (globalEnabled) {
	globalEnabled.onclick = () => {
		chrome.storage.local.set({'enableEverywhere': isChecked("defaultEn")});
	};
	}

	if (skipHeadings) {
	skipHeadings.onclick = () => {
		chrome.storage.local.set({'skipHeadings': isChecked("skipHeadings")});
	};
	}

	if (skipColoreds) {
	skipColoreds.onclick = () => {
		chrome.storage.local.set({'skipColoreds': isChecked("skipColoreds")});
	};
	}

	if (advDimming) {
	advDimming.onclick = () => {
		chrome.storage.local.set({'advDimming': isChecked("advDimming")});
	};
	}

	if (boldText) {
	boldText.onclick = () => {
		chrome.storage.local.set({'boldText': isChecked("boldText")});
	};
	}

	if (forcePlhdr) {
	forcePlhdr.onclick = () => {
		chrome.storage.local.set({'forcePlhdr': isChecked("forcePlhdr")});
	};
	}

	if (forceOpacity) {
	forceOpacity.onclick = () => {
		chrome.storage.local.set({'forceOpacity': isChecked("forceOpacity")});
	};
	}

	if (skipWhites) {
	skipWhites.onclick = () => {
		chrome.storage.local.set({'skipWhites': isChecked("skipWhites")});
	};
	}

	if (underlineLinks) {
	underlineLinks.onclick = () => {
		chrome.storage.local.set({'underlineLinks': isChecked("underlineLinks")});
	};
	}

	if (input_border) {
	input_border.onclick = () => {
		chrome.storage.local.set({'input_border': isChecked("input-border")});
	};
	}

	if (WLaddButton) WLaddButton.addEventListener('click', saveURL.bind(this, true));
	if (WLresetButton) WLresetButton.addEventListener('click', reset.bind(this, true));

	if (BLaddButton) BLaddButton.addEventListener('click', saveURL.bind(this, false));
	if (BLresetButton) BLresetButton.addEventListener('click', reset.bind(this, false));

	if (strSlider) {
	strSlider.oninput = () => {
		strLabel.innerText = strSlider.value;
	};
	}

	if (sizeSlider) {
	sizeSlider.oninput = () => {
		sizeLabel.innerText = sizeSlider.value;
	};
	}

	if (threshSlider) {
	threshSlider.oninput = () => {
		threshLabel.innerText = threshSlider.value;
	};
	}

	if (brt_slider) {
	brt_slider.oninput = () => {
		brt_label.innerText = brt_slider.value;
	};
	}

	if (brt_slider) {
	brt_slider.onchange = () => {
		chrome.storage.local.set({"brightness": brt_slider.value});
	};
	}

	if (strSlider) {
	strSlider.onchange = () => {
		chrome.storage.local.set({"globalStr": strSlider.value});
	};
	}

	if (sizeSlider) {
	sizeSlider.onchange = () => {
		chrome.storage.local.set({"size": sizeSlider.value});
	};
	}

	if (threshSlider) {
	threshSlider.onchange = () => {
		chrome.storage.local.set({"sizeThreshold": threshSlider.value});
	};
	}
}

function saveURL(is_wl)
{
	let list_name;
	let list;
	let textarea;

	if (is_wl) {
		list = wl;
		list_name = 'whitelist';
		header = WLheader;
		textarea = WLtextarea;
	} else {
		list = bl;
		list_name = 'blacklist';
		header = BLheader;
		textarea = BLtextarea;
	}

	let url = textarea.value;
	url = url.trim();

	if (!isInputValid(url, list, is_wl))
		return;

	let new_item;

	if (is_wl) {
		new_item = {
			url: url,
			strength: strSlider.value,
			skipHeadings: isChecked("skipHeadings"),
			skipColoreds: isChecked("skipColoreds"),
			advDimming: isChecked("advDimming")
		}
	} else {
		new_item = { url: url };
	}

	list.push(new_item);

	chrome.storage.local.set({[list_name]: list});

	addRow(new_item, is_wl);
}

function isInputValid(url, list, is_wl)
{
	let list_name;

	if (is_wl)
		list_name = 'whitelist';
	else
		list_name = 'blacklist';

	if (url.length < 3) {
		message("Input is too short.", is_wl);
		return false;
	}
	else if (url.length > 80) {
		message("Exceeded limit of 80 characters.", is_wl);
		return false;
	}

	if (list.length > 255) {
		message('Exceeded limit of 256 items.', is_wl);
		return false;
	}

	if (list.find(o => o.url === url)) {
		message("It's already there.", is_wl);
		return false;
	}

	return true;
}

function reset(is_wl)
{
	if (is_wl) {
		chrome.storage.local.remove('whitelist');
		wl = [];
		WLtbody.innerHTML = "";
	}
	else {
		chrome.storage.local.remove('blacklist');
		bl = [];
		BLtbody.innerHTML = "";
	}
}

function message(msg, is_wl)
{
	let elem;

	if (is_wl)
		elem = doc.querySelector('#msg');
	else
		elem = doc.querySelector('#BLmsg');

	elem.innerText = msg;

	setTimeout(() => { elem.innerText = ''; }, 3000);
}
