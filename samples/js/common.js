'use strict';

class Button {
	constructor (x, y, w, h, normal, hover, fn, tiptext) {
		this.x = x;
		this.y = y;
		this.w = w;
		this.h = h;
		this.fn = fn;
		this.tiptext = tiptext;
		this.normal = normal;
		this.hover = hover || normal;
		this.current = normal;
		this.font = JSON.stringify({Name:'Segoe Fluent Icons',Size:this.h - Scale(10)});
	}

	paint (gr) {
		gr.WriteTextSimple(this.current.char, this.font, this.current.colour, this.x, this.y, this.w, this.h, 2, 2);
	}

	containsXY (x, y) {
		return x > this.x && x < this.x + this.w && y > this.y && y < this.y + this.h;
	}

	lbtn_up (x, y, mask) {
		if (this.fn) {
			this.fn(x, y, mask);
		}
	}

	cs (s) {
		if (s == 'hover') {
			this.current = this.hover;
			TT(this.tiptext);
		} else {
			this.current = this.normal;
		}

		window.RepaintRect(this.x, this.y, this.w, this.h);
	}
}

class Buttons {
	buttons = {};
	btn = null;

	paint (gr) {
		_.invokeMap(this.buttons, 'paint', gr);
	}

	move (x, y) {
		let temp_btn = null;
		_.forEach(this.buttons, (item, i) => {
			if (item.containsXY(x, y)) {
				temp_btn = i;
			}
		});

		if (this.btn == temp_btn) {
			return this.btn;
		}

		if (this.btn) {
			this.buttons[this.btn].cs('normal');
		}

		if (temp_btn) {
			this.buttons[temp_btn].cs('hover');
		} else {
			TT('');
		}

		this.btn = temp_btn;
		return this.btn;
	}

	leave () {
		if (this.btn) {
			TT('');
			this.buttons[this.btn].cs('normal');
		}

		this.btn = null;
	}

	lbtn_up (x, y, mask) {
		if (this.btn) {
			this.buttons[this.btn].lbtn_up(x, y, mask);
			return true;
		}

		return false;
	}

	change_font (name) {
		_.forEach(this.buttons, (item) => {
			item.font = JSON.stringify({Name:name,Size:item.h - Scale(10)});
		});
	}
}

class MainMenuHelper {
	constructor (name, base_id, main_menu) {
		this.popup = window.CreatePopupMenu();
		this.mm = fb.CreateMainMenuManager(name);
		this.mm.BuildMenu(this.popup, base_id);
		this.popup.AppendTo(main_menu, MF_STRING, name);
	}
}

class SimpleButton {
	constructor (ch, x, y, w, h, v, fn) {
		this.ch = ch;
		this.x = x;
		this.y = y;
		this.w = w;
		this.h = h;
		this.v = v;
		this.fn = fn;
		this.font = JSON.stringify({Name:'Segoe Fluent Icons',Size:h});
	}

	paint (gr, colour) {
		if (this.v()) {
			gr.WriteTextSimple(this.ch, this.font, colour, this.x, this.y, this.w, this.h, 2, 2);
		}
	}

	containsXY (x, y) {
		return x > this.x && x < this.x + this.w && y > this.y && y < this.y + this.h && this.v();
	}

	move (x, y) {
		if (!this.containsXY(x, y))
			return false;

		window.SetCursor(IDC_HAND);
		return true;
	}

	lbtn_up (x, y) {
		if (!this.containsXY(x, y))
			return false;

		if (this.fn) {
			this.fn(x, y);
		}

		return true;
	}
}

const ArtistFolder = (artist) => {
	const folder = Paths.artists + utils.ReplaceIllegalChars(artist, true);
	utils.CreateFolder(folder);
	return folder + '\\';
}

const DrawImageOrBitmap = (gr, img, dst_x, dst_y, dst_w, dst_h, src_x, src_y, src_w, src_h, opacity) => {
	if (typeof img.Path == 'string') {
		gr.DrawImage(img, dst_x, dst_y, dst_w, dst_h, src_x, src_y, src_w, src_h, opacity);
	} else {
		gr.DrawBitmap(img, dst_x, dst_y, dst_w, dst_h, src_x, src_y, src_w, src_h, opacity);
	}
}

const DrawImage = (gr, img, dst_x, dst_y, dst_w, dst_h, mode, opacity, border) => {
	if (!img)
		return [];

	let src_x ;
	let src_w;
	let src_h;
	let src_y;

	switch (true) {
	case (dst_w == dst_h && img.Width == img.Height) || (dst_w == img.Width && dst_h == img.Height):
		DrawImageOrBitmap(gr, img, dst_x, dst_y, dst_w, dst_h, 0, 0, img.Width, img.Height, opacity || 1);
		break;
	case mode == image.crop:
	case mode == image.crop_top:
		if (img.Width / img.Height < dst_w / dst_h) {
			src_x = 0;
			src_w = img.Width;
			src_h = Math.round(dst_h * img.Width / dst_w);
			src_y = Math.round((img.Height - src_h) / (mode == image.crop_top ? 4 : 2));
		} else {
			src_y = 0;
			src_w = Math.round(dst_w * img.Height / dst_h);
			src_h = img.Height;
			src_x = Math.round((img.Width - src_w) / 2);
		}

		DrawImageOrBitmap(gr, img, dst_x, dst_y, dst_w, dst_h, src_x + 3, src_y + 3, src_w - 6, src_h - 6, opacity || 1);
		break;
	case mode == image.centre:
	case mode == image.top_align:
	default:
		const s = Math.min(dst_w / img.Width, dst_h / img.Height);
		const w = Math.floor(img.Width * s);
		const h = Math.floor(img.Height * s);
		dst_x += Math.round((dst_w - w) / 2);
		dst_y = mode == image.top_align ? dst_y : dst_y + Math.round((dst_h - h) / 2);
		dst_w = w;
		dst_h = h;

		DrawImageOrBitmap(gr, img, dst_x, dst_y, dst_w, dst_h, 0, 0, img.Width, img.Height, opacity || 1);
		break;
	}

	if (border) {
		DrawRectangle(gr, dst_x, dst_y, dst_w, dst_h, border);
	}

	return [dst_x, dst_y, dst_w, dst_h];
}

const DrawOverlay = (gr, x, y, w, h, alpha) => {
	gr.FillRectangle(x, y, w, h, RGBA(0, 0, 0, alpha || 230));
}

const Explorer = (file) => {
	if (utils.IsFile(file)) {
		utils.Run('explorer', '/select,' + Q(file));
	}
}

const FileExpired = (file, period) => {
	return utils.Now() - utils.GetLastModified(file) > period;
}

const FormatNumber = (number, separator) => {
	return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, separator);
}

const GetExt = (path) => {
	return path.split('.').pop().toLowerCase();
}

const GetFiles = (folder, exts) => {
	const folders = Array.isArray(folder) ? folder : [folder];
	const files = folders.flatMap(item => utils.ListFiles(item));

	if (exts.length)
		return files.filter(file => exts.some(ext => file.endsWith(ext)));
	else
		return files;
};

const Help = (x, y, flags) => {
	let menu = window.CreatePopupMenu();

	_.forEach(HaLinks, (item, i) => {
		menu.AppendMenuItem(MF_STRING, i + 100, item[0]);

		if (i == 1) {
			menu.AppendMenuSeparator();
		}
	});

	menu.AppendMenuSeparator();
	menu.AppendMenuItem(MF_STRING, 1, 'Configure...');

	const idx = menu.TrackPopupMenu(x, y, flags);

	switch (idx) {
	case 0:
		break;
	case 1:
		window.ShowConfigure();
		break;
	default:
		utils.Run(HaLinks[idx - 100][1]);
		break;
	}

	return true;
}

const IsUUID = (value) => {
	const re = /^[0-9a-f]{8}-[0-9a-f]{4}-[345][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
	return re.test(value);
}

const JsonParse = (value) => {
	try {
		return JSON.parse(value);
	} catch (e) {
		return [];
	}
}

const JsonParseFile = (file) => {
	return JsonParse(utils.ReadUTF8(file));
}

const Menu = (x, y, flags) => {
	let menu = window.CreatePopupMenu();
	let file = new MainMenuHelper('File', 10000, menu);
	let edit = new MainMenuHelper('Edit', 20000, menu);
	let view = new MainMenuHelper('View', 30000, menu);
	let playback = new MainMenuHelper('Playback', 40000, menu);
	let library = new MainMenuHelper('Library', 50000, menu);
	let help = new MainMenuHelper('Help', 60000, menu);

	const idx = menu.TrackPopupMenu(x, y, flags);

	switch (true) {
	case idx == 0:
		break;
	case idx < 20000:
		file.mm.ExecuteByID(idx - 10000);
		break;
	case idx < 30000:
		edit.mm.ExecuteByID(idx - 20000);
		break;
	case idx < 40000:
		view.mm.ExecuteByID(idx - 30000);
		break;
	case idx < 50000:
		playback.mm.ExecuteByID(idx - 40000);
		break;
	case idx < 60000:
		library.mm.ExecuteByID(idx - 50000);
		break;
	case idx < 70000:
		help.mm.ExecuteByID(idx - 60000);
		break;
	}
}

const Q = (value) => {
	return '"' + value + '"';
}

const Save = (file, value) => {
	if (utils.WriteTextFile(file, value))
		return true;

	console.log(N, 'Error saving to ' + file);
	return false;
}

const StringToArray = (str, sep) => {
	if (typeof str != 'string' || typeof sep != 'string')
		return [];

	return str.split(sep).map((item) => { return item.trim(); }).filter((item) => { return !item.empty(); });
}

const StripTags = (str) => {
	return str.replace(/<br>/gi, "\n").replace(/<p.*>/gi, "\n").replace(/<(?:.|\s)*?>/g, "");
}

const Tagged = (value) => {
	return value != '' && value != '?';
}

const TT = (value) => {
	if (tooltip.Text != value) {
		tooltip.Text = value;
		tooltip.Activate();
	}
}

const CRLF = '\r\n';
const ONE_DAY = 86400;
const DEFAULT_ARTIST = '$meta(artist,0)';
const N = window.Name + ':';
const LM = Scale(5);
const TM = Scale(22);

const tooltip = window.CreateTooltip('Segoe UI', Scale(12));
tooltip.SetMaxWidth(800);

const image = {
	crop : 0,
	crop_top : 1,
	centre : 2,
	top_align : 3,
};

const HaLinks = [
	['Title Formatting Reference', 'https://wiki.hydrogenaud.io/index.php?title=Foobar2000:Title_Formatting_Reference'],
	['Query Syntax', 'https://wiki.hydrogenaud.io/index.php?title=Foobar2000:Query_syntax'],
	['Homepage', 'https://www.foobar2000.org/'],
	['Components', 'https://www.foobar2000.org/components'],
	['Wiki', 'https://wiki.hydrogenaud.io/index.php?title=Foobar2000:Foobar2000'],
	['Forums', 'https://hydrogenaud.io/index.php/board,28.0.html']
];
