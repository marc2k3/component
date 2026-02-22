'use strict';

class Console {
	constructor (x, y, w, h) {
		panel.text_objects.push(this);

		this.x = x;
		this.y = y;
		this.w = w;
		this.h = h;

		this.name = 'console';
		this.ha = 0;
		this.text_height = 0;
		this.mx = 0;
		this.my = 0;
		this.offset = 0;
		this.text_layout = null;
		this.text = '';
		this.font_string = '';
		this.colour_string = '';

		this.properties = {
			timestamp : new Property('2K3.CONSOLE.TIMESTAMP', true)
		};

		this.up_btn = new SimpleButton(chars.up, this.x, this.y, Scale(12), Scale(12), () => { return this.offset < 0; }, () => { this.wheel(1); });
		this.down_btn = new SimpleButton(chars.down, this.x, this.y, Scale(12), Scale(12), () => { return this.offset > this.ha - this.text_height; }, () => { this.wheel(-1); });

		this.update_font();
	}

	clear_layout () {
		if (this.text_layout) {
			this.text_layout = null;
		}
	}

	console_refresh () {
		this.clear_layout();
		this.colour_string = '';
		let lines = _(console.GetLines(this.properties.timestamp.enabled))
			.takeRight(100)
			.value();

		if (lines.length > 0) {
			let str = lines.join(CRLF);

			// apply highlight colour to timestamp if available
			if (this.properties.timestamp.enabled && panel.colours.text != panel.colours.highlight) {
				let colours = [];
				colours.push({
					'Start' : 0,
					'Length' : str.length,
					'Colour' : panel.colours.text,
				});

				let start = 0;

				for (let i = 0; i < lines.length; i++) {
					colours.push({
						'Start' : start,
						'Length' : 23,
						'Colour' : panel.colours.highlight,
					});

					start += lines[i].length + CRLF.length;
				}

				this.colour_string = JSON.stringify(colours);
			}

			this.text_layout = utils.CreateTextLayout(str, this.font_string);
		}

		this.update();
	}

	containsXY (x, y) {
		return x > this.x && x < this.x + this.w && y > this.y && y < this.y + this.h;
	}

	font_changed () {
		this.update_font();
		this.console_refresh();
		window.Repaint();
	}

	update_font () {
		const name = JSON.parse(window.GetUIFont(FontType.console)).Name;
		this.font_string = CreateFontString(name, panel.fonts.size.value);
	}

	header_text () {
		return 'Console';
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
			gr.WriteTextLayout(this.text_layout, this.colour_string || panel.colours.text, this.x, this.y + Scale(12), this.w, this.ha, this.offset);
			this.up_btn.paint(gr, panel.colours.text);
			this.down_btn.paint(gr, panel.colours.text);
		}
	}

	rbtn_up (x, y) {
		panel.m.AppendMenuItem(MF_STRING, 1010, 'Clear');
		panel.m.AppendMenuSeparator();
		panel.m.AppendMenuItem(CheckMenuIf(this.properties.timestamp.enabled), 1011, 'Show timestamp');
		panel.m.AppendMenuSeparator();
	}

	rbtn_up_done (idx) {
		switch (idx) {
		case 1010:
			console.ClearBacklog();
			break;
		case 1011:
			this.properties.timestamp.toggle();
			this.console_refresh();
			window.Repaint();
			break;
		}
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
		else
			this.offset = -(this.text_height - this.ha);
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
