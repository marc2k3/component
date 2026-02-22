'use strict';

window.DefineScript('Last.fm Bio', {author:'marc2003'});
include(fb.ComponentPath + 'helpers.js');
includeJS('lodash.min.js');
includeJS('common.js');
includeJS('panel.js');
includeJS('lastfm.js');
includeJS('lastfm_bio.js');

let panel = new Panel();
let lastfm = new LastFm();
let lastfm_bio = new LastFmBio(LM, TM, 0, 0);

refresh();

function refresh() {
	panel.item_focus_change();
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

function on_item_focus_change() {
	if (panel.prefer_playing())
		return;

	refresh();
}

function on_key_down(k) {
	lastfm_bio.key_down(k);
}

function on_metadb_changed(handles, fromhook) {
	if (fromhook || !panel.metadb_changed(handles))
		return;

	lastfm_bio.refresh();
}

function on_mouse_lbtn_up(x, y) {
	lastfm_bio.lbtn_up(x, y);
}

function on_mouse_move(x, y) {
	lastfm_bio.move(x, y);
}

function on_mouse_rbtn_up(x, y) {
	return panel.rbtn_up(x, y, lastfm_bio);
}

function on_mouse_wheel(s) {
	lastfm_bio.wheel(s);
}

function on_notify_data(name, data) {
	lastfm.notify_data(name, data);
}

function on_paint(gr) {
	panel.paint(gr);
	lastfm_bio.draw_header(gr, panel.colours.highlight, LM, 0, lastfm_bio.w, TM, true);
	lastfm_bio.paint(gr);
}

function on_playback_dynamic_info_track() {
	lastfm_bio.refresh();
}

function on_playback_new_track() {
	refresh();
}

function on_playback_stop(reason) {
	if (reason != 2) {
		refresh();
	}
}

function on_playlist_switch() {
	on_item_focus_change();
}

function on_size() {
	panel.size();
	lastfm_bio.w = panel.w - (LM * 2);
	lastfm_bio.h = panel.h - TM;
	lastfm_bio.size();
}
