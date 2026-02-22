'use strict';

window.DefineScript('Thumbs', {author:'marc2003'});
include(fb.ComponentPath + 'helpers.txt');
includeJS('lodash.min.js');
includeJS('himalaya.js');
includeJS('common.js');
includeJS('panel.js');
includeJS('lastfm.js');
includeJS('thumbs.js');

let panel = new Panel();
let lastfm = new LastFm();
let thumbs = new Thumbs();

refresh();

function refresh() {
	panel.item_focus_change();
	thumbs.refresh();
}

function on_colours_changed() {
	panel.colours_changed();
	window.Repaint();
}

function on_http_request_done(task_id, success, response_text, status, response_headers) {
	thumbs.http_request_done(task_id, success, response_text, status, response_headers);
}

function on_item_focus_change() {
	if (panel.prefer_playing())
		return;

	refresh();
}

function on_key_down(k) {
	thumbs.key_down(k);
}

function on_metadb_changed(handles, fromhook) {
	if (fromhook || !panel.metadb_changed(handles))
		return;

	thumbs.refresh();
}

function on_mouse_lbtn_dblclk(x, y) {
	thumbs.lbtn_dblclk(x, y);
}

function on_mouse_lbtn_up(x, y) {
	thumbs.lbtn_up(x, y);
}

function on_mouse_move(x, y) {
	thumbs.move(x, y);
}

function on_mouse_rbtn_up(x, y) {
	return panel.rbtn_up(x, y, thumbs);
}

function on_mouse_wheel(s) {
	thumbs.wheel(s);
}

function on_paint(gr) {
	panel.paint(gr);
	thumbs.paint(gr);
}

function on_playback_dynamic_info_track() {
	thumbs.playback_new_track();
}

function on_playback_new_track() {
	panel.item_focus_change();
	thumbs.playback_new_track();
}

function on_playback_stop(reason) {
	if (reason != 2) {
		refresh();
	}
}

function on_playback_time(time) {
	thumbs.playback_time();
}

function on_playlist_switch() {
	on_item_focus_change();
}

function on_size() {
	panel.size();
	thumbs.size();
}
