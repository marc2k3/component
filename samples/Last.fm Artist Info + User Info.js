'use strict';

window.DefineScript('Last.fm Artist Info + User Info', {author:'marc2003'});
include(fb.ComponentPath + 'helpers.txt');
includeJS('lodash.min.js');
includeJS('common.js');
includeJS('panel.js');
includeJS('lastfm_info.js');
includeJS('lastfm.js');

let panel = new Panel();
let lastfm = new LastFm();
let lastfm_info = new LastFmInfo(LM, TM, 0, 0);

refresh();

function refresh() {
	panel.item_focus_change();
	lastfm_info.refresh();
}

function on_colours_changed() {
	panel.colours_changed();
	window.Repaint();
}

function on_font_changed() {
	panel.font_changed();
	window.Repaint();
}

function on_http_request_done(task_id, success, response_text) {
	lastfm_info.http_request_done(task_id, success, response_text);
}

function on_item_focus_change() {
	if (panel.prefer_playing())
		return;

	refresh();
}

function on_key_down(k) {
	lastfm_info.key_down(k);
}

function on_metadb_changed(handles, fromhook) {
	if (fromhook || !panel.metadb_changed(handles))
		return;

	lastfm_info.refresh();
}

function on_mouse_lbtn_up(x, y) {
	lastfm_info.lbtn_up(x, y);
}

function on_mouse_move(x, y) {
	lastfm_info.move(x, y);
}

function on_mouse_rbtn_up(x, y) {
	return panel.rbtn_up(x, y, lastfm_info);
}

function on_mouse_wheel(s) {
	lastfm_info.wheel(s);
}

function on_notify_data(name, data) {
	lastfm.notify_data(name, data);
}

function on_paint(gr) {
	panel.paint(gr);
	panel.draw_header(gr, lastfm_info.header_text());
	lastfm_info.paint(gr);
}

function on_playback_dynamic_info_track() {
	refresh();
}

function on_playback_new_track() {
	panel.item_focus_change();
	lastfm_info.playback_new_track();
}

function on_playback_stop(reason) {
	if (reason != 2) {
		refresh();
	}
}

function on_playback_time() {
	lastfm_info.playback_time();
}

function on_playlist_switch() {
	on_item_focus_change();
}

function on_size() {
	panel.size();
	lastfm_info.w = panel.w - (LM * 2);
	lastfm_info.h = panel.h - TM;
	lastfm_info.size();
}
