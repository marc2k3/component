'use strict';

window.DefineScript('Playback Buttons', {author:'marc2003'});
include(fb.ComponentPath + 'helpers.txt');
includeJS('lodash.min.js');
includeJS('common.js');
includeJS('panel.js');

const colours = {
	buttons : RGB(255, 255, 255),
	background : RGB(30, 30, 30),
	sac : RGB(196, 30, 35),
};

//////////////////////////////////////////////////////////////

let panel = new Panel();
let buttons = new Buttons();
let bs = Scale(24);

buttons.update = function () {
	const x = ((panel.w - bs * 4) / 2);
	const y = Math.round((panel.h - bs) / 2);
	this.buttons.stop = new Button(x, y, bs, bs, { char : chars.stop, colour:playback.StopAfterCurrent ? colours.sac : colours.buttons}, null, function () { playback.Stop(); }, 'Stop');
	this.buttons.previous = new Button(x + bs, y, bs, bs, { char : chars.prev, colour:colours.buttons }, null, function () { playback.Previous(); }, 'Previous');
	this.buttons.play = new Button(x + (bs * 2), y, bs, bs, { char : !playback.IsPlaying || playback.IsPaused ? chars.play : chars.pause, colour:colours.buttons}, null, function () { playback.PlayOrPause(); }, !playback.IsPlaying || playback.IsPaused ? 'Play' : 'Pause');
	this.buttons.next = new Button(x + (bs * 3), y, bs, bs, { char : chars.next, colour:colours.buttons }, null, function () { playback.Next(); }, 'Next');
}

function on_mouse_lbtn_up(x, y) {
	buttons.lbtn_up(x, y);
}

function on_mouse_leave() {
	buttons.leave();
}

function on_mouse_move(x, y) {
	buttons.move(x, y);
}

function on_mouse_rbtn_up(x, y) {
	if (buttons.buttons.stop.containsXY(x, y)) {
		playback.StopAfterCurrent = !playback.StopAfterCurrent;
		return true;
	}

	return panel.rbtn_up(x, y);
}

function on_paint(gr) {
	gr.Clear(colours.background);
	buttons.paint(gr);
}

function on_playback_pause() {
	buttons.update();
	window.Repaint();
}

function on_playback_starting() {
	buttons.update();
	window.Repaint();
}

function on_playback_stop() {
	buttons.update();
	window.Repaint();
}

function on_playlist_stop_after_current_changed() {
	buttons.update();
	window.Repaint();
}

function on_size() {
	panel.size();
	buttons.update();
}
