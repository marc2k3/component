'use strict';

window.DefineScript('Status Bar', {author:'marc2003'});
include(fb.ComponentPath + 'helpers.js');

let ww = 0;
let wh = 0;
let right_text = '';
let right_text_width = 0;
let font = CreateFontString('Segoe UI', 10);
let starting = false;
let stop_reason;

let properties = {
	tf : new Property('2K3.STATUS.TF', '%__bitrate% kbps %codec% [%codec_profile% ][%__tool% ][%__tagtype%]'),
	name : new Property('2K3.STATUS.SHOW.NAME', true),
	count : new Property('2K3.STATUS.SHOW.COUNT', true),
	duration : new Property('2K3.STATUS.SHOW.DURATION', true),
	size : new Property('2K3.STATUS.SHOW.SIZE', true),
	background : new Property('2K3.STATUS.BACKGROUND', RGB(240, 240, 240)),
	text : new Property('2K3.STATUS.TEXT', RGB(0, 0, 0))
};

let tfo = fb.TitleFormat(properties.tf.value);

refresh();

function refresh() {
	let tmp = [];
	const ap = plman.ActivePlaylist;

	if (validate_playlist(ap)) {
		let items = plman.GetPlaylistItems(ap);
		const count = items.Count;

		if (properties.name.enabled) {
			let str = plman.GetPlaylistName(ap);

			if (plman.IsPlaylistLocked(ap)) {
				str = '🔒 ' + str;
			}

			tmp.push(str);
		}

		if (properties.count.enabled) {
			tmp.push(count + (count == 1 ? ' track' : ' tracks'));
		}

		if (properties.duration.enabled) {
			tmp.push(utils.FormatDuration(items.CalcTotalDuration()));
		}

		if (properties.size.enabled) {
			tmp.push(utils.FormatFileSize(items.CalcTotalSize()));
		}
	}

	right_text = tmp.join(' :: ');
	right_text_width = right_text.calc_width(font);
	window.Repaint();
}

function validate_playlist(playlist) {
	return playlist >= 0 && playlist < plman.PlaylistCount;
}

function draw_left_text(gr) {
	let left_text = '';

	if (starting)
		left_text = 'Starting playback...';
	else if (playback.IsPlaying)
		left_text = tfo.Eval();
	else
		left_text = fb.VersionString;

	gr.WriteText(left_text, font, properties.text.value, 5, 2, ww - 200 - right_text_width, wh - 4, DWRITE_TEXT_ALIGNMENT_LEADING, DWRITE_PARAGRAPH_ALIGNMENT_NEAR, DWRITE_WORD_WRAPPING_WHOLE_WORD, DWRITE_TRIMMING_GRANULARITY_CHARACTER);
}

function draw_right_text(gr) {
	if (right_text.length) {
		gr.WriteText(right_text, font, properties.text.value, 0, 2, ww - 130, wh - 4, DWRITE_TEXT_ALIGNMENT_TRAILING);
	}
}

function draw_volume(gr) {
	let volume_text = '';

	if (playback.CustomVolume == -1) {
		volume_text = playback.Volume.toFixed(2) + ' dB';
	} else {
		volume_text = 'Volume: ' + playback.CustomVolume;
	}

	gr.WriteText(volume_text, font, properties.text.value, 0, 2, ww - 5, wh - 4, DWRITE_TEXT_ALIGNMENT_TRAILING);
}

function on_mouse_lbtn_dblclk() {
	fb.RunMainMenuCommand('View/Show now playing in playlist');
}

function on_mouse_rbtn_up(x, y) {
	let menu = window.CreatePopupMenu();
	let colour_menu = window.CreatePopupMenu();
	let context_popup = window.CreatePopupMenu();
	let context = fb.CreateContextMenuManager();

	if (playback.IsPlaying) {
		context.InitNowPlaying();
		context.BuildMenu(context_popup, 1000);
		context_popup.AppendTo(menu, MF_STRING, 'Now playing');
		menu.AppendMenuSeparator();
	}

	colour_menu.AppendMenuItem(MF_STRING, 1, 'Background...');
	colour_menu.AppendMenuItem(MF_STRING, 2, 'Text...');
	colour_menu.AppendTo(menu, MF_STRING, 'Colours');
	menu.AppendMenuSeparator();
	menu.AppendMenuItem(MF_STRING, 3, 'Title format...');
	menu.AppendMenuSeparator();
	menu.AppendMenuItem(CheckMenuIf(properties.name.enabled), 10, 'Show playlist name');
	menu.AppendMenuItem(CheckMenuIf(properties.count.enabled), 11, 'Show playlist item count');
	menu.AppendMenuItem(CheckMenuIf(properties.duration.enabled), 12, 'Show playlist duration');
	menu.AppendMenuItem(CheckMenuIf(properties.size.enabled), 13, 'Show playlist size');
	menu.AppendMenuSeparator();
	menu.AppendMenuItem(MF_STRING, 20, 'Configure...');

	const idx = menu.TrackPopupMenu(x, y);

	switch (idx) {
	case 0:
		break;
	case 1:
		properties.background.value = utils.ColourPicker(properties.background.value);
		window.Repaint();
		break;
	case 2:
		properties.text.value = utils.ColourPicker(properties.text.value);
		window.Repaint();
		break;
	case 3:
		try {
			const tmp = utils.TextBox('Enter title format pattern. $rgb is supported.', window.Name, properties.tf.value).trim();

			if (tmp.length && tmp != properties.tf.value) {
				properties.tf.value = tmp;
				tfo = fb.TitleFormat(properties.tf.value);
				window.Repaint();
			}
		} catch (e) {}
		break;
	case 10:
		properties.name.toggle();
		refresh();
		break;
	case 11:
		properties.count.toggle();
		refresh();
		break;
	case 12:
		properties.duration.toggle();
		refresh();
		break;
	case 13:
		properties.size.toggle();
		refresh();
		break;
	case 20:
		window.ShowConfigure();
		break;
	default:
		context.ExecuteByID(idx - 1000);
		break;
	}

	return true;
}

function on_mouse_wheel(s) {
	if (s < 0)
		playback.VolumeDown();
	else
		playback.VolumeUp();
}

function on_paint(gr) {
	gr.Clear(properties.background.value);

	draw_left_text(gr);
	draw_right_text(gr);
	draw_volume(gr);
}

function on_playback_new_track() {
	window.Repaint();
}

function on_playback_starting() {
	if (stop_reason == 2)
		return;

	starting = true;
	window.Repaint();

	window.SetTimeout(function () {
		starting = false;
		window.Repaint();
	}, 500);
}

function on_playback_stop(reason) {
	stop_reason = reason;
	window.Repaint();
}

function on_playback_time() {
	window.Repaint();
}

function on_playlist_items_added(p) {
	if (p == plman.ActivePlaylist) {
		refresh();
	}
}

function on_playlist_items_removed(p) {
	if (p == plman.ActivePlaylist) {
		refresh();
	}
}

function on_playlist_switch() {
	refresh();
}

function on_playlists_changed() {
	if (properties.name.enabled) {
		refresh();
	}
}

function on_size() {
	ww = window.Width;
	wh = window.Height;
}

function on_volume_change() {
	window.Repaint();
}
