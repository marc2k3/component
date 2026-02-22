'use strict';

window.DefineScript('Album Art', {author:'marc2003'});
include(fb.ComponentPath + 'helpers.js');
includeJS('lodash.min.js');
includeJS('common.js');
includeJS('panel.js');
includeJS('albumart.js');

let panel = new Panel({ custom_background : true });
let albumart = new AlbumArt(0, 0, 0, 0);

refresh();

function refresh() {
	panel.item_focus_change();
	albumart.refresh();
}

function on_colours_changed() {
	panel.colours_changed();
	window.Repaint();
}

function on_item_focus_change() {
	if (panel.prefer_playing())
		return;

	refresh();
}

function on_key_down(k) {
	albumart.key_down(k);
}

function on_metadb_changed(handles, fromhook) {
	if (fromhook || !panel.metadb_changed(handles))
		return;

	albumart.refresh();
}

function on_mouse_lbtn_dblclk(x, y) {
	albumart.lbtn_dblclk(x, y);
}

function on_mouse_move(x, y) {
	albumart.move(x, y);
}

function on_mouse_rbtn_up(x, y) {
	return panel.rbtn_up(x, y, albumart);
}

function on_mouse_wheel(s) {
	albumart.wheel(s);
}

function on_paint(gr) {
	panel.paint(gr);
	albumart.paint(gr);
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
	albumart.w = panel.w;
	albumart.h = panel.h;
}

function on_stream_album_art_change() {
	albumart.refresh();
}
