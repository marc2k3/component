'use strict';

class ListBase {
	constructor (x, y, w, h) {
		panel.list_objects.push(this);
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

		this.up_btn = new SimpleButton(chars.up, this.x, this.y, Scale(12), Scale(12), () => { return this.offset > 0; }, () => { this.wheel(1); });
		this.down_btn = new SimpleButton(chars.down, this.x, this.y, Scale(12), Scale(12), () => { return this.offset < this.count - this.rows; }, () => { this.wheel(-1); });
	}

	containsXY (x, y) {
		return x > this.x && x < this.x + this.w && y > this.y && y < this.y + this.h;
	}

	font_changed () {
		this.size();
		this.update();
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

	size () {
		this.index = 0;
		this.offset = 0;
		this.rows = Math.floor((this.h - Scale(24)) / panel.row_height);
		this.up_btn.x = this.x + Math.round((this.w - Scale(12)) * 0.5);
		this.down_btn.x = this.up_btn.x;
		this.up_btn.y = this.y;
		this.down_btn.y = this.y + this.h - Scale(12);
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
