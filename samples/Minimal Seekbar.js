'use strict';

window.DefineScript('Minimal Seekbar', {author:'marc2003'});
include(fb.ComponentPath + 'helpers.txt');
includeJS('lodash.min.js');
includeJS('common.js');
includeJS('seekbar.js');

let seekbar = new Seekbar(0, 0, 0, 0);
let font = CreateFontString("Segoe UI", 12);
let is_dark = window.IsDark;

const tfo = {
	playback_time : fb.TitleFormat('[%playback_time%]'),
	length : fb.TitleFormat('$if2(%length%,LIVE)'),
};

const colours = {
	dark : RGB(30, 30, 30),
	light : RGB(240, 240, 240),
	slider_background : RGB(160, 160, 160),
	slider_contrast : RGB(196, 30, 35),
};

function on_colours_changed() {
	is_dark = window.IsDark;
	window.Repaint();
}

function on_mouse_lbtn_down(x, y) {
	seekbar.lbtn_down(x, y);
}

function on_mouse_lbtn_up(x, y) {
	seekbar.lbtn_up(x, y);
}

function on_mouse_move(x, y) {
	seekbar.move(x, y);
}

function on_mouse_wheel(s) {
	seekbar.wheel(s);
}

function on_paint(gr) {
	gr.Clear(is_dark ? colours.dark : colours.light);
	gr.FillRoundedRectangle(seekbar.x, seekbar.y, seekbar.w, seekbar.h, Scale(2), Scale(2), colours.slider_background);

	if (playback.IsPlaying) {
		const time_width = seekbar.x - Scale(12);
		gr.WriteText(tfo.playback_time.Eval(), font, is_dark ? colours.light : colours.dark, 0, 0, time_width, window.Height - 3, 1, 2);
		gr.WriteText(tfo.length.Eval(), font, is_dark ? colours.light : colours.dark, seekbar.x + seekbar.w + Scale(12), 0, time_width, window.Height - 3, 0, 2);

		if (playback.Length > 0) {
			gr.FillEllipse(seekbar.x + seekbar.pos(), seekbar.y + Scale(3), Scale(6), Scale(6), colours.slider_contrast);
		}
	}
}

function on_playback_pause() {
	seekbar.playback_seek();
}

function on_playback_seek() {
	seekbar.playback_seek();
}

function on_playback_stop() {
	window.Repaint();
}

function on_playback_time() {
	window.Repaint();
}

function on_size() {
	seekbar.x = Scale(60);
	seekbar.y = (window.Height / 2) - Scale(3);
	seekbar.w = window.Width - (seekbar.x * 2);
	seekbar.h = Scale(6);
}
