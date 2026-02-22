'use strict';

window.DefineScript('Menu + Playback Buttons + Custom Colours', {author:'marc2003'});
include(fb.ComponentPath + 'helpers.js');
includeJS('lodash.min.js');
includeJS('common.js');
includeJS('panel.js');

let panel = new Panel();
let buttons = new Buttons();
const bs = Scale(24);

window.MinHeight = window.MaxHeight = bs;
let colour_mode = new Property('2K3.TOP.COLOUR.MODE', 0); // 0 auto, 1 dark, 2 light, 3 custom
let is_dark = window.IsDark;

let colours = {
	buttons : 0,
	background : 0,
};

update_colours();

const pbo_chars = [chars.repeat_off, chars.repeat_all, chars.repeat_one, chars.random, chars.shuffle, chars.album, chars.folder];
const pbo_names = playback.GetOrderNames();

buttons.update = function () {
	this.buttons.menu = new Button(0, 0, bs, bs, { char : chars.menu, colour : colours.buttons }, null, function () { Menu(0, bs); }, 'Menu');

	this.buttons.album_list = new Button(bs * 2, 0, bs, bs, { char : chars.music, colour : colours.buttons }, null, function () { fb.RunMainMenuCommand('Library/Album List'); }, 'Album List');
	this.buttons.search = new Button(bs * 3, 0, bs, bs, { char : chars.search, colour : colours.buttons }, null, function () { fb.RunMainMenuCommand('Library/Search'); }, 'Library Search');

	const x = panel.w - (bs * 9);

	const pbo = playback.Order;
	this.buttons.repeat = new Button(x, 0, bs, bs, { char : pbo_chars[pbo], colour: colours.buttons }, null, function () { pbo == pbo_chars.length - 1 ? playback.Order = 0 : playback.Order++ }, pbo_names[pbo]);

	this.buttons.stop = new Button(x + (bs * 2), 0, bs, bs, { char : chars.stop, colour : colours.buttons }, null, function () { playback.Stop(); }, 'Stop');
	this.buttons.previous = new Button(x + (bs * 3), 0, bs, bs, { char : chars.prev, colour : colours.buttons }, null, function () { playback.Previous(); }, 'Previous');
	this.buttons.play = new Button(x + (bs * 4), 0, bs, bs, { char : !playback.IsPlaying || playback.IsPaused ? chars.play : chars.pause, colour : colours.buttons}, null, function () { playback.PlayOrPause(); }, !playback.IsPlaying || playback.IsPaused ? 'Play' : 'Pause');
	this.buttons.next = new Button(x + (bs * 5), 0, bs, bs, { char : chars.next, colour : colours.buttons }, null, function () { playback.Next(); }, 'Next');

	this.buttons.console = new Button(x + (bs * 7), 0, bs, bs, {char : chars.list, colour:colours.buttons }, null, function () { fb.ShowConsole(); }, 'Console');
	this.buttons.preferences = new Button(x + (bs * 8), 0, bs, bs, { char : chars.preferences, colour : colours.buttons }, null, function () { fb.ShowPreferences(); }, 'Preferences');
};

function on_colours_changed() {
	is_dark = window.IsDark;

	if (colour_mode.value == 0) {
		update_colours();
		buttons.update();
		window.Repaint();
	}
}

function on_mouse_lbtn_up(x, y, mask) {
	buttons.lbtn_up(x, y, mask);
}

function on_mouse_leave() {
	buttons.leave();
}

function on_mouse_move(x, y) {
	buttons.move(x, y);
}

function on_mouse_rbtn_up(x, y) {
	if (buttons.buttons.menu.containsXY(x, y)) {
		return Help(0, bs);
	}

	let menu = window.CreatePopupMenu();
	let colour_menu = window.CreatePopupMenu();
	colour_menu.AppendMenuItem(MF_STRING, 1, 'Auto');
	colour_menu.AppendMenuItem(MF_STRING, 2, 'Dark');
	colour_menu.AppendMenuItem(MF_STRING, 3, 'Light');
	colour_menu.AppendMenuItem(MF_STRING, 4, 'Custom');
	colour_menu.CheckMenuRadioItem(1, 4, colour_mode.value + 1);
	colour_menu.AppendMenuSeparator();
	colour_menu.AppendMenuItem(EnableMenuIf(colour_mode.value == 3), 5, 'Edit...');
	colour_menu.AppendTo(menu, MF_STRING, 'Colours');
	menu.AppendMenuSeparator();
	menu.AppendMenuItem(MF_STRING, 10, 'Configure');

	const idx = menu.TrackPopupMenu(x, y);

	switch (idx ) {
	case 1:
	case 2:
	case 3:
	case 4:
		colour_mode.value = idx - 1;
		update_colours();
		buttons.update();
		window.Repaint();
		break;
	case 5:
		const tmp = utils.ColourPicker(colours.background);
		window.SetProperty('2K3.TOP.COLOUR.BACKGROUND', tmp);
		update_colours();
		buttons.update();
		window.Repaint();
		break;
	case 10:
		window.ShowConfigure();
		break;
	}

	return true;
}

function on_paint(gr) {
	gr.Clear(colours.background);
	buttons.paint(gr);
}

function on_playback_order_changed() {
	buttons.update();
	window.Repaint();
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

function on_size() {
	panel.size();
	buttons.update();
}

function update_colours() {
	if ((colour_mode.value == 0 && is_dark) || colour_mode.value == 1) {
		colours.background = RGB(30, 30, 30);
	} else if ((colour_mode.value == 0 && !is_dark) || colour_mode.value == 2) {
		colours.background = RGB(240, 240, 240);
	} else if (colour_mode.value == 3) {
		colours.background = window.GetProperty('2K3.TOP.COLOUR.BACKGROUND', RGB(196, 30, 35));
	}

	colours.buttons = DetermineTextColour(colours.background);
}
