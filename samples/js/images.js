'use strict';

class Images {
	constructor() {
		this.x = 0;
		this.y = 0;
		this.w = 0;
		this.h = 0;
		this.mx = 0;
		this.my = 0;
		this.image_paths = [];
		this.history = {}; // track auto-downloads, attempt same artist only once per session
		this.limits = [1, 3, 5, 10, 15, 20];
		this.modes = ['grid', 'left', 'right', 'top', 'bottom', 'off'];
		this.exts = ['webp', 'jpg', 'jpeg', 'png', 'gif', 'heif', 'heic', 'avif', 'jxl'];
		this.folder = '';
		this.artist = '';
		this.artists = {};
		this.properties = {};
		this.image_index = 0;
		this.time = 0;
		this.counter = 0;
		this.is_bio_panel = panel.text_objects.length == 1 && panel.text_objects[0].name == 'lastfm_bio';

		this.bitmap = {
			normal : null,
			blur : null,
		};

		this.properties = {
			source : new Property('2K3.IMAGES.SOURCE', 0), // 0 custom folder 1 last.fm
			tf : new Property('2K3.IMAGES.CUSTOM.FOLDER.TF', '$directory_path(%path%)'),
			cycle : new Property('2K3.IMAGES.CYCLE', 5),
			aspect : new Property('2K3.IMAGES.ASPECT', image.centre),
			limit : new Property('2K3.IMAGES.DOWNLOAD.LIMIT', 10),
			auto_download : new Property('2K3.IMAGES.AUTO.DOWNLOAD', true),
			double_click_mode : new Property('2K3.IMAGES.DOUBLE.CLICK.MODE', 1), // 0 external viewer 1 fb2k viewer 2 explorer
		};

		if (this.is_bio_panel) {
			this.properties.source.value = 1;
			this.properties.layout = new Property('2K3.IMAGES.LAYOUT', 0); // 0 horizontal, 1 vertical
			this.properties.ratio = new Property('2K3.IMAGES.RATIO', 0.5);
			this.properties.blur_opacity = new Property('2K3.BIO.BLUR.OPACITY', 1);
		} else {
			this.properties.blur_opacity = new Property('2K3.IMAGES.BLUR.OPACITY', 0.5);
		}

		this.headers = JSON.stringify({
			'User-Agent' : 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:144.0) Gecko/20100101 Firefox/144.0',
			'Referer' : 'https://www.last.fm',
		});

		utils.CreateFolder(Paths.artists);
		window.SetInterval(() => {
			this.interval_func();
		}, 1000);
	}

	containsXY (x, y) {
		return x > this.x && x < this.x + this.w && y > this.y && y < this.y + this.h;
	}

	draw_blurred_image (gr) {
		gr.Clear(RGB(30, 30, 30));
		DrawImage(gr, this.bitmap.blur, 0, 0, panel.w, panel.h, image.crop, this.properties.blur_opacity.value);
	}

	download () {
		if (!Tagged(this.artist))
			return;

		const url = 'https://www.last.fm/music/' + encodeURIComponent(this.artist) + '/+images';
		const task_id = utils.HTTPRequestAsync(GET, url, this.headers);
		this.artists[task_id] = this.artist;
	}

	http_request_done (task_id, success, response_text, status, response_headers) {
		const artist = this.artists[task_id];

		if (!artist)
			return; // we didn't request this id

		if (!success || status != 200) {
			console.log(N, "HTTP status:", status);
			console.log(response_text);
			return;
		}

		const filename_base = ArtistFolder(artist) + utils.ReplaceIllegalChars(artist) + '_';
		lastfm.download_images(response_text, filename_base, this.properties.limit.value);
	}

	interval_func () {
		this.time++;

		if (this.properties.cycle.value > 0 && this.image_paths.length > 1 && this.time % this.properties.cycle.value == 0) {
			this.image_index++;

			if (this.image_index == this.image_paths.length) {
				this.image_index = 0;
			}

			this.update_image();
			window.Repaint();
		}

		if (this.properties.source.value == 1 && this.time % 3 == 0 && GetFiles(this.folder, this.exts).length != this.image_paths.length) {
			this.update();
		}
	};

	key_down (k) {
		switch (k) {
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

	lbtn_dblclk (x, y) {
		if (this.containsXY(x, y)) {
			const path = this.image_paths[this.image_index];
			switch (this.properties.double_click_mode.value) {
			case 0:
				utils.Run(path);
				break;
			case 1:
				fb.ShowPictureViewer(path);
				break;
			case 2:
				Explorer(path);
				break;
			}
		}
	}

	move (x, y) {
		this.mx = x;
		this.my = y;
		return this.containsXY(x, y);
	}

	paint (gr) {
		if (this.is_bio_panel) {
			if (this.bitmap.normal) {
				this.draw_blurred_image(gr);
				DrawOverlay(gr, 0, 0, panel.w, panel.h, 180);
				DrawImage(gr, this.bitmap.normal, this.x, this.y, this.w, this.h, image.top_align, 1.0, RGB(150, 150, 150));
			} else {
				DrawOverlay(gr, 0, 0, panel.w, panel.h);
			}
		} else if (this.bitmap.normal) {
			if (this.properties.aspect.value == image.centre) {
				this.draw_blurred_image(gr);
				DrawImage(gr, this.bitmap.normal, this.x + 20, this.y + 20, this.w - 40, this.h - 40, this.properties.aspect.value, 1.0, RGB(150, 150, 150));
			} else {
				DrawImage(gr, this.bitmap.normal, this.x, this.y, this.w, this.h, this.properties.aspect.value);
			}
		}
	}

	playback_new_track () {
		this.counter = 0;
		this.refresh();
	}

	playback_time () {
		this.counter++;

		if (panel.selection.value == 0 && this.properties.source.value == 1 && this.properties.auto_download.enabled && this.counter == 2 && this.image_paths.length == 0 && !this.history[this.artist]) {
			this.history[this.artist] = true;
			this.download();
		}
	}

	rbtn_up (x, y) {
		if (!this.containsXY(x, y))
			return;

		if (this.is_bio_panel) {
			panel.m.AppendMenuItem(MF_STRING, 1600, 'Image left, Text right');
			panel.m.AppendMenuItem(MF_STRING, 1601, 'Image top, Text bottom');
			panel.m.CheckMenuRadioItem(1600, 1601, this.properties.layout.value + 1600);
			panel.m.AppendMenuSeparator();
		} else {
			panel.m.AppendMenuItem(MF_STRING, 1000, 'Custom folder');
			panel.m.AppendMenuItem(MF_STRING, 1001, 'Last.fm artist art');
			panel.m.CheckMenuRadioItem(1000, 1001, this.properties.source.value + 1000);
			panel.m.AppendMenuSeparator();
		}

		if (this.properties.source.value == 0) { // custom folder
			panel.m.AppendMenuItem(MF_STRING, 1002, 'Set custom folder...');
			panel.m.AppendMenuSeparator();
		} else { // last.fm
			panel.m.AppendMenuItem(EnableMenuIf(panel.metadb), 1003, 'Download now');
			panel.m.AppendMenuItem(CheckMenuIf(this.properties.auto_download.enabled), 1004, 'Automatic downloads');
			this.limits.forEach((item) => {
				panel.s10.AppendMenuItem(MF_STRING, item + 1010, item);
			});
			panel.s10.CheckMenuRadioItem(_.first(this.limits) + 1010, _.last(this.limits) + 1010, this.properties.limit.value + 1010);
			panel.s10.AppendTo(panel.m, MF_STRING, 'Limit');
			panel.m.AppendMenuSeparator();
		}

		panel.s12.AppendMenuItem(MF_STRING, 1400, 'Off');
		panel.s12.AppendMenuItem(MF_STRING, 1405, '5 seconds');
		panel.s12.AppendMenuItem(MF_STRING, 1410, '10 seconds');
		panel.s12.AppendMenuItem(MF_STRING, 1420, '20 seconds');
		panel.s12.AppendMenuItem(MF_STRING, 1430, '30 seconds');
		panel.s12.AppendMenuItem(MF_STRING, 1460, '60 seconds');
		panel.s12.CheckMenuRadioItem(1400, 1460, this.properties.cycle.value + 1400);
		panel.s12.AppendTo(panel.m, MF_STRING, 'Cycle');
		panel.m.AppendMenuSeparator();

		if (!this.is_bio_panel) {
			panel.m.AppendMenuItem(MF_STRING, 1500, 'Crop (focus on centre)');
			panel.m.AppendMenuItem(MF_STRING, 1501, 'Crop (focus on top)');
			panel.m.AppendMenuItem(MF_STRING, 1502, 'Centre');
			panel.m.CheckMenuRadioItem(1500, 1502, this.properties.aspect.value + 1500);
			panel.m.AppendMenuSeparator();
		}

		if (this.image_index < this.image_paths.length) {
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

		panel.m.AppendMenuItem(EnableMenuIf(utils.IsFolder(this.folder)), 1550, 'Open containing folder');
		panel.m.AppendMenuSeparator();
	}

	rbtn_up_done (idx) {
		switch (idx) {
		case 1000:
		case 1001:
			this.properties.source.value = idx - 1000;
			this.artist = '';
			this.folder = '';
			this.refresh();
			break;
		case 1002:
			try {
				this.properties.tf.value = utils.TextBox('Enter title formatting or an absolute path to a folder. You can specify multiple folders by placing each one on their own line.', window.Name, this.properties.tf.value);
				this.folder = '';
				this.refresh();
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
		case 1400:
		case 1405:
		case 1410:
		case 1420:
		case 1430:
		case 1460:
			this.properties.cycle.value = idx - 1400;
			break;
		case 1500:
		case 1501:
		case 1502:
			this.properties.aspect.value = idx - 1500;
			window.Repaint();
			break;
		case 1530:
			utils.Run(this.image_paths[this.image_index]);
			break;
		case 1531:
			utils.RemovePath(this.image_paths[this.image_index]);
			this.update();
			break;
		case 1540:
		case 1541:
		case 1542:
			this.properties.double_click_mode.value = idx - 1540;
			break;
		case 1550:
			if (this.image_paths.length) {
				Explorer(this.image_paths[this.image_index]);
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
		}
	}

	refresh () {
		if (panel.metadb) {
			if (this.properties.source.value == 0) { // custom folder
				const temp_folder = panel.tf(this.properties.tf.value);
				if (this.folder == temp_folder) {
					return;
				}
				this.folder = temp_folder;
			} else { // last.fm
				const temp_artist = panel.tf(DEFAULT_ARTIST);
				if (this.artist == temp_artist) {
					return;
				}
				this.artist = temp_artist;
				this.folder = ArtistFolder(this.artist);
			}
		} else {
			this.artist = '';
			this.folder = '';
		}

		this.update();
	}

	reset_image () {
		if (this.bitmap.normal) {
			this.bitmap.normal = null;
		}

		if (this.bitmap.blur) {
			this.bitmap.blur = null;
		}
	}

	update () {
		this.update_image_paths();
		this.update_image();
		window.Repaint();
	}

	update_image () {
		this.reset_image();

		if (this.image_index < this.image_paths.length) {
			let img = utils.LoadImage(this.image_paths[this.image_index]);

			if (img) {
				this.bitmap.normal = img.CreateBitmap();
				img.StackBlur(120);
				this.bitmap.blur = img.CreateBitmap();
			}
		}
	}

	update_image_paths () {
		this.image_index = 0;
		this.image_paths = [];

		if (this.properties.source.value == 0 && _.includes(this.properties.tf.value, CRLF)) {
			const folders = StringToArray(this.properties.tf.value, CRLF).map((item) => {
				return panel.tf(item);
			});

			this.image_paths = GetFiles(folders, this.exts);
		} else {
			this.image_paths = GetFiles(this.folder, this.exts);
		}
	}

	wheel (s) {
		if (!this.is_bio_panel && utils.IsKeyPressed(VK_SHIFT) && this.properties.aspect.value == image.centre) {
			const value = Clamp(this.properties.blur_opacity.value + (s * 0.05), 0.2, 0.8);

			if (value != this.properties.blur_opacity.value) {
				this.properties.blur_opacity.value = value;
				window.Repaint();
			}

			return true;
		}

		if (!this.containsXY(this.mx, this.my))
			return false;

		if (this.image_paths.length > 1) {
			this.image_index -= s;

			if (this.image_index < 0) {
				this.image_index = this.image_paths.length - 1;
			} else if (this.image_index >= this.image_paths.length) {
				this.image_index = 0;
			}

			this.update_image();
			window.Repaint();
		}

		return true;
	}
}
