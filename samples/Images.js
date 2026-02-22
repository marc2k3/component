'use strict';

window.DefineScript('Images', {author:'marc2003'});
include(fb.ComponentPath + 'helpers.js');
includeJS('lodash.min.js');
includeJS('himalaya.js');
includeJS('common.js');
includeJS('panel.js');
includeJS('lastfm.js');
includeJS('images.js');

let panel = new Panel();
let lastfm = new LastFm();
let images = new Images();

refresh();

function refresh() {
	panel.item_focus_change();
	images.refresh();
}

function on_colours_changed() {
	panel.colours_changed();
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
	images.key_down(k);
}

function on_metadb_changed(handles, fromhook) {
	if (fromhook || !panel.metadb_changed(handles))
		return;

	images.refresh();
}

function on_mouse_lbtn_dblclk(x, y) {
	images.lbtn_dblclk(x, y);
}

function on_mouse_move(x, y) {
	images.move(x, y);
}

function on_mouse_rbtn_up(x, y) {
	return panel.rbtn_up(x, y, images);
}

function on_mouse_wheel(s) {
	images.wheel(s);
}

function on_paint(gr) {
	panel.paint(gr);
	images.paint(gr);
}

function on_playback_dynamic_info_track() {
	images.playback_new_track();
}

function on_playback_new_track() {
	panel.item_focus_change();
	images.playback_new_track();
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

	images.w = panel.w;
	images.h = panel.h;
}
