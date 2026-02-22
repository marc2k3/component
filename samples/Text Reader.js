'use strict';

window.DefineScript('Text Reader', {author:'marc2003'});
include(fb.ComponentPath + 'helpers.js');
includeJS('lodash.min.js');
includeJS('common.js');
includeJS('panel.js');
includeJS('text_reader.js');

let panel = new Panel();
let text_reader = new TextReader(LM, TM, 0, 0);

refresh();

function refresh() {
	panel.item_focus_change();
	text_reader.refresh();
}

function on_colours_changed() {
	panel.colours_changed();
	window.Repaint();
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
	text_reader.key_down(k);
}

function on_metadb_changed(handles, fromhook) {
	if (fromhook)
		return;

	text_reader.refresh();
}

function on_mouse_lbtn_up(x, y) {
	text_reader.lbtn_up(x, y);
}

function on_mouse_move(x, y) {
	text_reader.move(x, y);
}

function on_mouse_rbtn_up(x, y) {
	return panel.rbtn_up(x, y, text_reader);
}

function on_mouse_wheel(s) {
	text_reader.wheel(s);
}

function on_paint(gr) {
	panel.paint(gr);
	panel.draw_header(gr, text_reader.header_text());
	text_reader.paint(gr);
}

function on_playback_dynamic_info_track() {
	refresh();
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
	text_reader.w = panel.w - (LM * 2);
	text_reader.h = panel.h - TM;
	text_reader.size();
}
