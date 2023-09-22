/**
 * Copyright (C) 2019 Francesco Fusco. All rights reserved.
 * License: https://github.com/Fushko/font-contrast#license
 */

const storage = chrome.storage.local;

const $ = document.querySelector.bind(document);
const $$ = document.querySelectorAll.bind(document);

const url_text = $('#url');
const refreshBtn = $("#refreshBtn");

let url_visible = false;

function init(tabs)
{
	const strSlider       = $("#strSlider");
	const strLabel        = $("#strLabel");

	const sizeSlider      = $("#sizeSlider");
	const sizeLabel       = $("#sizeLabel");

	const thresholdSlider = $("#thresholdSlider");
	const thresholdLabel  = $("#thresholdLabel");

	const brt_slider      = $('#brt-slider');
	const brt_label       = $('#brt-label');

	const WLcheck         = $("#addWL");
	const BLcheck         = $("#addBL");

	const skipColoreds    = $("#skipColoreds");
	const skipHeadings    = $("#skipHeadings");
	const advDimming      = $("#advDimming");
	const input_border    = $("#outline");
	const boldText        = $("#boldText");
	const forcePlhdr      = $("#forcePlhdr");
	const skipWhites      = $("#skipWhites");

	const optionsBtn      = $("#optionsBtn");

	let url = tabs[0].url;

	let hostname = '';

	if (url.startsWith('file://')) {
		hostname = url;
	} else {
		hostname = url.match(/\/\/(.+?)\//)[1];

		if (!url.startsWith('http'))
			showRefreshBtn();
	}

	url_text.innerText = hostname;

	strSlider.oninput 	    = () => strLabel.innerText       = strSlider.value;
	sizeSlider.oninput 	    = () => sizeLabel.innerText      = sizeSlider.value;
	thresholdSlider.oninput = () => thresholdLabel.innerText = thresholdSlider.value;
	brt_slider.oninput 	    = () => brt_label.innerText      = brt_slider.value;

	optionsBtn.onclick = () =>  {
		if (chrome.runtime.openOptionsPage)
			chrome.runtime.openOptionsPage();
		else
			window.open(chrome.runtime.getURL('options.html'));
	};

	const settings = [
		"whitelist",
		"blacklist",
		"globalStr",
		"size",
		"sizeThreshold",
		"skipColoreds",
		"skipHeadings",
		"advDimming",
		"brightness",
		"boldText",
		"forcePlhdr",
		"forceOpacity",
		"skipWhites",
		"underlineLinks",
		"input_border"
	];

	const start = settings =>
	{
		let whitelist = settings.whitelist || [];
		let blacklist = settings.blacklist || [];

		let item = settings;

		if (blacklist.findIndex(o => o.url === hostname) > -1) {
			BLcheck.checked = true;
		} else {
			const idx = whitelist.findIndex(o => o.url === hostname);

			if (idx > -1) {
				item = whitelist[idx];

				WLcheck.checked = true;
				BLcheck.checked = false;
			}
		}

		strSlider.value          = item.strength || item.globalStr;
		strLabel.innerText       = item.strength || item.globalStr;
		sizeSlider.value         = item.size || 0;
		sizeLabel.innerText      = item.size || 0;
		thresholdSlider.value    = item.threshold || item.sizeThreshold || 0;
		thresholdLabel.innerText = item.threshold || item.sizeThreshold || 0;
		brt_slider.value         = item.brightness || 50;
		brt_label.innerText      = item.brightness || 50;

		skipHeadings.checked     = item.skipHeadings;
		skipColoreds.checked     = item.skipColoreds;
		advDimming.checked       = item.advDimming;
		input_border.checked     = item.input_border;
		boldText.checked         = item.boldText;
		forcePlhdr.checked       = item.forcePlhdr;
		forceOpacity.checked     = item.forceOpacity;
		skipWhites.checked       = item.skipWhites;
		underlineLinks.checked   = item.underlineLinks;

		if(!advDimming.checked)
			$('#brt-div').style.display ='none';

		const getOptions = () => {
			const wl_item = {
				url:            hostname,
				strength:       strSlider.value,
				size:           sizeSlider.value,
				threshold:      thresholdSlider.value,
				brightness:     brt_slider.value,
				skipHeadings:   skipHeadings.checked,
				skipColoreds:   skipColoreds.checked,
				advDimming:     advDimming.checked,
				boldText:       boldText.checked,
				forcePlhdr:     forcePlhdr.checked,
				forceOpacity:   forceOpacity.checked,
				skipWhites:     skipWhites.checked,
				underlineLinks: underlineLinks.checked,
				input_border:   input_border.checked
			}

			return wl_item;
		}

		WLcheck.onclick = () => {
			const is_checked = WLcheck.checked;

			whitelist = updateList(getOptions(), true, is_checked);

			if (is_checked) {
				let idx = blacklist.findIndex(o => o.url === hostname);

				if(idx > -1)
					blacklist = updateList({ url: hostname }, false, false);
			}
		};

		BLcheck.onclick = () => {
			const is_checked = BLcheck.checked;

			blacklist = updateList({ url: hostname }, false, is_checked);

			if (is_checked) {
				const idx = whitelist.findIndex(o => o.url === hostname);

				if(idx > -1)
					whitelist = updateList(getOptions(), true, false);
			}
		};

		$$('.option').forEach(checkbox => {
			checkbox.onclick = () => {
				if (checkbox.id === 'adv-mode') {
					const brt_div = document.querySelector('#brt-div');

					if (advDimming.checked)
						brt_div.style.display = 'flex';
					else
						brt_div.style.display = 'none';
				}

				whitelist = updateList(getOptions(), true, true);

				if (BLcheck.checked)
					blacklist = updateList({ url: hostname }, false, false);
			}
		});

		const updateList = (item, is_wl, add) => {
			let list;
			let list_name;
			let check;

			if (is_wl) {
				list = whitelist;
				list_name = 'whitelist';
				check = WLcheck;
			} else {
				list = blacklist;
				list_name = 'blacklist';
				check = BLcheck;
			}

			let idx = list.findIndex(o => o.url === item.url);

			if (add) {
				if (idx > -1)
					list[idx] = item;
				else
					list.push(item);

				check.checked = true;
			}
			else if (idx > -1) {
				list.splice(idx, 1);

				check.checked = false;
			}

			storage.set({ [list_name]: list });

			showRefreshBtn();

			return list;
		};
	}

	storage.get(settings, start);
};

if (typeof chrome.tabs !== 'undefined') {
	chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
	init(tabs);
});
}
function showRefreshBtn()
{
	if (url_visible)
		return;

	url_text.style.opacity = 0;
	url_text.style.zIndex = "2";

	refreshBtn.style.opacity = 1;
	refreshBtn.style.zIndex = "3";
	refreshBtn.style.cursor = "pointer";

	refreshBtn.onclick = () => chrome.tabs.reload();

	url_visible = true;
}
