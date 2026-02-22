'use strict';

class Volume {
	constructor (x, y, w, h) {
		this.x = x;
		this.y = y;
		this.w = w;
		this.h = h;
		this.mx = 0;
		this.my = 0;
		this.hover = false;
		this.drag = false;
		this.drag_vol = 0;
	}

	containsXY (x, y) {
		const m = this.drag ? 200 : 0;
		return x > this.x - m && x < this.x + this.w + (m * 2) && y > this.y - m && y < this.y + this.h + (m * 2);
	}

	lbtn_down (x, y) {
		if (!this.containsXY(x, y))
			return false;

		this.drag = true;
		return true;
	}

	lbtn_up (x, y) {
		if (!this.containsXY(x, y))
			return false;

		if (this.drag) {
			this.drag = false;
			playback.Volume = this.drag_vol;
		}

		return true;
	}

	move (x, y) {
		this.mx = x;
		this.my = y;

		if (this.containsXY(x, y)) {
			if (playback.CustomVolume == -1) {
				x -= this.x;
				const pos = x < 0 ? 0 : x > this.w ? 1 : x / this.w;
				this.drag_vol = pos2vol(pos);
				TT(this.drag_vol.toFixed(2) + ' dB');
				if (this.drag) {
					playback.Volume = this.drag_vol;
				}
			} else {
				TT('The current output device does not support a volume slider');
			}

			this.hover = true;
			return true;
		}

		if (this.hover) {
			TT('');
		}

		this.hover = false;
		this.drag = false;
		return false;
	}

	pos () {
		return this.w * vol2pos(playback.Volume);
	}

	volume_change () {
		window.RepaintRect(this.x, this.y, this.w, this.h);
	}

	wheel (s) {
		if (!this.containsXY(this.mx, this.my))
			return false;

		if (s == 1) {
			playback.VolumeUp();
		} else {
			playback.VolumeDown();
		}

		return true;
	}
}
