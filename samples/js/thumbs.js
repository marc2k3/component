function _thumbs() {
	this.containsXY = function (x, y) {
		return x > this.x && x < this.x + this.w && y > this.y && y < this.y + this.h;
	}

	this.create_grid = function () {
		if (this.img) this.img.Dispose();
		var size = this.properties.px.value;

		this.img = utils.CreateImage(Math.min(this.columns, this.thumbs.length) * size, this.img_rows * size);
		var temp_gr = this.img.GetGraphics();
		var current = 0;

		for (var row = 0; row < this.img_rows; row++) {
			for (var col = 0; col < this.columns; col++) {
				if (!this.thumbs[current])
					continue;

				if (this.properties.circular.enabled) {
					temp_gr.DrawImageWithMask(this.thumbs[current], this.circular_mask, col * size, row * size, size, size);
				} else {
					_drawImage(temp_gr, this.thumbs[current], col * size, row * size, size, size);
				}
				current++;
			}
		}

		this.img.ReleaseGraphics();
		temp_gr = null;
	}

	this.create_mask = function() {
		this.circular_mask = utils.CreateImage(512, 512);
		var temp_gr = this.circular_mask.GetGraphics();
		temp_gr.FillEllipse(256, 256, 256, 256, RGB(0, 0, 0));
		this.circular_mask.ReleaseGraphics();
		temp_gr = null;
	}

	this.create_strip = function (vertical) {
		if (this.img) this.img.Dispose();
		var size = this.properties.px.value;
		var x = y = 0;

		if (vertical) {
			this.img = utils.CreateImage(size, size * this.thumbs.length);
		} else {
			this.img = utils.CreateImage(size * this.thumbs.length, size);
		}

		var temp_gr = this.img.GetGraphics();

		_.forEach(this.thumbs, function (item, i) {
			if (vertical) y = i * size;
			else x = i * size;

			if (this.properties.circular.enabled) {
				temp_gr.DrawImageWithMask(item, this.circular_mask, x, y, size, size)
			} else {
				_drawImage(temp_gr, item, x, y, size, size);
			}
		}, this);

		this.img.ReleaseGraphics();
		temp_gr = null;
	}

	this.create_thumb = function (img) {
		var size = this.properties.px.value;

		if (img.Width < img.Height) {
			var src_x = 0;
			var src_w = img.Width;
			var src_h = img.Width;
			var src_y = Math.round((img.Height - src_h) / 4);
		} else {
			var src_y = 0;
			var src_w = img.Height;
			var src_h = img.Height;
			var src_x = Math.round((img.Width - src_w) / 2);
		}

		var square = utils.CreateImage(size, size);
		var temp_gr = square.GetGraphics();
		temp_gr.DrawImage(img, 0, 0, size, size, src_x, src_y, src_w, src_h);
		square.ReleaseGraphics();
		return square;
	}

	this.create_thumbs = function () {
		_dispose.apply(null, this.thumbs);
		this.thumbs = [];

		_.forEach(this.images, function (image) {
			this.thumbs.push(this.create_thumb(image));
		}, this);
	}

	this.download = function () {
		if (!_tagged(this.artist))
			return;

		var url = 'https://www.last.fm/music/' + encodeURIComponent(this.artist) + '/+images';
		var task_id = utils.HTTPRequestAsync(window.ID, 0, url, this.headers);
		this.artists[task_id] = this.artist;
	}

	this.draw_blurred_image = function (gr) {
		if (!this.images[this.image_index])
			return;

		if (!this.blurred_images[this.image_index]) {
			this.blurred_images[this.image_index] = this.images[this.image_index].Clone();
			this.blurred_images[this.image_index].StackBlur(120);
		}

		gr.Clear(RGB(30, 30, 30));
		_drawImage(gr, this.blurred_images[this.image_index], 0, 0, panel.w, panel.h, image.crop, this.properties.blur_opacity.value);
	}

	this.enable_overlay = function (b) {
		this.overlay = b;
		window.Repaint();
	}

	this.get_defaults = function () {
		var defaults = _jsonParseFile(this.json_file);

		if (_.isArray(defaults))
			return {};

		return defaults;
	}

	this.get_files = function () {
		var files = [];

		if (this.properties.source.value == 0 && _.includes(this.properties.tf.value, CRLF)) {
			var folders = _stringToArray(this.properties.tf.value, CRLF).map(function (item) {
				return panel.tf(item);
			});

			files = _getFiles(folders, this.exts);
		} else {
			files = _getFiles(this.folder, this.exts);
		}

		if (this.properties.source.value == 1 && files.length > 1) {
			this.default_file = this.folder + this.defaults[this.artist];
			var tmp = _.indexOf(files, this.default_file);

			if (tmp > -1) {
				files.splice(tmp, 1);
				files.unshift(this.default_file);
			}
		}

		var count_limit = Math.floor(8192 / this.properties.px.value)
		var size_limit = this.properties.size_limit.value;
		var total_file_size = 0;
		var filtered = files.filter(function (item, i) {
			total_file_size += utils.GetFileSize(item);
			return total_file_size < size_limit && i <= count_limit;
		});

		if (filtered.length < files.length) {
			console.log(N, 'Not all images have been loaded. This is due to excessive total size and/or count.');
		}

		return filtered;
	}

	this.http_request_done = function (task_id, success, response_text) {
		var artist = this.artists[task_id];

		if (!artist)
			return; // we didn't request this id

		if (!success) {
			console.log(N, response_text);
			return;
		}

		var filename_base = _artistFolder(artist) + utils.ReplaceIllegalChars(artist) + '_'

		_(_getElementsByTagName(response_text, 'li'))
			.filter({ className : 'image-list-item-wrapper' })
			.map(function (item) {
				var img = _firstElement(item, 'img');
				var url = img.src.replace('avatar170s/', '');
				return {
					url : url,
					filename : filename_base + url.substring(url.lastIndexOf('/') + 1) + '.jpg',
				};
			})
			.filter(function (item) {
				return !utils.IsFile(item.filename);
			})
			.take(this.properties.limit.value)
			.forEach(function (item) {
				utils.DownloadFileAsync(window.ID, item.url, item.filename, true);
			})
			.value();
	}

	this.image_containsxXY = function (x, y) {
		switch (true) {
		case this.images.length == 0:
		case this.properties.mode.value == 0 && !this.overlay: // grid
		case this.properties.mode.value != 0 && this.containsXY(x, y): // not grid
			return false;
		default:
			return x > this.image_xywh[0] && x < this.image_xywh[0] + this.image_xywh[2] && y > this.image_xywh[1] && y < this.image_xywh[1] + this.image_xywh[3];
		}
	}

	this.interval_func = _.bind(function () {
		this.time++;

		if (this.properties.cycle.value > 0 && this.images.length > 1 && this.time % this.properties.cycle.value == 0) {
			this.image_index++;
			if (this.image_index == this.images.length) {
				this.image_index = 0;
			}
			window.Repaint();
		}

		if (this.properties.source.value == 1 && this.time % 3 == 0 && _getFiles(this.folder, this.exts).length != this.images.length) {
			this.update();
		}
	}, this);

	this.key_down = function (k) {
		switch (k) {
		case VK_ESCAPE:
			if (this.properties.mode.value == 0 && this.overlay) { // grid
				this.enable_overlay(false);
			}
			break;
		case VK_LEFT:
		case VK_UP:
			this.wheel(1);
			break
		case VK_RIGHT:
		case VK_DOWN:
			this.wheel(-1);
			break;
		}
	}

	this.lbtn_dblclk = function (x, y) {
		if (this.image_containsxXY(x, y)) {
			var path = this.images[this.image_index].Path;

			switch (this.properties.double_click_mode.value) {
			case 0:
				utils.Run(path);
				break;
			case 1:
				fb.ShowPictureViewer(path);
				break;
			case 2:
				_explorer(path);
				break;
			}
		}
	}

	this.lbtn_up = function (x, y) {
		switch (true) {
		case !this.containsXY(x, y):
		case this.properties.mode.value == 0 && this.overlay && this.close_btn.lbtn_up(x, y):
			break;
		case this.properties.mode.value == 0 && !this.overlay && this.hover_index < this.images.length:
			this.image_index = this.hover_index;
			this.enable_overlay(true);
			break;
		case this.hover_index < this.images.length:
			if (this.image_index != this.hover_index) {
				this.image_index = this.hover_index;
				window.Repaint();
			}
			break;
		}
	}

	this.metadb_changed = function () {
		if (panel.metadb) {
			if (this.properties.source.value == 0) { // custom folder
				var temp_folder = panel.tf(this.properties.tf.value);

				if (this.folder == temp_folder)
					return;

				this.folder = temp_folder;
			} else { // last.fm
				var temp_artist = panel.tf(DEFAULT_ARTIST);
				if (this.artist == temp_artist)
					return;

				this.artist = temp_artist;
				this.folder = _artistFolder(this.artist);
			}
		} else {
			this.artist = '';
			this.folder = '';
		}

		this.update();
	}

	this.move = function (x, y) {
		this.mx = x;
		this.my = y;
		this.hover_index = this.images.length;

		switch (true) {
		case !this.containsXY(x, y):
			break;
		case this.properties.mode.value == 0: // grid
			if (this.overlay)
				return window.SetCursor(this.close_btn.move(x, y) ? IDC_HAND : IDC_ARROW);

			var tmp = Math.floor(x / this.properties.px.value);

			if (tmp < this.columns) {
				this.hover_index = tmp + ((Math.floor(y / this.properties.px.value) + this.offset) * this.columns);
			}
			break;
		case this.properties.mode.value == 1: // left
		case this.properties.mode.value == 2: // right
			this.hover_index = Math.floor(y / this.properties.px.value) + this.offset;
			break;
		case this.properties.mode.value == 3: // top
		case this.properties.mode.value == 4: // bottom
			this.hover_index = Math.floor(x / this.properties.px.value) + this.offset;
			break;
		}

		window.SetCursor(this.hover_index < this.images.length ? IDC_HAND : IDC_ARROW);
	}

	this.paint = function (gr) {
		if (this.images.length == 0) {
			this.image_xywh = [];
			return;
		}

		var offset_px = this.offset * this.properties.px.value;

		switch (true) {
		case this.properties.mode.value == 5: // off
			if (this.properties.aspect.value == image.centre) {
				this.draw_blurred_image(gr);
				this.image_xywh = _drawImage(gr, this.images[this.image_index], 20, 20, panel.w - 40, panel.h - 40, this.properties.aspect.value, 1.0, RGB(150, 150, 150));
			} else {
				this.image_xywh = _drawImage(gr, this.images[this.image_index], 0, 0, panel.w, panel.h, this.properties.aspect.value);
			}
			break;
		case !this.img:
			break;
		case this.properties.mode.value == 0: // grid
			gr.DrawImage(this.img, this.x, this.y, this.img.Width, Math.min(this.img.Height - offset_px, this.h), 0, offset_px, this.img.Width, Math.min(this.img.Height - offset_px, this.h));

			if (this.overlay) {
				_drawOverlay(gr, this.x, this.y, this.w, this.h);
				this.image_xywh = _drawImage(gr, this.images[this.image_index], 20, 20, panel.w - 40, panel.h - 40, image.centre, 1.0, RGB(150, 150, 150));
				this.close_btn.paint(gr, RGB(230, 230, 230));
			} else {
				this.image_xywh = [];
			}
			break;
		case this.properties.mode.value == 1: // left
			if (this.properties.aspect.value == image.centre) {
				this.draw_blurred_image(gr);
				this.image_xywh = _drawImage(gr, this.images[this.image_index], this.properties.px.value + 20, 20, panel.w - this.properties.px.value - 40, panel.h - 40, this.properties.aspect.value, 1.0, RGB(150, 150, 150));
			} else {
				this.image_xywh = _drawImage(gr, this.images[this.image_index], 0, 0, panel.w, panel.h, this.properties.aspect.value);
			}

			_drawOverlay(gr, this.x, this.y, this.w, this.h);
			gr.DrawImage(this.img, this.x, this.y, this.w, Math.min(this.img.Height - offset_px, this.h), 0, offset_px, this.w, Math.min(this.img.Height - offset_px, this.h));
			break;
		case this.properties.mode.value == 2: // right
			if (this.properties.aspect.value == image.centre) {
				this.draw_blurred_image(gr);
				this.image_xywh = _drawImage(gr, this.images[this.image_index], 20, 20, panel.w - this.properties.px.value - 40, panel.h - 40, this.properties.aspect.value, 1.0, RGB(150, 150, 150));
			} else {
				this.image_xywh = _drawImage(gr, this.images[this.image_index], 0, 0, panel.w, panel.h, this.properties.aspect.value);
			}

			_drawOverlay(gr, this.x, this.y, this.w, this.h);
			gr.DrawImage(this.img, this.x, this.y, this.w, Math.min(this.img.Height - offset_px, this.h), 0, offset_px, this.w, Math.min(this.img.Height - offset_px, this.h));
			break;
		case this.properties.mode.value == 3: // top
			if (this.properties.aspect.value == image.centre) {
				this.draw_blurred_image(gr);
				this.image_xywh = _drawImage(gr, this.images[this.image_index], 20, this.properties.px.value + 20, panel.w - 40, panel.h - this.properties.px.value - 40, this.properties.aspect.value, 1.0, RGB(150, 150, 150));
			} else {
				this.image_xywh = _drawImage(gr, this.images[this.image_index], 0, 0, panel.w, panel.h, this.properties.aspect.value);
			}

			_drawOverlay(gr, this.x, this.y, this.w, this.h);
			gr.DrawImage(this.img, this.x, this.y, Math.min(this.img.Width - offset_px, this.w), this.img.Height, offset_px, 0, Math.min(this.img.Width - offset_px, this.w), this.img.Height);
			break;
		case this.properties.mode.value == 4: // bottom
			if (this.properties.aspect.value == image.centre) {
				this.draw_blurred_image(gr);
				this.image_xywh = _drawImage(gr, this.images[this.image_index], 20, 20, panel.w - 40, panel.h - this.properties.px.value - 40, this.properties.aspect.value, 1.0, RGB(150, 150, 150));
			} else {
				this.image_xywh = _drawImage(gr, this.images[this.image_index], 0, 0, panel.w, panel.h, this.properties.aspect.value);
			}

			_drawOverlay(gr, this.x, this.y, this.w, this.h);
			gr.DrawImage(this.img, this.x, this.y, Math.min(this.img.Width - offset_px, this.w), this.img.Height, offset_px, 0, Math.min(this.img.Width - offset_px, this.w), this.img.Height);
			break;
		}
	}

	this.playback_new_track = function () {
		this.counter = 0;
		panel.item_focus_change();
	}

	this.playback_time = function () {
		this.counter++;

		if (panel.selection.value == 0 && this.properties.source.value == 1 && this.properties.auto_download.enabled && this.counter == 2 && this.images.length == 0 && !this.history[this.artist]) {
			this.history[this.artist] = true;
			this.download();
		}
	}

	this.rbtn_up = function (x, y) {
		panel.m.AppendMenuItem(MF_STRING, 1000, 'Custom folder');
		panel.m.AppendMenuItem(MF_STRING, 1001, 'Last.fm artist art');
		panel.m.CheckMenuRadioItem(1000, 1001, this.properties.source.value + 1000);
		panel.m.AppendMenuSeparator();

		if (this.properties.source.value == 0) { // custom folder
			panel.m.AppendMenuItem(MF_STRING, 1002, 'Set custom folder...');
			panel.m.AppendMenuSeparator();
		} else { // last.fm
			panel.m.AppendMenuItem(EnableMenuIf(panel.metadb), 1003, 'Download now');
			panel.m.AppendMenuItem(CheckMenuIf(this.properties.auto_download.enabled), 1004, 'Automatic downloads');

			this.limits.forEach(function (item) {
				panel.s10.AppendMenuItem(MF_STRING, item + 1010, item);
			});

			panel.s10.CheckMenuRadioItem(_.first(this.limits) + 1010, _.last(this.limits) + 1010, this.properties.limit.value + 1010);
			panel.s10.AppendTo(panel.m, MF_STRING, 'Limit');
			panel.m.AppendMenuSeparator();
		}

		var s = this.properties.max_size.value;
		panel.s14.AppendMenuItem(MF_STRING, 1700, '512px');
		panel.s14.AppendMenuItem(MF_STRING, 1701, '1024px');
		panel.s14.AppendMenuItem(MF_STRING, 1702, 'Leave untouched');
		panel.s14.CheckMenuRadioItem(1700, 1702, s == 512 ? 1700 : s == 1024 ? 1701 : 1702);
		panel.s14.AppendTo(panel.m, MF_STRING, 'Main image maximum size');
		panel.m.AppendMenuSeparator();

		if (panel.text_objects.length == 0 && panel.list_objects.length == 0) {
			this.modes.forEach(function (item, i) {
				panel.s11.AppendMenuItem(MF_STRING, i + 1050, _.capitalize(item));
			});

			panel.s11.CheckMenuRadioItem(1050, 1055, this.properties.mode.value + 1050);
			panel.s11.AppendMenuSeparator();

			var flag = EnableMenuIf(this.properties.mode.value != 5);

			this.pxs.forEach(function (item) {
				panel.s11.AppendMenuItem(flag, item + 1000, item + 'px');
			});

			panel.s11.CheckMenuRadioItem(_.first(this.pxs) + 1000, _.last(this.pxs) + 1000, this.properties.px.value + 1000);
			panel.s11.AppendMenuSeparator();
			panel.s11.AppendMenuItem(GetMenuFlags(this.properties.mode.value != 5, this.properties.circular.enabled), 1399, 'Circular');
			panel.s11.AppendTo(panel.m, MF_STRING, 'Thumbs');
			panel.m.AppendMenuSeparator();
		}

		panel.s12.AppendMenuItem(MF_STRING, 1400, 'Off');
		panel.s12.AppendMenuItem(MF_STRING, 1405, '5 seconds');
		panel.s12.AppendMenuItem(MF_STRING, 1410, '10 seconds');
		panel.s12.AppendMenuItem(MF_STRING, 1420, '20 seconds');
		panel.s12.CheckMenuRadioItem(1400, 1420, this.properties.cycle.value + 1400);
		panel.s12.AppendTo(panel.m, MF_STRING, 'Cycle');
		panel.m.AppendMenuSeparator();

		if (this.image_containsxXY(x, y)) {
			if (this.properties.mode.value != 0) {
				panel.m.AppendMenuItem(MF_STRING, 1500, 'Crop (focus on centre)');
				panel.m.AppendMenuItem(MF_STRING, 1501, 'Crop (focus on top)');
				panel.m.AppendMenuItem(MF_STRING, 1502, 'Centre');
				panel.m.CheckMenuRadioItem(1500, 1502, this.properties.aspect.value + 1500);
				panel.m.AppendMenuSeparator();
			}

			if (this.properties.source.value == 1 && this.images.length > 1) {
				panel.m.AppendMenuItem(EnableMenuIf(this.default_file != this.images[this.image_index].Path), 1520, 'Set as default');
				panel.m.AppendMenuItem(EnableMenuIf(utils.IsFile(this.default_file)), 1521, 'Clear default');
				panel.m.AppendMenuSeparator();
			}

			if (this.image_index < this.images.length) {
				panel.m.AppendMenuItem(MF_STRING, 1530, 'Open image');
				panel.m.AppendMenuItem(MF_STRING, 1531, 'Delete image');
				panel.m.AppendMenuSeparator();
			}

			panel.s13.AppendMenuItem(MF_STRING, 1540, 'Opens image in external viewer');
			panel.s13.AppendMenuItem(MF_STRING, 1541, 'Opens image using fb2k viewer');
			panel.s13.AppendMenuItem(MF_STRING, 1542, 'Opens containing folder');
			panel.s13.CheckMenuRadioItem(1540, 1542, this.properties.double_click_mode.value + 1540);
			panel.s13.AppendTo(panel.m, MF_STRING, 'Double click');
			panel.m.AppendMenuSeparator();
		}

		panel.m.AppendMenuItem(EnableMenuIf(utils.IsFolder(this.folder)), 1550, 'Open containing folder');
		panel.m.AppendMenuSeparator();
	}

	this.rbtn_up_done = function (idx) {
		switch (idx) {
		case 1000:
		case 1001:
			this.properties.source.value = idx - 1000;
			this.artist = '';
			this.folder = '';
			this.metadb_changed();
			break;
		case 1002:
			try {
				this.properties.tf.value = utils.TextBox('Enter title formatting or an absolute path to a folder. You can specify multiple folders by placing each one on their own line.', window.Name, this.properties.tf.value);
				this.folder = '';
				this.metadb_changed();
			} catch (e) {}
			break;
		case 1003:
			this.download();
			break;
		case 1004:
			this.properties.auto_download.toggle();
			break;
		case 1011:
		case 1013:
		case 1015:
		case 1020:
		case 1025:
		case 1030:
			this.properties.limit.value = idx - 1010;
			break;
		case 1050:
		case 1051:
		case 1052:
		case 1053:
		case 1054:
		case 1055:
			this.properties.mode.value = idx - 1050;
			this.create_thumbs();
			this.size(true);
			window.Repaint();
			break;
		case 1075:
		case 1100:
		case 1150:
		case 1200:
		case 1250:
		case 1300:
			this.properties.px.value = idx - 1000;
			this.update();
			window.Repaint();
			break;
		case 1399:
			this.properties.circular.toggle();
			this.size(true);
			window.Repaint();
			break;
		case 1400:
		case 1405:
		case 1410:
		case 1420:
			this.properties.cycle.value = idx - 1400;
			break;
		case 1500:
		case 1501:
		case 1502:
			this.properties.aspect.value = idx - 1500;
			window.Repaint();
			break;
		case 1520:
			this.set_default(this.images[this.image_index].Path.split('\\').pop());
			break;
		case 1521:
			this.set_default(undefined);
			break;
		case 1530:
			utils.Run(this.images[this.image_index].Path);
			break;
		case 1531:
			utils.RemovePath(this.images[this.image_index].Path);
			this.update();
			break;
		case 1540:
		case 1541:
		case 1542:
			this.properties.double_click_mode.value = idx - 1540;
			break;
		case 1550:
			if (this.images.length) {
				_explorer(this.images[this.image_index].Path);
			} else {
				utils.Run(this.folder);
			}
			break;
		case 1600:
		case 1601:
			this.properties.layout.value = idx - 1600;
			on_size();
			window.Repaint();
			break;
		case 1700:
			this.properties.max_size.value = 512;
			this.update();
			break;
		case 1701:
			this.properties.max_size.value = 1024;
			this.update();
			break;
		case 1702:
			this.properties.max_size.value = 0;
			this.update();
			break;
		}
	}

	this.reset = function () {
		this.image_index = 0;
		_dispose.apply(null, this.images);
		_dispose.apply(null, this.blurred_images);
		this.images = [];
		this.blurred_images = [];
	}

	this.set_default = function (val) {
		this.defaults[this.artist] = val;
		_save(this.json_file, JSON.stringify(this.defaults));
		this.update();
	}

	this.size = function (f) {
		this.nc = f || this.nc;
		this.close_btn.x = panel.w - this.close_btn.w;
		this.offset = 0;

		if (panel.w < this.properties.px.value || panel.h < this.properties.px.value || this.properties.mode.value == 5) {
			this.nc = true;

			if (this.img) {
				this.img.Dispose();
				this.img = null;
			}

			this.x = 0;
			this.y = 0;
			this.w = 0;
			this.h = 0;
		} else {
			switch (this.properties.mode.value) {
			case 0: // grid
				this.x = 0;
				this.y = 0;
				this.w = panel.w;
				this.h = panel.h;

				if (!this.nc && this.columns != Math.floor(this.w / this.properties.px.value)) {
					this.nc = true;
				}

				this.rows = Math.ceil(this.h / this.properties.px.value);
				this.columns = Math.floor(this.w / this.properties.px.value);
				this.img_rows = Math.ceil(this.thumbs.length / this.columns);

				if (this.nc && this.thumbs.length) {
					this.nc = false;
					this.create_grid();
				}
				break;
			case 1: // left
			case 2: // right
				this.x = this.properties.mode.value == 1 ? 0 : panel.w - this.properties.px.value;
				this.y = 0;
				this.w = this.properties.px.value;
				this.h = panel.h;
				this.rows = Math.ceil(this.h / this.properties.px.value);

				if (this.nc && this.thumbs.length) {
					this.nc = false;
					this.create_strip(true);
				}
				break;
			case 3: // top
			case 4: // bottom
				this.x = 0;
				this.y = this.properties.mode.value == 3 ? 0 : panel.h - this.properties.px.value;
				this.w = panel.w;
				this.h = this.properties.px.value;
				this.columns = Math.ceil(this.w / this.properties.px.value);

				if (this.nc && this.thumbs.length) {
					this.nc = false;
					this.create_strip(false);
				}

				break;
			}
		}
	}

	this.update = function () {
		this.reset();

		_.forEach(this.get_files(), function (item) {
			var image = utils.LoadImage(item, this.properties.max_size.value);
			if (image) {
				this.images.push(image);
			}
		}, this);

		this.blurred_images = new Array(this.images.length);

		if (this.properties.mode.value != 5) {
			this.create_thumbs();
		}

		this.size(true);
		window.Repaint();
	}

	this.wheel = function (s) {
		if (utils.IsKeyPressed(VK_SHIFT) && this.properties.aspect.value == image.centre) {
			var value = Clamp(this.properties.blur_opacity.value + (s * 0.05), 0.2, 0.8);

			if (value != this.properties.blur_opacity.value) {
				this.properties.blur_opacity.value = value;
				window.Repaint();
			}

			return;
		}

		var offset = this.offset - s;

		switch (true) {
		case !this.containsXY(this.mx, this.my):
		case this.properties.mode.value == 0 && this.overlay: // grid
			if (this.images.length < 2)
				return;

			this.image_index -= s;

			if (this.image_index < 0) {
				this.image_index = this.images.length - 1;
			} else if (this.image_index >= this.images.length) {
				this.image_index = 0;
			}

			window.Repaint();
			return;
		case this.properties.mode.value == 0: // grid
			if (this.img_rows < this.rows)
				return;

			if (offset < 0) {
				offset = 0;
			} else if (offset > this.img_rows - this.rows) {
				offset = this.img_rows - this.rows + 1;
			}

			break;
		case this.properties.mode.value == 1: // left
		case this.properties.mode.value == 2: // right
			if (this.images.length < this.rows)
				return;

			if (offset < 0) {
				offset = 0;
			} else if (offset + this.rows > this.images.length) {
				offset = this.images.length - this.rows + 1;
			}

			break;
		case this.properties.mode.value == 3: // top
		case this.properties.mode.value == 4: // bottom
			if (this.images.length < this.columns)
				return;

			if (offset < 0) {
				offset = 0;
			} else if (offset + this.columns > this.images.length) {
				offset = this.images.length - this.columns + 1;
			}

			break;
		}

		if (this.offset != offset) {
			this.offset = offset;
			window.RepaintRect(this.x, this.y, this.w, this.h);
		}
	}

	this.mx = 0;
	this.my = 0;
	this.images = [];
	this.blurred_images = [];
	this.thumbs = [];
	this.history = {}; // track auto-downloads, attempt same artist only once per session
	this.limits = [1, 3, 5, 10, 15, 20];
	this.modes = ['grid', 'left', 'right', 'top', 'bottom', 'off'];
	this.pxs = [75, 100, 150, 200, 250, 300];
	this.exts = ['webp', 'jpg', 'jpeg', 'png', 'gif', 'heif', 'heic', 'avif', 'jxl'];
	this.json_file = folders.data + 'thumbs.json';
	this.defaults = this.get_defaults();
	this.default_file = '';
	this.folder = '';
	this.artist = '';
	this.artists = {};
	this.properties = {};
	this.img = null;
	this.circular_mask = null;
	this.nc = false;
	this.image_xywh = [];
	this.hover_index = 0;
	this.image_index = 0;
	this.time = 0;
	this.counter = 0;

	this.properties = {
		mode : new Property('2K3.THUMBS.MODE', 4), // 0 grid 1 left 2 right 3 top 4 bottom 5 off
		source : new Property('2K3.THUMBS.SOURCE', 0), // 0 custom folder 1 last.fm
		tf : new Property('2K3.THUMBS.CUSTOM.FOLDER.TF', '$directory_path(%path%)'),
		limit : new Property('2K3.THUMBS.DOWNLOAD.LIMIT', 10),
		px : new Property('2K3.THUMBS.PX', 75),
		cycle : new Property('2K3.THUMBS.CYCLE', 5),
		aspect : new Property('2K3.THUMBS.ASPECT', image.crop_top),
		auto_download : new Property('2K3.THUMBS.AUTO.DOWNLOAD', true),
		circular : new Property('2K3.THUMBS.CIRCULAR', false),
		size_limit : new Property('2K3.THUMBS.SIZE.LIMIT', 64 * 1024 * 1024),
		double_click_mode : new Property('2K3.THUMBS.DOUBLE.CLICK.MODE', 1), // 0 external viewer 1 fb2k viewer 2 explorer
		max_size : new Property('2K3.THUMBS.MAX.SIZE', 1024),
		blur_opacity : new Property('2K3.THUMBS.BLUR.OPACITY', 0.5),
	};

	this.headers = JSON.stringify({
		'User-Agent' : 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0',
		'Referer' : 'https://www.last.fm',
	});

	this.close_btn = new _sb(chars.close, 0, 0, Scale(10), Scale(10), _.bind(function () { return this.properties.mode.value == 0 && this.overlay; }, this), _.bind(function () { this.enable_overlay(false); }, this));
	this.create_mask();
	utils.CreateFolder(folders.artists);
	window.SetInterval(this.interval_func, 1000);
}
