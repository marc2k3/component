'use strict';

class Seekbar {
	constructor (x, y, w, h) {
		this.x = x;
		this.y = y;
		this.w = w;
		this.h = h;
		this.mx = 0;
		this.my = 0;
		this.hover = false;
		this.drag = false;
		this.drag_seek = 0;

		window.SetInterval(() => {
			this.interval_func()
		}, 150);
	}

	containsXY (x, y) {
		const m = this.drag ? 200 : 0;
		return x > this.x - m && x < this.x + this.w + (m * 2) && y > this.y - m && y < this.y + this.h + (m * 2);
	}

	interval_func = () => {
		if (playback.Length > 0 && !playback.IsPaused) {
			this.repaint_rect();
		}
	};

	lbtn_down (x, y) {
		if (!this.containsXY(x, y))
			return false;

		if (playback.IsPlaying && playback.Length > 0) {
			this.drag = true;
		}

		return true;
	}

	lbtn_up (x, y) {
		if (!this.containsXY(x, y))
			return false;

		if (this.drag) {
			this.drag = false;
			playback.Time = playback.Length * this.drag_seek;
		}

		return true;
	}

	move (x, y) {
		this.mx = x;
		this.my = y;

		if (this.containsXY(x, y)) {
			if (playback.IsPlaying && playback.Length > 0) {
				x -= this.x;
				this.drag_seek = x < 0 ? 0 : x > this.w ? 1 : x / this.w;
				TT(utils.FormatDuration(playback.Length * this.drag_seek));
				if (this.drag) {
					this.playback_seek();
				}
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

	playback_seek () {
		this.repaint_rect();
	}

	playback_stop (reason) {
		this.playback_seek();
	}

	wheel (s) {
		if (!this.containsXY(this.mx, this.my))
			return false;

		switch (true) {
		case !playback.IsPlaying:
		case playback.Length <= 0:
			break;
		case playback.Length < 60:
			playback.Time += s * 5;
			break;
		case playback.Length < 600:
			playback.Time += s * 10;
			break;
		default:
			playback.Time += s * 60;
			break;
		}

		TT('');
		return true;
	}

	pos () {
		return Math.ceil(this.w * (this.drag ? this.drag_seek : playback.Time / playback.Length));
	}

	repaint_rect () {
		window.RepaintRect(this.x - Scale(75), this.y - Scale(10), this.w + Scale(150), this.h + Scale(20));
	}
}
