'use strict';

class TextReader {
	constructor (x, y, w, h) {
		panel.text_objects.push(this);
		this.name = 'text_reader';

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

		this.filename = '';
		this.exts = ['txt', 'log'];

		this.properties = {
			title_tf : new Property('2K3.READER.TITLE.TF', '%album artist% - $if2(%album%,%title%)'),
			filename_tf : new Property('2K3.READER.FILENAME.TF', '$directory_path(%path%)'),
			monospace_font : new Property('2K3.READER.FONTS.MONOSPACE', true),
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

	font_changed () {
		this.reset();
		this.refresh();
	}

	header_text () {
		return panel.tf(this.properties.title_tf.value);
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
		if (this.text_layout) {
			gr.WriteTextLayout(this.text_layout, panel.colours.text, this.x, this.y + Scale(12), this.w, this.ha, this.offset);
			this.up_btn.paint(gr, panel.colours.text);
			this.down_btn.paint(gr, panel.colours.text);
		}
	}

	rbtn_up (x, y) {
		panel.m.AppendMenuItem(MF_STRING, 1300, 'Refresh');
		panel.m.AppendMenuSeparator();
		panel.m.AppendMenuItem(MF_STRING, 1301, 'Custom title...');
		panel.m.AppendMenuSeparator();
		panel.m.AppendMenuItem(MF_STRING, 1302, 'Custom path...');
		panel.m.AppendMenuSeparator();
		panel.m.AppendMenuItem(CheckMenuIf(this.properties.monospace_font.enabled), 1303, 'Monospace font');
		panel.m.AppendMenuSeparator();
		panel.m.AppendMenuItem(EnableMenuIf(utils.IsFile(this.filename)), 1999, 'Open containing folder');
		panel.m.AppendMenuSeparator();
	}

	rbtn_up_done (idx) {
		switch (idx) {
		case 1300:
			this.reset();
			this.refresh();
			break;
		case 1301:
			this.properties.title_tf.value = utils.InputBox('You can use full title formatting here.', window.Name, this.properties.title_tf.value);
			window.Repaint();
			break;
		case 1302:
			this.properties.filename_tf.value = utils.InputBox('Use title formatting to specify a path to a text file. eg: $directory_path(%path%)\\info.txt\n\nIf you prefer, you can specify just the path to a folder and the first txt or log file will be used.', window.Name, this.properties.filename_tf.value);
			this.refresh();
			break;
		case 1303:
			this.properties.monospace_font.toggle();
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
			const temp_filename = panel.tf(this.properties.filename_tf.value);

			if (this.filename == temp_filename) {
				window.Repaint(); // title might have changed
				return;
			}

			this.filename = temp_filename;

			if (utils.IsFolder(this.filename)) {
				this.filename = _.first(GetFiles(this.filename, this.exts))
			}

			const str = utils.ReadUTF8(this.filename).replace(/\t/g, '    ');

			if (str != this.text) {
				this.clear_layout()
				this.text = str;

				if (this.text.length) {
					this.text_layout = utils.CreateTextLayout(this.text, this.properties.monospace_font.enabled ? panel.fonts.monospace : panel.fonts.normal);
				}
			}
		} else {
			this.reset();
		}

		this.update();
		window.Repaint();
	}

	reset () {
		this.clear_layout();
		this.text = this.filename = '';
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
