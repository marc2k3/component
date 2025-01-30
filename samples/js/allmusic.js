function _allmusic(x, y, w, h) {
	this.clear_layout = function () {
		if (this.text_layout) {
			this.text_layout.Dispose();
			this.text_layout = null;
		}
	}

	this.containsXY = function (x, y) {
		return x > this.x && x < this.x + this.w && y > this.y && y < this.y + this.h;
	}

	this.font_changed = function () {
		this.reset();
		this.metadb_changed();
	}

	this.get = function () {
		var url;

		if (this.review_url.length) {
			url = this.review_url;
		} else {
			if (!_tagged(this.artist) || !_tagged(this.album))
				return;

			if (this.artist.toLowerCase() == 'various artists') {
				url = this.search_base + encodeURIComponent(this.album);
			} else {
				url = this.search_base + encodeURIComponent(this.artist + ' ' + this.album);
			}

			if (this.history[url])
				return;

			this.history[url] = true;
		}

		var task_id = utils.HTTPRequestAsync(window.ID, 0, url, this.headers);
		this.filenames[task_id] = this.filename;
	}

	this.header_text = function () {
		return panel.tf('%album artist%[ - %album%]');
	}

	this.http_request_done = function (id, success, response_text) {
		var filename = this.filenames[id];

		if (!filename)
			return;

		if (!success) {
			console.log(N, response_text);
			return;
		}

		if (this.review_url.length) {
			this.review_url = '';
			var content = this.parse_review(response_text);

			if (content.length) {
				console.log(N, 'A review was found and saved.');
				_save(filename, content);
				this.reset();
				this.metadb_changed();
			} else {
				console.log(N, 'No review was found on the page for this album.');
			}
		} else {
			this.parse_search_results(response_text);
		}
	}

	this.is_match = function (artist, album) {
		return this.tidy(artist) == this.tidy(this.artist) && this.tidy(album) == this.tidy(this.album);
	}

	this.key_down = function (k) {
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

	this.lbtn_up = function (x, y) {
		if (!this.containsXY(x, y))
			return false;

		this.up_btn.lbtn_up(x, y);
		this.down_btn.lbtn_up(x, y);
		return true;
	}

	this.metadb_changed = function () {
		if (panel.metadb) {
			var str = '';

			var temp_artist = panel.tf('%album artist%');
			var temp_album = panel.tf('%album%');

			if (this.artist == temp_artist && this.album == temp_album)
				return;

			this.artist = temp_artist;
			this.album = temp_album;
			this.filename = _artistFolder(this.artist) + 'allmusic.' + utils.ReplaceIllegalChars(this.album) + '.txt';
			this.review_url = '';

			if (utils.IsFile(this.filename)) {
				str = utils.ReadUTF8(this.filename).trim();
				if (str.empty()) {
					// empty files left by previous version can be removed
					utils.RemovePath(this.filename);
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

	this.move = function (x, y) {
		this.mx = x;
		this.my = y;
		window.SetCursor(IDC_ARROW);

		if (!this.containsXY(x, y))
			return false;

		this.up_btn.move(x, y);
		this.down_btn.move(x, y);
		return true;
	}

	this.paint = function (gr) {
		if (!this.text_layout)
			return;

		gr.WriteTextLayout(this.text_layout, panel.colours.text, this.x, this.y + _scale(12), this.w, this.ha, this.offset);
		this.up_btn.paint(gr, panel.colours.text);
		this.down_btn.paint(gr, panel.colours.text);
	}

	this.parse_review = function (response_text) {
		if (response_text.empty())
			return '';

		var p = _.first(_getElementsByTagName(response_text, 'p'));

		if (typeof p == 'object')
			return p.innerText;

		return '';
	}

	this.parse_search_results = function (response_text) {
		try {
			this.review_url = '';

			_(_getElementsByTagName(response_text, 'div'))
				.filter({className : 'info'})
				.forEach(function (info_div) {
					var artist, album, url;
					var divs = info_div.getElementsByTagName('div');

					for (var i = 0; i < divs.length; i++) {
						var div = divs[i];
						var className = div.className;
						var a = _firstElement(div, 'a');

						if (typeof a == 'object') {
							if (className == 'artist') {
								artist = a.innerText;
							} else if (className == 'title') {
								album = a.innerText;
								url = a.href + '/reviewAjax';
							}
						} else if (className == 'artist') {
							artist = 'Various Artists';
						}
					}

					if (this.is_match(artist, album)) {
						this.review_url = url;
						return false;
					}
				}, this)
				.value();

			if (this.review_url.length) {
				console.log(N, 'A page was found for ' + _q(this.album) + '. Now checking for review...');
				this.get();
			} else {
				console.log(N, 'A match could not be found for ' + _q(this.album));
			}
		} catch (e) {
			console.log(N, 'Could not parse Allmusic server response.');
		}
	}

	this.rbtn_up = function (x, y) {
		this.cb = utils.GetClipboardText();
		panel.m.AppendMenuItem(EnableMenuIf(panel.metadb && this.cb.length > 0 && _tagged(this.artist) && _tagged(this.album)), 1000, 'Paste text from clipboard');
		panel.m.AppendMenuSeparator();
		panel.m.AppendMenuItem(EnableMenuIf(utils.IsFile(this.filename)), 1999, 'Open containing folder');
		panel.m.AppendMenuSeparator();
	}

	this.rbtn_up_done = function (idx) {
		switch (idx) {
		case 1000:
			_save(this.filename, this.cb);
			this.reset();
			this.metadb_changed();
			break;
		case 1999:
			_explorer(this.filename);
			break;
		}
	}

	this.reset = function () {
		this.text = this.artist = this.album = this.filename = '';
	}

	this.size = function () {
		this.ha = this.h - _scale(24);
		this.up_btn.x = this.x + Math.round((this.w - _scale(12)) / 2);
		this.down_btn.x = this.up_btn.x;
		this.up_btn.y = this.y;
		this.down_btn.y = this.y + this.h - _scale(12);
		this.update();
	}

	this.tidy = function (str) {
		return utils.ConvertToAscii(str).toLowerCase().replace(/ and /g, '').replace(/ & /g, '');
	}

	this.update = function () {
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

	this.wheel = function (s) {
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

	utils.CreateFolder(folders.artists);
	panel.text_objects.push(this);
	this.name = 'allmusic';

	this.x = x;
	this.y = y;
	this.w = w;
	this.h = h;
	this.ha = h - _scale(24); // height adjusted for up/down buttons
	this.text_layout = null;
	this.text_height = 0;
	this.mx = 0;
	this.my = 0;
	this.offset = 0;
	this.text = '';

	this.artist = '';
	this.album = '';
	this.filename = '';
	this.filenames = {};
	this.review_url = '';
	this.search_base = 'https://www.allmusic.com/search/albums/';
	this.history = {};

	this.headers = JSON.stringify({
		'User-Agent' : 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0',
		'Referer' : 'https://allmusic.com',
	});

	this.up_btn = new _sb(chars.up, this.x, this.y, _scale(12), _scale(12), _.bind(function () { return this.offset < 0; }, this), _.bind(function () { this.wheel(1); }, this));
	this.down_btn = new _sb(chars.down, this.x, this.y, _scale(12), _scale(12), _.bind(function () { return this.offset > this.ha - this.text_height; }, this), _.bind(function () { this.wheel(-1); }, this));
}
