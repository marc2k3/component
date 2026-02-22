'use strict';

window.DefineScript('Text Display + Album Art + Seekbar + Buttons', {author:'marc2003'});
include(fb.ComponentPath + 'helpers.txt');
includeJS('lodash.min.js');
includeJS('common.js');
includeJS('panel.js');
includeJS('albumart.js');
includeJS('text_display.js');
includeJS('seekbar.js');

let panel = new Panel();
let text = new TextDisplay(LM, 0, 0, 0, true);
let albumart = new AlbumArt(0, 0, 0, 0);
let seekbar = new Seekbar(0, 0, 0, 0);

const colours = {
	slider_background : RGB(160, 160, 160),
	white : RGB(255, 255, 255),
	contrast : RGB(196, 30, 35),
};

const tfo = {
	playback_time : fb.TitleFormat('[%playback_time%]'),
	length : fb.TitleFormat('$if2(%length%,LIVE)'),
};

let font = CreateFontString('Segoe UI', 12);
let buttons = new Buttons();
let bs = Scale(24);
let bottom_y = 0;

buttons.update = function () {
	let x = (panel.w - (bs * 7)) / 2
	let y = seekbar.y + Scale(12);
	this.buttons.stop = new Button(x, y, bs, bs, { char : chars.stop, colour: playback.StopAfterCurrent ? colours.contrast : colours.white}, null, function () { playback.Stop(); }, 'Stop');
	this.buttons.previous = new Button(x + bs, y, bs, bs, { char : chars.prev, colour:colours.white }, null, function () { playback.Previous(); }, 'Previous');
	this.buttons.play = new Button(x + (bs * 2), y, bs, bs, { char : !playback.IsPlaying || playback.IsPaused ? chars.play : chars.pause, colour:colours.white}, null, function () { playback.PlayOrPause(); }, !playback.IsPlaying || playback.IsPaused ? 'Play' : 'Pause');
	this.buttons.next = new Button(x + (bs * 3), y, bs, bs, { char : chars.next, colour:colours.white }, null, function () { playback.Next(); }, 'Next');
	this.buttons.search = new Button(x + (bs * 5), y, bs, bs, { char : chars.search, colour:colours.white }, null, function () { fb.RunMainMenuCommand('Library/Search'); }, 'Library Search');
	this.buttons.preferences = new Button(x + (bs * 6), y, bs, bs, { char : chars.preferences, colour:colours.white}, null, function () { fb.ShowPreferences(); }, 'Preferences');
}

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
	albumart.lbtn_dblclk(x, y);
}

function on_mouse_lbtn_down(x, y) {
	seekbar.lbtn_down(x, y);
}

function on_mouse_lbtn_up(x, y) {
	if (seekbar.lbtn_up(x, y))
		return;

	buttons.lbtn_up(x, y);
}

function on_mouse_leave() {
	buttons.leave();
}

function on_mouse_move(x, y) {
	if (albumart.move(x, y))
		return;
	else if (seekbar.move(x, y))
		return;
	else if (buttons.move(x, y))
		return;

	text.move(x, y);
}

function on_mouse_rbtn_up(x, y) {
	if (buttons.buttons.stop.containsXY(x, y)) {
		playback.StopAfterCurrent = !playback.StopAfterCurrent;
		return true;
	}

	return panel.rbtn_up(x, y, text);
}

function on_mouse_wheel(s) {
	if (albumart.wheel(s))
		return;
	else if (seekbar.wheel(s))
		return;

	text.wheel(s);
}

function on_paint(gr) {
	panel.paint(gr);
	text.paint(gr);
	buttons.paint(gr);

	gr.FillRoundedRectangle(seekbar.x, seekbar.y, seekbar.w, seekbar.h, Scale(2), Scale(2), colours.slider_background);

	if (playback.IsPlaying) {
		const time_width = seekbar.x - Scale(12);
		gr.WriteText(tfo.playback_time.Eval(), font, colours.white, 0, bottom_y, time_width, Scale(12), 1, 2);
		gr.WriteText(tfo.length.Eval(), font, colours.white, seekbar.x + seekbar.w + Scale(12), bottom_y, time_width, Scale(12), 0, 2);

		if (playback.Length > 0) {
			gr.FillEllipse(seekbar.x + seekbar.pos(), seekbar.y + Scale(3), Scale(6), Scale(6), colours.white);
		}
	}
}

function on_playback_dynamic_info_track() {
	text.refresh();
}

function on_playback_new_track() {
	refresh();
}

function on_playback_order_changed() {
	buttons.update();
	window.Repaint();
}

function on_playback_pause() {
	text.refresh();
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

function on_playback_stop(reason) {
	if (reason != 2) {
		refresh();
	}

	buttons.update();
	window.Repaint();
}

function on_playback_time() {
	text.playback_time();
	window.RepaintRect(0, bottom_y, panel.w, panel.h - bottom_y);
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

function on_playlist_stop_after_current_changed() {
	buttons.update();
	window.Repaint();
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

	seekbar.x = Scale(60);
	seekbar.y = panel.h - bs - Scale(18);
	seekbar.w = panel.w - (seekbar.x * 2);
	seekbar.h = Scale(6);

	bottom_y = seekbar.y - Scale(4);
	buttons.update();
}

function on_stream_album_art_change() {
	albumart.refresh();
}
