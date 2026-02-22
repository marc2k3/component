'use strict';

window.DefineScript('Track Info + Seekbar + Buttons + Volume', {author:'marc2003'});
include(fb.ComponentPath + 'helpers.js');
includeJS('lodash.min.js');
includeJS('common.js');
includeJS('panel.js');
includeJS('seekbar.js');
includeJS('volume.js');

// $rgb is supported here
const tfo = {
	artist : fb.TitleFormat("%artist%"),
	title : fb.TitleFormat("%title%"),
	playback_time : fb.TitleFormat("[%playback_time%]"),
	length : fb.TitleFormat("$if2(%length%,LIVE)"),
};

const colours = {
	text : RGB(240, 240, 240),
	background : RGB(30, 30, 30),
	buttons : RGB(255, 255, 255),
	slider_background : RGB(160, 160, 160),
	contrast : RGB(196, 30, 35),
};

//////////////////////////////////////////////////////////////

let panel = new Panel();
let seekbar = new Seekbar(0, 0, 0, 0);
let volume = new Volume(0, 0, 0, 0);
let buttons = new Buttons();
let img = null;
const bs = Scale(24);

const pbo_chars = [chars.repeat_off, chars.repeat_all, chars.repeat_one, chars.random, chars.shuffle, chars.album, chars.folder];
const pbo_names = playback.GetOrderNames();

let normal_font = CreateFontString('Segoe UI', 12);
let bold_font = CreateFontString('Segoe UI', 12, true);

window.MaxHeight = Scale(150);

on_playback_new_track(playback.GetNowPlaying());

buttons.update = function () {
	let x = seekbar.x + ((seekbar.w - bs * 4) / 2);
	const y = panel.h - Scale(6) - bs;
	const pbo = playback.Order;

	this.buttons.stop = new Button(x, y, bs, bs, { char : chars.stop, colour:playback.StopAfterCurrent ? colours.contrast : colours.buttons}, null, function () { playback.Stop(); }, 'Stop');
	this.buttons.previous = new Button(x + bs, y, bs, bs, { char : chars.prev, colour:colours.buttons }, null, function () { playback.Previous(); }, 'Previous');
	this.buttons.play = new Button(x + (bs * 2), y, bs, bs, { char : !playback.IsPlaying || playback.IsPaused ? chars.play : chars.pause, colour:colours.buttons}, null, function () { playback.PlayOrPause(); }, !playback.IsPlaying || playback.IsPaused ? 'Play' : 'Pause');
	this.buttons.next = new Button(x + (bs * 3), y, bs, bs, { char : chars.next, colour:colours.buttons }, null, function () { playback.Next(); }, 'Next');

	x = panel.w - (bs * 5) - Scale(12);

	this.buttons.pbo = new Button(x - 2, y - 2, bs + 4, bs + 4, { char : pbo_chars[pbo], colour: pbo == 0 ? setAlpha(colours.buttons, 60) : colours.contrast }, null, function () { pbo >= pbo_chars.length - 1 ? playback.Order = 0 : playback.Order++ }, 'Playback Order: ' + pbo_names[pbo]);
	this.buttons.console = new Button(x + (bs * 2), y, bs, bs, {char : chars.list, colour:colours.buttons }, null, function () { fb.ShowConsole(); }, 'Console');
	this.buttons.search = new Button(x + (bs * 3), y, bs, bs, { char : chars.search, colour:colours.buttons }, null, function () { fb.RunMainMenuCommand('Library/Search'); }, 'Library Search');
	this.buttons.preferences = new Button(x + (bs * 4), y, bs, bs, { char : chars.preferences, colour:colours.buttons}, null, function () { fb.ShowPreferences(); }, 'Preferences');

	this.buttons.volume = new Button(volume.x - bs - Scale(6), Scale(3), bs, bs, { char : chars.volume, colour:colours.buttons }, null, function () { playback.VolumeMute(); }, 'Mute Volume');
}

function update_album_art(metadb) {
	if (img) {
		img = null;
	}

	if (metadb) {
		img = metadb.GetAlbumArt();
	}

	window.Repaint();
}

function on_mouse_lbtn_down(x, y) {
	seekbar.lbtn_down(x, y);
	volume.lbtn_down(x, y);
}

function on_mouse_lbtn_up(x, y) {
	if (x < panel.h && playback.IsPlaying && img) {
		playback.GetNowPlaying().ShowAlbumArtViewer();
		return;
	}

	if (buttons.lbtn_up(x, y))
		return;

	if (seekbar.lbtn_up(x, y))
		return;

	if (volume.lbtn_up(x, y))
		return;

	fb.RunMainMenuCommand('View/Show now playing in playlist');
}

function on_mouse_leave() {
	buttons.leave();
}

function on_mouse_move(x, y) {
	window.SetCursor(x < panel.h && playback.IsPlaying && img ? IDC_HAND : IDC_ARROW);

	if (buttons.move(x, y))
		return;

	if (seekbar.move(x, y))
		return;

	volume.move(x, y);
}

function on_mouse_rbtn_up(x, y) {
	if (buttons.buttons.stop.containsXY(x, y)) {
		playback.StopAfterCurrent = !playback.StopAfterCurrent;
		return true;
	}

	return panel.rbtn_up(x, y);
}

function on_mouse_wheel(s) {
	if (seekbar.wheel(s))
		return;

	volume.wheel(s);
}

function on_paint(gr) {
	gr.Clear(colours.background);
	gr.FillRoundedRectangle(seekbar.x, seekbar.y, seekbar.w, seekbar.h, Scale(2), Scale(2), colours.slider_background);
	buttons.paint(gr);

	gr.FillRoundedRectangle(volume.x, volume.y, volume.w, volume.h, Scale(2), Scale(2), colours.slider_background)
	gr.FillEllipse(volume.x + volume.pos(), volume.y + Scale(3), Scale(6), Scale(6), colours.contrast);

	buttons.paint(gr);

	if (playback.IsPlaying) {
		if (img) {
			DrawImage(gr, img, 0, 0, panel.h, panel.h, image.crop_top);
		}

		gr.WriteText(tfo.title.Eval(), bold_font, colours.text, panel.h + 10, 0, seekbar.x - panel.h - Scale(60), panel.h * 0.6, DWRITE_TEXT_ALIGNMENT_LEADING, DWRITE_PARAGRAPH_ALIGNMENT_CENTER, DWRITE_WORD_WRAPPING_NO_WRAP, DWRITE_TRIMMING_GRANULARITY_CHARACTER);
		gr.WriteText(tfo.artist.Eval(), normal_font, colours.text, panel.h + 10, panel.h * 0.3, seekbar.x - panel.h - Scale(60), panel.h * 0.7, DWRITE_TEXT_ALIGNMENT_LEADING, DWRITE_PARAGRAPH_ALIGNMENT_CENTER, DWRITE_WORD_WRAPPING_NO_WRAP, DWRITE_TRIMMING_GRANULARITY_CHARACTER);
		gr.WriteText(tfo.playback_time.Eval(), normal_font, colours.text, seekbar.x - Scale(72), 0, Scale(60), Scale(28), DWRITE_TEXT_ALIGNMENT_TRAILING, DWRITE_PARAGRAPH_ALIGNMENT_CENTER);
		gr.WriteText(tfo.length.Eval(), normal_font, colours.text, seekbar.x + seekbar.w + Scale(12), 0, Scale(60), Scale(28), DWRITE_TEXT_ALIGNMENT_LEADING, DWRITE_PARAGRAPH_ALIGNMENT_CENTER);

		if (playback.Length > 0) {
			gr.FillEllipse(seekbar.x + seekbar.pos(), seekbar.y + Scale(3), Scale(6), Scale(6), colours.contrast);
		}
	}
}

function on_playback_dynamic_info_track() {
	window.Repaint();
}

function on_playback_edited() {
	window.Repaint();
}

function on_playback_new_track(metadb) {
	update_album_art(metadb);
}

function on_playback_order_changed() {
	buttons.update();
	window.Repaint();
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
	window.RepaintRect(panel.h, 0, seekbar.x - panel.h, panel.h);
}

function on_playlist_stop_after_current_changed() {
	buttons.update();
	window.Repaint();
}

function on_size() {
	panel.size();
	const bar_h = Scale(6);
	seekbar.x = Scale(300);
	seekbar.y = Scale(12);
	seekbar.w = panel.w - (seekbar.x * 2);
	seekbar.h = bar_h
	volume.x = seekbar.x + seekbar.w + Scale(60) + (bs * 5);
	volume.y = Scale(12);
	volume.w = panel.w - volume.x - Scale(20);
	volume.h = bar_h;
	buttons.update();
}

function on_stream_album_art_change() {
	update_album_art(playback.GetNowPlaying());
}

function on_volume_change() {
	volume.volume_change();
	window.Repaint();
}
