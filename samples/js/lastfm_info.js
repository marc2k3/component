'use strict';

class LastFmInfo {
	constructor (x, y, w, h) {
		utils.CreateFolder(Paths.artists);
		utils.CreateFolder(Paths.lastfm);
		panel.list_objects.push(this);

		this.name = 'lastfm_info'; // needs a name to be triggerd by lastfm user name change
		this.x = x;
		this.y = y;
		this.w = w;
		this.h = h;
		this.mx = 0;
		this.my = 0;
		this.index = 0;
		this.offset = 0;
		this.count = 0;
		this.data = [];
		this.clickable_text_x = 0;
		this.spacer_w = 0;
		this.artist = '';
		this.filename = '';
		this.filenames = {};
		this.time_elapsed = 0;

		this.artist_methods = [{
				method : 'artist.getSimilar',
				json : 'similarartists.artist',
				display : 'similar artists',
			}, {
				method : 'artist.getTopTracks',
				json : 'toptracks.track',
				display : 'top tracks',
			}, {
				method : 'artist.getTopTags',
				json : 'toptags.tag',
				display : 'top tags',
			}
		];

		this.chart_methods = [{
				method : 'user.getTopArtists',
				json : 'topartists.artist',
				display : 'artist',
			}, {
				method : 'user.getTopAlbums',
				json : 'topalbums.album',
				display : 'album',
			}, {
				method : 'user.getTopTracks',
				json : 'toptracks.track',
				display : 'track',
			}
		];

		this.chart_periods = [{
				period : 'overall',
				display : 'overall',
			}, {
				period : '7day',
				display : 'last 7 days',
			}, {
				period : '1month',
				display : '1 month',
			}, {
				period : '3month',
				display : '3 month',
			}, {
				period : '6month',
				display : '6 month',
			}, {
				period : '12month',
				display : '12 month',
			}
		];

		this.properties = {
			mode : new Property('2K3.LASTFM.MODE', 0), // 0 artist 1 user
			artist_method : new Property('2K3.LASTFM.ARTIST.METHOD', 0), // 0 similar artists 1 top tracks 2 top tags
			user_mode : new Property('2K3.LASTFM.USER.MODE', 0), // 0 charts 1 recent tracks
			charts_method : new Property('2K3.LASTFM.CHARTS.METHOD', 0),
			charts_period : new Property('2K3.LASTFM.CHARTS.PERIOD', 0),
		};

		if (this.properties.mode.value == 1) {
			this.update();
		}

		this.up_btn = new SimpleButton(chars.up, this.x, this.y, Scale(12), Scale(12), () => { return this.offset > 0; }, () => { this.wheel(1); });
		this.down_btn = new SimpleButton(chars.down, this.x, this.y, Scale(12), Scale(12), () => { return this.offset < this.count - this.rows; }, () => { this.wheel(-1); });
	}

	containsXY (x, y) {
		return x > this.x && x < this.x + this.w && y > this.y && y < this.y + this.h;
	}

	draw_row (gr, text, colour, x, y, w, h, text_alignment) {
		gr.WriteTextSimple(text, panel.fonts.normal, colour, x, y, w, h, text_alignment || DWRITE_TEXT_ALIGNMENT_LEADING, DWRITE_PARAGRAPH_ALIGNMENT_CENTER, DWRITE_WORD_WRAPPING_NO_WRAP, DWRITE_TRIMMING_GRANULARITY_CHARACTER);
	}

	font_changed () {
		this.size();
		this.reset();
	}

	get () {
		if (lastfm.api_key.empty())
			return;

		let url;

		switch (this.properties.mode.value) {
		case 0:
			if (!Tagged(this.artist)) {
				return;
			}

			url = lastfm.base_url() + '&limit=100&method=' + this.artist_methods[this.properties.artist_method.value].method + '&artist=' + encodeURIComponent(this.artist);
			break;
		case 1:
			if (this.properties.user_mode.value == 0) {
				url = lastfm.base_url() + '&limit=100&method=' + this.chart_methods[this.properties.charts_method.value].method + '&period=' + this.chart_periods[this.properties.charts_period.value].period + '&user=' + lastfm.username;
			} else {
				url = lastfm.base_url() + '&limit=100&method=user.getRecentTracks&user=' + lastfm.username;
			}
			break;
		}

		const task_id = utils.HTTPRequestAsync(GET, url, LastFm.ua);
		this.filenames[task_id] = this.filename;
	}

	header_text () {
		if (this.properties.mode.value == 0) {
			return this.artist + ': ' + this.artist_methods[this.properties.artist_method.value].display;
		} else {
			if (this.properties.user_mode.value == 0) {
				return lastfm.username + ': ' + this.chart_periods[this.properties.charts_period.value].display + ' ' + this.chart_methods[this.properties.charts_method.value].display + ' charts';
			} else {
				return lastfm.username + ': recent tracks';
			}
		}
	}

	http_request_done (task_id, success, response_text) {
		const f = this.filenames[task_id];

		if (!f)
			return;

		if (!success) {
			console.log(N, response_text);
			return;
		}

		let data = JsonParse(response_text);

		if (data.error) {
			console.log(N, data.message);
			return;
		}

		Save(f, response_text);

		if (f == this.filename) {
			this.reset();
		}
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

		switch (true) {
		case this.up_btn.lbtn_up(x, y):
		case this.down_btn.lbtn_up(x, y):
		case !this.in_range:
			break;
		default:
			let item = this.data[this.index];

			if (x > this.x + this.clickable_text_x && x < this.x + this.clickable_text_x + Math.min(item.width, this.text_width) && typeof item.url == 'string') {
				if (item.url.startsWith('http')) {
					utils.Run(item.url);
				} else {
					plman.ActivePlaylist = plman.CreateAutoPlaylist(plman.PlaylistCount, item.value, item.url);
				}
			}
			break;
		}

		return true;
	}

	move (x, y) {
		this.mx = x;
		this.my = y;
		window.SetCursor(IDC_ARROW);

		if (!this.containsXY(x, y))
			return false;

		this.index = Math.floor((y - this.y - Scale(12)) / panel.row_height) + this.offset;
		this.in_range = this.index >= this.offset && this.index < this.offset + Math.min(this.rows, this.count);
		switch (true) {
		case this.up_btn.move(x, y):
		case this.down_btn.move(x, y):
			break;
		case !this.in_range:
			break;
		default:
			let item = this.data[this.index];

			if (x > this.x + this.clickable_text_x && x < this.x + this.clickable_text_x + Math.min(item.width, this.text_width) && typeof item.url == 'string') {
				window.SetCursor(IDC_HAND);
				TT(item.url);
			} else {
				TT('');
			}
			break;
		}

		return true;
	}

	paint (gr) {
		if (lastfm.api_key.empty()) {
			gr.WriteTextSimple('Use the right click menu to set your own Last.fm API key.', panel.fonts.normal, panel.colours.text, this.x, this.y + Scale(12), this.w, this.h);
			return;
		}

		if (this.count == 0)
			return;

		switch (true) {
		case this.properties.mode.value == 1 && this.properties.user_mode.value == 0: // charts
			this.clickable_text_x = this.spacer_w + 5;
			this.text_width = Math.round(this.w * 0.5);
			const lastfm_charts_bar_x = this.x + this.clickable_text_x + this.text_width + 10;
			const unit_width = (this.w - lastfm_charts_bar_x - Scale(50)) / this.data[0].playcount;

			for (let i = 0; i < Math.min(this.count, this.rows); i++) {
				let item = this.data[i + this.offset];
				const bar_width = Math.ceil(unit_width * item.playcount);
				this.draw_row(gr, item.rank + '.', panel.colours.highlight, this.x, this.y + Scale(12) + (i * panel.row_height), this.clickable_text_x - 5, panel.row_height, DWRITE_TEXT_ALIGNMENT_TRAILING);
				this.draw_row(gr, item.name, panel.colours.text, this.x + this.clickable_text_x, this.y + Scale(12) + (i * panel.row_height), this.text_width, panel.row_height);
				gr.FillRectangle(lastfm_charts_bar_x, this.y + Scale(13) + (i * panel.row_height), bar_width, panel.row_height - 3, panel.colours.highlight);
				this.draw_row(gr, FormatNumber(item.playcount, ','), panel.colours.text, lastfm_charts_bar_x + bar_width + 5, this.y + Scale(12) + (i * panel.row_height), Scale(60), panel.row_height);
			}
			break;
		default: // other
			this.clickable_text_x = 0;
			this.text_width = this.w;

			for (let i = 0; i < Math.min(this.count, this.rows); i++) {
				this.draw_row(gr, this.data[i + this.offset].name, panel.colours.text, this.x, this.y + Scale(12) + (i * panel.row_height), this.text_width, panel.row_height);
			}
			break;
		}

		this.up_btn.paint(gr, panel.colours.text);
		this.down_btn.paint(gr, panel.colours.text);
	}

	playback_new_track () {;
		this.time_elapsed = 0;
		this.refresh();
	}

	playback_time () {
		this.time_elapsed++;

		if (this.time_elapsed == 3 && this.properties.mode.value == 1 && this.properties.user_mode.value == 1 && lastfm.username.length) {
			this.get();
		}
	}

	rbtn_up (x, y) {
		panel.m.AppendMenuItem(MF_STRING, 1100, 'Artist Info');
		panel.m.AppendMenuItem(MF_STRING, 1101, 'User Info');
		panel.m.CheckMenuRadioItem(1100, 1101, this.properties.mode.value + 1100);
		panel.m.AppendMenuSeparator();

		if (this.properties.mode.value == 0) {
			panel.m.AppendMenuItem(MF_STRING, 1102, 'Similar Artists');
			panel.m.AppendMenuItem(MF_STRING, 1103, 'Top Tracks');
			panel.m.AppendMenuItem(MF_STRING, 1104, 'Top Tags');
			panel.m.CheckMenuRadioItem(1102, 1104, this.properties.artist_method.value + 1102);
			panel.m.AppendMenuSeparator();
		} else {
			panel.m.AppendMenuItem(MF_STRING, 1110, 'Charts');
			panel.m.AppendMenuItem(MF_STRING, 1111, 'Recent Tracks');
			panel.m.CheckMenuRadioItem(1110, 1111, this.properties.user_mode.value + 1110);
			panel.m.AppendMenuSeparator();

			if (this.properties.user_mode.value == 0) {
				this.chart_methods.forEach((item, i) => {
					panel.m.AppendMenuItem(MF_STRING, i + 1120, _.capitalize(item.display));
				});

				panel.m.CheckMenuRadioItem(1120, 1122, this.properties.charts_method.value + 1120);
				panel.m.AppendMenuSeparator();

				this.chart_periods.forEach((item, i) => {
					panel.m.AppendMenuItem(MF_STRING, i + 1130, _.capitalize(item.display));
				});

				panel.m.CheckMenuRadioItem(1130, 1135, this.properties.charts_period.value + 1130);
				panel.m.AppendMenuSeparator();
			}
		}

		panel.m.AppendMenuItem(MF_STRING, 1150, 'Last.fm username...');
		panel.m.AppendMenuItem(MF_STRING, 1151, 'Last.fm API key...');
		panel.m.AppendMenuSeparator();
		panel.m.AppendMenuItem(EnableMenuIf(utils.IsFile(this.filename)), 1999, 'Open containing folder');
		panel.m.AppendMenuSeparator();
	}

	rbtn_up_done (idx) {
		switch (idx) {
		case 1100:
		case 1101:
			this.properties.mode.value = idx - 1100;
			this.reset();
			break;
		case 1102:
		case 1103:
		case 1104:
			this.properties.artist_method.value = idx - 1102;
			this.reset();
			break;
		case 1110:
		case 1111:
			this.properties.user_mode.value = idx - 1110;
			this.reset();
			break;
		case 1120:
		case 1121:
		case 1122:
			this.properties.charts_method.value = idx - 1120;
			this.reset();
			break;
		case 1130:
		case 1131:
		case 1132:
		case 1133:
		case 1134:
		case 1135:
			this.properties.charts_period.value = idx - 1130;
			this.reset();
			break;
		case 1150:
			lastfm.update_username();
			break;
		case 1151:
			lastfm.update_api_key();
			break;
		case 1999:
			Explorer(this.filename);
			break;
		}
	}

	refresh () {
		// user mode
		if (this.properties.mode.value == 1)
			return;

		if (panel.metadb) {
			const temp_artist = panel.tf(DEFAULT_ARTIST);
			if (this.artist == temp_artist)
				return;

			this.artist = temp_artist;
			this.update();
		} else {
			this.artist = '';
			this.filename = '';
			this.data = [];
			this.count = 0;
			window.Repaint();
		}
	}

	reset () {
		this.count = 0;
		this.data = [];
		this.artist = '';

		if (this.properties.mode.value == 0) { // artist
			this.refresh();
		} else { // user
			this.update();
		}
	}

	size () {
		this.index = 0;
		this.offset = 0;
		this.rows = Math.floor((this.h - Scale(24)) / panel.row_height);
		this.up_btn.x = this.x + Math.round((this.w - Scale(12)) * 0.5);
		this.down_btn.x = this.up_btn.x;
		this.up_btn.y = this.y;
		this.down_btn.y = this.y + this.h - Scale(12);
	}

	update () {
		this.data = [];
		this.spacer_w = '0000'.calc_width(panel.fonts.normal);
		this.filename = '';

		switch (this.properties.mode.value) {
		case 0:
			this.filename = ArtistFolder(this.artist) + 'lastfm.' + this.artist_methods[this.properties.artist_method.value].method + '.json';
			if (utils.IsFile(this.filename)) {
				this.data = _(_.get(JsonParseFile(this.filename), this.artist_methods[this.properties.artist_method.value].json, []))
					.map((item) => {
						return {
							name : item.name,
							width : item.name.calc_width(panel.fonts.normal),
							url : item.url
						};
					})
					.value();

				if (FileExpired(this.filename, ONE_DAY)) {
					this.get();
				}
			} else {
				this.get();
			}
			break;
		case 1:
			if (!lastfm.username.length) {
				console.log(N, 'Last.fm username not set.');
				break;
			}

			if (this.properties.user_mode.value == 0) {
				this.filename = Paths.lastfm + lastfm.username + '.' + this.chart_methods[this.properties.charts_method.value].method + '.' + this.chart_periods[this.properties.charts_period.value].period + '.json';
				if (utils.IsFile(this.filename)) {
					let data = _.get(JsonParseFile(this.filename), this.chart_methods[this.properties.charts_method.value].json, []);

					for (let i = 0; i < data.length; i++) {
						let name, url;

						if (this.properties.charts_method.value == 0) {
							name = data[i].name;
							url = data[i].url;
						} else {
							name = data[i].artist.name + ' - ' + data[i].name;
							url = data[i].url;
						}

						this.data[i] = {
							name : name,
							width : name.calc_width(panel.fonts.normal),
							url : url,
							playcount : data[i].playcount,
							rank : i > 0 && data[i].playcount == data[i - 1].playcount ? this.data[i - 1].rank : i + 1
						};
					}

					if (FileExpired(this.filename, ONE_DAY)) {
						this.get();
					}
				} else {
					this.get();
				}
			} else {
				this.filename = Paths.lastfm + lastfm.username + '.user.getRecentTracks.json';

				if (utils.IsFile(this.filename)) {
					this.data = _(_.get(JsonParseFile(this.filename), 'recenttracks.track', []))
						.filter('date')
						.map((item) => {
							const name = item.artist['#text'] + ' - ' + item.name;

							return {
								name : name,
								width : name.calc_width(panel.fonts.normal),
								url : item.url
							};
						})
						.value();
				} else {
					this.get();
				}
			}
		}

		this.count = this.data.length;
		this.offset = 0;
		this.index = 0;
		window.Repaint();
	}

	wheel (s) {
		if (!this.containsXY(this.mx, this.my))
			return false;

		if (this.count > this.rows) {
			let offset = this.offset - (s * 3);

			if (offset < 0) {
				offset = 0;
			} else if (offset + this.rows > this.count) {
				offset = this.count - this.rows;
			}

			if (this.offset != offset) {
				this.offset = offset;
				window.RepaintRect(this.x, this.y, this.w, this.h);
			}
		}

		return true;
	}
}
