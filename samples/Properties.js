'use strict';

window.DefineScript('Properties', {author:'marc2003'});
include(fb.ComponentPath + 'helpers.txt');
includeJS('lodash.min.js');
includeJS('common.js');
includeJS('panel.js');
includeJS('properties.js');

let panel = new Panel();
let properties = new Properties('properties', LM, TM, 0, 0);

refresh();

function refresh() {
	panel.item_focus_change();
	properties.refresh();
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
	properties.key_down(k);
}

function on_metadb_changed(handles, fromhook) {
	if (fromhook || !panel.metadb_changed(handles))
		return;

	properties.refresh();
}

function on_mouse_lbtn_up(x, y) {
	properties.lbtn_up(x, y);
}

function on_mouse_move(x, y) {
	properties.move(x, y);
}

function on_mouse_rbtn_up(x, y) {
	return panel.rbtn_up(x, y, properties);
}

function on_mouse_wheel(s) {
	properties.wheel(s);
}

function on_paint(gr) {
	panel.paint(gr);
	panel.draw_header(gr, properties.header_text());
	properties.paint(gr);
}

function on_playback_dynamic_info_track() {
	properties.refresh();
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
	properties.w = panel.w - (LM * 2);
	properties.h = panel.h - TM;
	properties.size();
}
