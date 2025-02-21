function _panel(options) {
	this.create_font = function (size, weight) {
		return JSON.stringify({
			Name : this.fonts.name,
			Size : _scale(size),
			Weight : weight || 400,
			Style : 0,
			Stretch : 5
		});
	}

	this.draw_header = function (gr, str) {
		gr.WriteTextSimple(str, this.fonts.title, this.colours.highlight, LM, 0, this.w - (LM * 2), TM, DWRITE_TEXT_ALIGNMENT_LEADING, DWRITE_PARAGRAPH_ALIGNMENT_CENTER, DWRITE_WORD_WRAPPING_NO_WRAP, DWRITE_TRIMMING_GRANULARITY_CHARACTER);
		gr.DrawLine(0, TM + 0.5, this.w, TM + 0.5, 1, setAlpha(this.colours.highlight, 80));
	}

	this.get_tfo = function (t) {
		if (!this.tfo[t]) {
			this.tfo[t] = fb.TitleFormat(t);
		}

		return this.tfo[t];
	}

	this.prefer_playing = function () {
		return this.selection.value == 0 && playback.IsPlaying;
	}

	this.tf = function (t) {
		if (!this.metadb)
			return '';

		var tfo = this.get_tfo(t);

		if (this.prefer_playing())
			return tfo.Eval();

		return tfo.EvalWithMetadb(this.metadb);
	}

// callbacks begin
	this.colours_changed = function () {
		this.colours.background = window.GetUIColour(1);
		this.colours.text = window.GetUIColour(0);
		this.colours.highlight = window.GetUIColour(2);
	}

	this.font_changed = function () {
		this.fonts.name = JSON.parse(window.GetUIFont(0)).Name;
		this.fonts.normal = this.create_font(this.fonts.size.value);
		this.fonts.title = this.create_font(this.fonts.size.value, 700);
		this.fonts.fixed = CreateFontString('Consolas', this.fonts.size.value);

		if (this.twemoji_font) {
			this.fonts.twemoji = CreateFontString('Twemoji Mozilla', this.fonts.size.value);
		}

		this.row_height = _scale(this.fonts.size.value + 4);
		this.scroll_step = _scale(this.fonts.size.value) * 4;
		_.invoke(this.text_objects, 'font_changed');
		_.invoke(this.list_objects, 'font_changed');
		_.invoke(this.display_objects, 'refresh', true);
	}

	this.item_focus_change = function () {
		if (!this.metadb_func)
			return;

		this.metadb = this.prefer_playing() ? playback.GetNowPlaying() : plman.GetActivePlaylistFocusItem();

		if (!this.metadb) {
			_tt('');
		}

		on_metadb_changed();
	}

	this.paint = function (gr) {
		switch (true) {
		case !this.custom_background:
		case this.colours.mode.value == 0:
			var col = this.colours.background;
			break;
		case this.colours.mode.value == 1:
			var col = window.IsDark ? 0x202020 : utils.GetSysColour(15);
			break;
		case this.colours.mode.value == 2:
			var col = this.colours.custom_background.value;
			break;
		}

		gr.Clear(col);
	}

	this.rbtn_up = function (x, y, object) {
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
			_.forEach(this.fonts.sizes, function (item) {
				this.s1.AppendMenuItem(MF_STRING, item, item);
			}, this);

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

		var idx = this.m.TrackPopupMenu(x, y);
		this.m.Dispose();

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
			this.item_focus_change();
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

	this.size = function () {
		this.w = window.Width;
		this.h = window.Height;
	}
// callbacks end

	this.fonts = {};
	this.colours = {};
	this.tfo = {};
	this.list_objects = [];
	this.text_objects = [];
	this.display_objects = [];
	this.custom_background = false;
	this.w = 0;
	this.h = 0;
	this.metadb = plman.GetActivePlaylistFocusItem();
	this.metadb_func = typeof on_metadb_changed == 'function';
	this.fonts.sizes = [10, 12, 14, 16];
	this.fonts.size = new Property('2K3.PANEL.FONTS.SIZE', 12);
	this.twemoji_font = utils.CheckFont('Twemoji Mozilla');
	this.row_height = 0;
	this.scroll_step = 0;

	if (this.metadb_func) {
		this.selection = new Property('2K3.PANEL.SELECTION', 0);
	}

	if (typeof options == 'object') {
		if (options.custom_background === true) {
			this.custom_background = true;
			this.colours.mode = new Property('2K3.PANEL.COLOURS.MODE', 0);
			this.colours.custom_background = new Property('2K3.PANEL.COLOURS.CUSTOM.BACKGROUND', RGB(0, 0, 0));
		}
	}

	this.colours_changed();
	this.font_changed();
}
