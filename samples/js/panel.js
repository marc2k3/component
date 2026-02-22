'use strict';

class Panel {
	constructor (options) {
		this.tfo = {};
		this.list_objects = [];
		this.text_objects = [];
		this.display_objects = [];
		this.colours = {};
		this.custom_background = false;
		this.w = 0;
		this.h = 0;
		this.metadb = fb.GetFocusItem();
		this.metadb_func = typeof on_metadb_changed == 'function';
		this.twemoji_font = false;
		this.row_height = 0;
		this.scroll_step = 0;
		this.selection;

		this.fonts = {
			sizes : [10, 12, 14, 16],
			size : new Property('2K3.PANEL.FONTS.SIZE', 12)
		};

		if (this.metadb_func) {
			this.selection = new Property('2K3.PANEL.SELECTION', 0);
		}

		if (typeof options == 'object' && options.custom_background === true) {
			this.custom_background = true;
			this.colours.mode = new Property('2K3.PANEL.COLOURS.MODE', 0);
			this.colours.custom_background = new Property('2K3.PANEL.COLOURS.CUSTOM.BACKGROUND', RGB(0, 0, 0));
		}

		this.colours_changed();
		this.font_changed();
	}

	create_font (size, weight) {
		return JSON.stringify({
			Name : this.fonts.name,
			Size : Scale(size),
			Weight : weight || 400,
			Style : 0,
			Stretch : 5
		});
	}

	draw_header (gr, str) {
		gr.WriteTextSimple(str, this.fonts.title, this.colours.highlight, LM, 0, this.w - (LM * 2), TM, DWRITE_TEXT_ALIGNMENT_LEADING, DWRITE_PARAGRAPH_ALIGNMENT_CENTER, DWRITE_WORD_WRAPPING_NO_WRAP, DWRITE_TRIMMING_GRANULARITY_CHARACTER);
		gr.DrawLine(0, TM + 0.5, this.w, TM + 0.5, 1, setAlpha(this.colours.highlight, 80));
	}

	get_tfo (t) {
		if (!this.tfo[t]) {
			this.tfo[t] = fb.TitleFormat(t);
		}

		return this.tfo[t];
	}

	prefer_playing () {
		return this.selection.value == 0 && playback.IsPlaying;
	}

	tf (t) {
		if (!this.metadb)
			return '';

		let tfo = this.get_tfo(t);

		if (this.prefer_playing())
			return tfo.Eval();

		return tfo.EvalWithMetadb(this.metadb);
	}

// callbacks begin
	colours_changed () {
		this.colours.background = window.GetUIColour(1);
		this.colours.text = window.GetUIColour(0);
		this.colours.highlight = window.GetUIColour(2);
	}

	font_changed () {
		this.fonts.name = JSON.parse(window.GetUIFont(0)).Name;
		this.fonts.normal = this.create_font(this.fonts.size.value);
		this.fonts.title = this.create_font(this.fonts.size.value, 700);
		this.fonts.monospace = CreateFontString('Consolas', this.fonts.size.value);
		this.twemoji_font = utils.CheckFont('Twemoji Mozilla');

		if (this.twemoji_font) {
			this.fonts.twemoji = CreateFontString('Twemoji Mozilla', this.fonts.size.value);
		}

		this.row_height = Scale(this.fonts.size.value + 4);
		this.scroll_step = Scale(this.fonts.size.value) * 4;
		_.invokeMap(this.text_objects, 'font_changed');
		_.invokeMap(this.list_objects, 'font_changed');
		_.invokeMap(this.display_objects, 'refresh', true);
	}

	item_focus_change () {
		this.metadb = this.prefer_playing() ? playback.GetNowPlaying() : fb.GetFocusItem();

		if (!this.metadb) {
			TT('');
		}
	}

	metadb_changed (handles) {
		return this.metadb && handles.Find(this.metadb) > -1;
	}

	paint (gr) {
		let col;

		switch (true) {
		case !this.custom_background:
		case this.colours.mode.value == 0:
			col = this.colours.background;
			break;
		case this.colours.mode.value == 1:
			col = window.IsDark ? 0x202020 : utils.GetSysColour(15);
			break;
		case this.colours.mode.value == 2:
			col = this.colours.custom_background.value;
			break;
		}

		gr.Clear(col);
	}

	rbtn_up (x, y, object) {
		this.m = window.CreatePopupMenu();
		this.s1 = window.CreatePopupMenu();
		this.s2 = window.CreatePopupMenu();
		this.s3 = window.CreatePopupMenu();
		this.s10 = window.CreatePopupMenu();
		this.s11 = window.CreatePopupMenu();
		this.s12 = window.CreatePopupMenu();
		this.s13 = window.CreatePopupMenu();
		this.s14 = window.CreatePopupMenu();

		// panel 1-999
		// object 1000+
		if (object) {
			object.rbtn_up(x, y);
		}

		if (this.list_objects.length || this.text_objects.length || this.display_objects.length) {
			_.forEach(this.fonts.sizes, (item) => {
				this.s1.AppendMenuItem(MF_STRING, item, item);
			});

			this.s1.CheckMenuRadioItem(_.first(this.fonts.sizes), _.last(this.fonts.sizes), this.fonts.size.value);
			this.s1.AppendTo(this.m, MF_STRING, 'Font size');
			this.m.AppendMenuSeparator();
		}

		if (this.custom_background) {
			this.s2.AppendMenuItem(MF_STRING, 100, 'UI');
			this.s2.AppendMenuItem(MF_STRING, 101, 'Splitter');
			this.s2.AppendMenuItem(MF_STRING, 102, 'Custom');
			this.s2.CheckMenuRadioItem(100, 102, this.colours.mode.value + 100);
			this.s2.AppendMenuSeparator();
			this.s2.AppendMenuItem(EnableMenuIf(this.colours.mode.value == 2), 103, 'Set custom colour...');
			this.s2.AppendTo(this.m, MF_STRING, 'Background colour');
			this.m.AppendMenuSeparator();
		}

		if (this.metadb_func) {
			this.s3.AppendMenuItem(MF_STRING, 110, 'Prefer now playing');
			this.s3.AppendMenuItem(MF_STRING, 111, 'Follow selected track (playlist)');
			this.s3.CheckMenuRadioItem(110, 111, this.selection.value + 110);
			this.s3.AppendTo(this.m, MF_STRING, 'Selection mode');
			this.m.AppendMenuSeparator();
		}

		this.m.AppendMenuItem(MF_STRING, 120, 'Configure...');

		const idx = this.m.TrackPopupMenu(x, y);

		switch (true) {
		case idx == 0:
			break;
		case idx <= 16:
			this.fonts.size.value = idx;
			this.font_changed();
			window.Repaint();
			break;
		case idx == 100:
		case idx == 101:
		case idx == 102:
			this.colours.mode.value = idx - 100;
			window.Repaint();
			break;
		case idx == 103:
			this.colours.custom_background.value = utils.ColourPicker(this.colours.custom_background.value);
			window.Repaint();
			break;
		case idx == 110:
		case idx == 111:
			this.selection.value = idx - 110;
			refresh();
			break;
		case idx == 120:
			window.ShowConfigure();
			break;
		case idx > 999:
			if (object) {
				object.rbtn_up_done(idx);
			}
			break;
		}

		return true;
	}

	size () {
		this.w = window.Width;
		this.h = window.Height;
	}
// callbacks end
}
