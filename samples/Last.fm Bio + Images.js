'use strict';

window.DefineScript('Last.fm Bio + Images', {author:'marc2003'});
include(fb.ComponentPath + 'helpers.txt');
includeJS('lodash.min.js');
includeJS('himalaya.js');
includeJS('common.js');
includeJS('panel.js');
includeJS('images.js');
includeJS('lastfm.js');
includeJS('lastfm_bio.js');

const margin = Scale(12);

let panel = new Panel();
let lastfm = new LastFm();
let lastfm_bio = new LastFmBio(0, 0, 0, 0);
let images = new Images();
let white = RGB(255, 255, 255);

lastfm_bio.paint = function (gr) {
	const y = images.properties.layout.value == 0 ? margin : this.y - margin;
	this.draw_header(gr, white, this.x, y, this.w, TM);

	if (lastfm.api_key.empty()) {
		gr.WriteTextSimple('Use the right click menu to set your own Last.fm API key.', panel.fonts.normal, white, this.x, this.y + margin, this.w, this.ha);
	} else if (this.text_layout) {
		gr.WriteTextLayout(this.text_layout, white, this.x, this.y + margin, this.w, this.ha, this.offset);
		this.up_btn.paint(gr, white);
		this.down_btn.paint(gr, white);
	}
}

refresh();

function refresh() {
	panel.item_focus_change();
	images.refresh();
	lastfm_bio.refresh();
}

function on_colours_changed() {
	panel.colours_changed();
	window.Repaint();
}

function on_download_file_done(path, success, error_text) {
	lastfm_bio.download_file_done(path, success, error_text);
}

function on_font_changed() {
	panel.font_changed();
	window.Repaint();
}

function on_http_request_done(task_id, success, response_text, status, response_headers) {
	images.http_request_done(task_id, success, response_text, status, response_headers);
}

function on_item_focus_change() {
	if (panel.prefer_playing())
		return;

	refresh();
}

function on_key_down(k) {
	lastfm_bio.key_down(k);
	images.key_down(k);
}

function on_metadb_changed(handles, fromhook) {
	if (fromhook || !panel.metadb_changed(handles))
		return;

	images.refresh();
	lastfm_bio.refresh();
}

function on_mouse_lbtn_dblclk(x, y) {
	images.lbtn_dblclk(x, y);
}

function on_mouse_lbtn_up(x, y) {
	lastfm_bio.lbtn_up(x, y);
}

function on_mouse_move(x, y) {
	lastfm_bio.move(x, y);
	images.move(x, y);
}

function on_mouse_rbtn_up(x, y) {
	if (lastfm_bio.containsXY(x, y))
		return panel.rbtn_up(x, y, lastfm_bio);

	return panel.rbtn_up(x, y, images);
}

function on_mouse_wheel(s) {
	if (utils.IsKeyPressed(VK_CONTROL)) {
		const value = Clamp(images.properties.ratio.value - (s * 0.05), 0.2, 0.8);

		if (value != images.properties.ratio.value) {
			images.properties.ratio.value = value;
			on_size();
			window.Repaint();
		}
	} else {
		images.wheel(s);
		lastfm_bio.wheel(s);
	}
}

function on_notify_data(name, data) {
	lastfm.notify_data(name, data);
}

function on_paint(gr) {
	panel.paint(gr);
	images.paint(gr);
	lastfm_bio.paint(gr);
}

function on_playback_dynamic_info_track() {
	images.playback_new_track();
	lastfm_bio.refresh();
}

function on_playback_new_track() {
	panel.item_focus_change();
	images.playback_new_track();
	lastfm_bio.refresh();
}

function on_playback_stop(reason) {
	if (reason != 2) {
		refresh();
	}
}

function on_playback_time() {
	images.playback_time();
}

function on_playlist_switch() {
	on_item_focus_change();
}

function on_size() {
	panel.size();

	images.x = margin;
	images.y = margin;

	switch (images.properties.layout.value) {
	case 0: // Image left, Text right
		images.w = panel.w * images.properties.ratio.value;
		images.h = panel.h - (margin * 2);

		lastfm_bio.x = images.w + (margin * 2);
		lastfm_bio.y = margin * 2
		lastfm_bio.w = panel.w - images.w - (margin * 3);
		lastfm_bio.h = panel.h - lastfm_bio.y;
		break;
	case 1: // Image top, text bottom
		images.w = panel.w - (margin * 2);
		images.h = panel.h * images.properties.ratio.value;

		lastfm_bio.x = margin;
		lastfm_bio.y = images.h + (margin * 3);
		lastfm_bio.w = panel.w - (margin * 2);
		lastfm_bio.h = panel.h - images.h - (margin * 3);
		break;
	}

	lastfm_bio.size();
}
