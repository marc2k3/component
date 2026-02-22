'use strict';

window.DefineScript('Minimal Seekbar + Playback Buttons', {author:'marc2003'});
include(fb.ComponentPath + 'helpers.txt');
includeJS('lodash.min.js');
includeJS('common.js');
includeJS('panel.js');
includeJS('seekbar.js');

let panel = new Panel();
let seekbar = new Seekbar(0, 0, 0, 0);
let buttons = new Buttons();
let font = CreateFontString("Segoe UI", 12);
let is_dark = window.IsDark;
const bs = Scale(24);

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

buttons.update = function () {
	const x = (panel.w - bs * 4) / 2;
	const y = panel.h - Scale(6) - bs;
	const button_colour = is_dark ? colours.light : colours.dark;

	this.buttons.stop = new Button(x, y, bs, bs, { char : chars.stop, colour: playback.StopAfterCurrent ? colours.slider_contrast : button_colour}, null, function () { playback.Stop(); }, 'Stop');
	this.buttons.previous = new Button(x + bs, y, bs, bs, { char : chars.prev, colour: button_colour }, null, function () { playback.Previous(); }, 'Previous');
	this.buttons.play = new Button(x + (bs * 2), y, bs, bs, { char : !playback.IsPlaying || playback.IsPaused ? chars.play : chars.pause, colour: button_colour}, null, function () { playback.PlayOrPause(); }, !playback.IsPlaying || playback.IsPaused ? 'Play' : 'Pause');
	this.buttons.next = new Button(x + (bs * 3), y, bs, bs, { char : chars.next, colour: button_colour }, null, function () { playback.Next(); }, 'Next');
}

function on_colours_changed() {
	is_dark = window.IsDark;
	buttons.update();
	window.Repaint();
}

function on_mouse_lbtn_down(x, y) {
	seekbar.lbtn_down(x, y);
}

function on_mouse_lbtn_up(x, y) {
	if (buttons.lbtn_up(x, y))
		return;

	seekbar.lbtn_up(x, y);
}

function on_mouse_leave() {
	buttons.leave();
}

function on_mouse_move(x, y) {
	if (buttons.move(x, y))
		return;

	seekbar.move(x, y);
}

function on_mouse_rbtn_up(x, y) {
	if (buttons.buttons.stop.containsXY(x, y)) {
		playback.StopAfterCurrent = !playback.StopAfterCurrent;
		return true;
	}

	return panel.rbtn_up(x, y);
}

function on_mouse_wheel(s) {
	seekbar.wheel(s);
}

function on_paint(gr) {
	gr.Clear(is_dark ? colours.dark : colours.light);
	buttons.paint(gr);
	gr.FillRoundedRectangle(seekbar.x, seekbar.y, seekbar.w, seekbar.h, Scale(2), Scale(2), colours.slider_background);

	if (playback.IsPlaying) {
		const time_width = seekbar.x - Scale(12);

		gr.WriteText(tfo.playback_time.Eval(), font, is_dark ? colours.light : colours.dark, 0, 0, time_width, Scale(28), 1, 2);
		gr.WriteText(tfo.length.Eval(), font, is_dark ? colours.light : colours.dark, seekbar.x + seekbar.w + Scale(12), 0, time_width, Scale(28), 0, 2);

		if (playback.Length > 0) {
			gr.FillEllipse(seekbar.x + seekbar.pos(), seekbar.y + Scale(3), Scale(6), Scale(6), colours.slider_contrast);
		}
	}
}

function on_playback_pause() {
	buttons.update();
	window.Repaint();
}

function on_playback_seek() {
	seekbar.playback_seek();
}

function on_playback_starting() {
	buttons.update();
	window.Repaint();
}

function on_playback_stop() {
	buttons.update();
	window.Repaint();
}

function on_playback_time() {
	window.Repaint();
}

function on_playlist_stop_after_current_changed() {
	buttons.update();
	window.Repaint();
}

function on_size() {
	panel.size();
	buttons.update();
	seekbar.x = Scale(60);
	seekbar.y = Scale(12);
	seekbar.w = panel.w - (seekbar.x * 2);
	seekbar.h = Scale(6);
}
