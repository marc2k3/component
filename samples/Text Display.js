'use strict';

window.DefineScript('Text Display', {author:'marc2003'});
include(fb.ComponentPath + 'helpers.txt');
includeJS('lodash.min.js');
includeJS('common.js');
includeJS('panel.js');
includeJS('albumart.js');
includeJS('text_display.js');

let panel = new Panel({ custom_background : true });
let text = new TextDisplay(LM, 0, 0, 0);
let albumart = new AlbumArt(0, 0, 0, 0);

refresh();

function refresh() {
	panel.item_focus_change();
	albumart.refresh();
	text.refresh();
}

function on_colours_changed() {
	panel.colours_changed();
	text.refresh(true);
}

function on_font_changed() {
	panel.font_changed();
	text.refresh(true);
}

function on_item_focus_change() {
	if (panel.prefer_playing())
		return;

	refresh();
}

function on_metadb_changed(handles, fromhook) {
	if (!panel.metadb_changed(handles))
		return;

	if (!fromhook) {
		albumart.refresh();
	}

	text.refresh();
}

function on_mouse_lbtn_dblclk(x, y) {
	if (text.properties.layout.value > 0) {
		albumart.lbtn_dblclk(x, y);
	}
}

function on_mouse_move(x, y) {
	if (text.properties.layout.value > 0 && albumart.move(x, y))
		return;

	text.move(x, y);
}

function on_mouse_rbtn_up(x, y) {
	return panel.rbtn_up(x, y, text);
}

function on_mouse_wheel(s) {
	if (albumart.wheel(s))
		return;

	text.wheel(s);
}

function on_paint(gr) {
	panel.paint(gr);
	text.paint(gr);
}

function on_playback_dynamic_info_track() {
	text.refresh();
}

function on_playback_new_track() {
	refresh();
}

function on_playback_pause() {
	text.refresh();
}

function on_playback_stop(reason) {
	if (reason != 2) {
		refresh();
	}
}

function on_playback_time() {
	text.playback_time();
}

function on_playlist_items_added() {
	text.refresh();
}

function on_playlist_items_removed() {
	text.refresh();
}

function on_playlist_items_reordered() {
	text.refresh();
}

function on_playlist_switch() {
	on_item_focus_change();
}

function on_playlists_changed() {
	text.refresh();
}

function on_size() {
	panel.size();
	text.size();
}

function on_stream_album_art_change() {
	if (text.properties.albumart.enabled || text.properties.layout.value > 0) {
		albumart.refresh();
	}
}
