'use strict';

window.DefineScript('Console', {author:'marc2003'});
include(fb.ComponentPath + 'helpers.js');
includeJS('lodash.min.js');
includeJS('common.js');
includeJS('panel.js');
includeJS('console.js');

let panel = new Panel();
let con = new Console(LM, TM, 0, 0);

function on_colours_changed() {
	panel.colours_changed();
	con.console_refresh();
	window.Repaint();
}

function on_console_refresh() {
	con.console_refresh();
	window.Repaint();
}

function on_font_changed() {
	panel.font_changed();
	window.Repaint();
}

function on_key_down(k) {
	con.key_down(k);
}

function on_mouse_lbtn_up(x, y) {
	con.lbtn_up(x, y);
}

function on_mouse_move(x, y) {
	con.move(x, y);
}

function on_mouse_rbtn_up(x, y) {
	return panel.rbtn_up(x, y, con);
}

function on_mouse_wheel(s) {
	con.wheel(s);
}

function on_paint(gr) {
	panel.paint(gr);
	panel.draw_header(gr, con.header_text());
	con.paint(gr);
}

function on_size() {
	panel.size();
	con.w = panel.w - (LM * 2);
	con.h = panel.h - TM;
	con.size();
}
