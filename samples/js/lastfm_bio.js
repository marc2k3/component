'use strict';

class LastFmBio {
	constructor (x, y, w, h) {
		utils.CreateFolder(Paths.artists);
		panel.text_objects.push(this);
		this.name = 'lastfm_bio';

		this.x = x;
		this.y = y;
		this.w = w;
		this.h = h;
		this.ha = h - Scale(24); // height adjusted for up/down buttons
		this.text_layout = null;
		this.text_height = 0;
		this.mx = 0;
		this.my = 0;
		this.offset = 0;
		this.text = '';

		this.artist = '';
		this.filename = '';
		this.filenames = {};
		this.langs = ['en', 'de', 'es', 'fr', 'it', 'ja', 'pl', 'pt', 'ru', 'sv', 'tr', 'zh'];
		this.flag = '';

		this.properties = {
			lang : new Property('2K3.BIO.LANG', 0),
			country_tf : new Property('2K3.BIO.COUNTRY.TF', '$country_flag(%country%)'),
		};

		this.up_btn = new SimpleButton(chars.up, this.x, this.y, Scale(12), Scale(12), () => { return this.offset < 0; }, () => { this.wheel(1); });
		this.down_btn = new SimpleButton(chars.down, this.x, this.y, Scale(12), Scale(12), () => { return this.offset > this.ha - this.text_height; }, () => { this.wheel(-1); });
	}

	clear_layout () {
		if (this.text_layout) {
			this.text_layout = null;
		}
	}

	containsXY (x, y) {
		return x > this.x && x < this.x + this.w && y > this.y && y < this.y + this.h;
	}

	download_file_done (path, success, error_text) {
		if (success) {
			this.reset();
			this.refresh();
		} else {
			console.log(N, error_text);
		}
	}

	draw_header (gr, colour, x, y, w, h, draw_line) {
		let flag_width = 0;

		if (this.flag.length && panel.fonts.twemoji) {
			flag_width = utils.CalcTextWidth(this.flag + ' ', panel.fonts.twemoji);
			gr.WriteTextSimple(this.flag, panel.fonts.twemoji, colour, x, y, flag_width, h, DWRITE_TEXT_ALIGNMENT_LEADING, DWRITE_PARAGRAPH_ALIGNMENT_CENTER, DWRITE_WORD_WRAPPING_NO_WRAP, DWRITE_TRIMMING_GRANULARITY_CHARACTER);
		}

		gr.WriteTextSimple(this.artist, panel.fonts.title, colour, x + flag_width, y, w - flag_width, h, DWRITE_TEXT_ALIGNMENT_LEADING, DWRITE_PARAGRAPH_ALIGNMENT_CENTER, DWRITE_WORD_WRAPPING_NO_WRAP, DWRITE_TRIMMING_GRANULARITY_CHARACTER);

		if (draw_line) {
			y += TM + 0.5;
			gr.DrawLine(x, y, w, y, 1, setAlpha(colour, 80));
		}
	}

	font_changed () {
		this.reset();
		this.refresh();
	}

	get () {
		if (lastfm.api_key.empty() || !Tagged(this.artist))
			return;

		const url = lastfm.base_url() + '&method=artist.getInfo&autocorrect=1&lang=' + this.langs[this.properties.lang.value] + '&artist=' + encodeURIComponent(this.artist);
		utils.DownloadFileAsync(url, this.filename);
	}

	key_down (k) {
		switch (k) {
		case VK_UP:
			this.wheel(1);
			return true;
		case VK_DOWN:
			this.wheel(-1);
			return true;
		default:
			return false;
		}
	}

	lbtn_up (x, y) {
		if (!this.containsXY(x, y))
			return false;

		this.up_btn.lbtn_up(x, y);
		this.down_btn.lbtn_up(x, y);
		return true;
	}

	move (x, y) {
		this.mx = x;
		this.my = y;
		window.SetCursor(IDC_ARROW);

		if (!this.containsXY(x, y))
			return false;

		this.up_btn.move(x, y);
		this.down_btn.move(x, y);
		return true;
	}

	paint (gr) {
		if (lastfm.api_key.empty()) {
			gr.WriteTextSimple('Use the right click menu to set your own Last.fm API key.', panel.fonts.normal, panel.colours.text, this.x, this.y + Scale(12), this.w, this.h);
		} else if (this.text_layout) {
			gr.WriteTextLayout(this.text_layout, panel.colours.text, this.x, this.y + Scale(12), this.w, this.ha, this.offset);
			this.up_btn.paint(gr, panel.colours.text);
			this.down_btn.paint(gr, panel.colours.text);
		}
	}

	rbtn_up (x, y) {
		panel.m.AppendMenuItem(EnableMenuIf(panel.metadb), 1100, 'Force update');
		panel.m.AppendMenuSeparator();
		panel.m.AppendMenuItem(MF_STRING, 1101, 'Last.fm API key...');
		panel.m.AppendMenuSeparator();

		this.langs.forEach((item, i) => {
			panel.s10.AppendMenuItem(MF_STRING, i + 1110, item);
		});

		panel.s10.CheckMenuRadioItem(1110, 1121, this.properties.lang.value + 1110);
		panel.s10.AppendTo(panel.m, MF_STRING, 'Last.fm language');
		panel.m.AppendMenuSeparator();
		panel.m.AppendMenuItem(EnableMenuIf(utils.IsFile(this.filename)), 1999, 'Open containing folder');
		panel.m.AppendMenuSeparator();
	}

	rbtn_up_done (idx) {
		switch (idx) {
		case 1100:
			this.get();
			break;
		case 1101:
			lastfm.update_api_key();
			break;
		case 1110:
		case 1111:
		case 1112:
		case 1113:
		case 1114:
		case 1115:
		case 1116:
		case 1117:
		case 1118:
		case 1119:
		case 1120:
		case 1121:
			this.properties.lang.value = idx - 1110;
			this.reset();
			this.refresh();
			break;
		case 1999:
			Explorer(this.filename);
			break;
		}
	}

	refresh () {
		if (panel.metadb) {
			const temp_artist = panel.tf(DEFAULT_ARTIST);
			const temp_flag = panel.tf(this.properties.country_tf.value)

			if (this.artist == temp_artist && this.flag == temp_flag) {
				return;
			}

			this.artist = temp_artist;
			this.flag = temp_flag;
			this.filename = ArtistFolder(this.artist) + 'lastfm.artist.getInfo.' + this.langs[this.properties.lang.value] + '.json';
			let str = '';

			if (utils.IsFile(this.filename)) {
				let obj = JsonParseFile(this.filename);
				str = _.get(obj, 'artist.bio.content', '').trim();
				str = StripTags(str);
				str = str.replace('Read more on Last.fm. User-contributed text is available under the Creative Commons By-SA License; additional terms may apply.', '');

				if (FileExpired(this.filename, ONE_DAY)) {
					this.get();
				}
			} else {
				this.get();
			}

			if (str != this.text) {
				this.clear_layout()
				this.text = str;

				if (this.text.length) {
					this.text_layout = utils.CreateTextLayout(this.text, panel.fonts.normal);
				}
			}
		} else {
			this.clear_layout();
			this.reset();
		}

		this.update();
		window.Repaint();
	}

	reset () {
		this.text = this.flag = this.artist = this.filename = '';
	}

	size () {
		this.ha = this.h - Scale(24);
		this.up_btn.x = this.x + Math.round((this.w - Scale(12)) / 2);
		this.down_btn.x = this.up_btn.x;
		this.up_btn.y = this.y;
		this.down_btn.y = this.y + this.h - Scale(12);
		this.update();
	}

	update () {
		if (!this.text_layout) {
			this.text_height = 0;
			return;
		}

		this.text_height = this.text_layout.CalcTextHeight(this.w);

		if (this.text_height < this.ha)
			this.offset = 0;
		else if (this.offset < this.ha - this.text_height)
			this.offset = this.ha - this.text_height;
	}

	wheel (s) {
		if (!this.containsXY(this.mx, this.my))
			return false;

		if (this.text_height > this.ha) {
			this.offset += s * panel.scroll_step;

			if (this.offset > 0)
				this.offset = 0;
			else if (this.offset < this.ha - this.text_height)
				this.offset = this.ha - this.text_height;

			window.RepaintRect(this.x, this.y, this.w, this.h);
		}

		return true;
	}
}
