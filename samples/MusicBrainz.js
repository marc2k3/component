'use strict';

window.DefineScript('MusicBrainz', {author:'marc2003'});
include(fb.ComponentPath + 'helpers.txt');
includeJS('lodash.min.js');
includeJS('common.js');
includeJS('panel.js');
includeJS('musicbrainz.js');

let panel = new Panel();
let musicbrainz = new MusicBrainz(LM, TM, 0, 0);

refresh();

function refresh() {
	panel.item_focus_change();
	musicbrainz.refresh();
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
	musicbrainz.http_request_done(task_id, success, response_text);
}

function on_item_focus_change() {
	if (panel.prefer_playing())
		return;

	refresh();
}

function on_key_down(k) {
	musicbrainz.key_down(k);
}

function on_metadb_changed(handles, fromhook) {
	if (fromhook || !panel.metadb_changed(handles))
		return;

	musicbrainz.refresh();
}

function on_mouse_lbtn_up(x, y) {
	musicbrainz.lbtn_up(x, y);
}

function on_mouse_move(x, y) {
	musicbrainz.move(x, y);
}

function on_mouse_rbtn_up(x, y) {
	return panel.rbtn_up(x, y, musicbrainz);
}

function on_mouse_wheel(s) {
	musicbrainz.wheel(s);
}

function on_paint(gr) {
	panel.paint(gr);
	panel.draw_header(gr, musicbrainz.header_text());
	musicbrainz.paint(gr);
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
	musicbrainz.w = panel.w - (LM * 2);
	musicbrainz.h = panel.h - TM;
	musicbrainz.size();
}
