function on_colours_changed() {
	get_colours();

	brw.scrollbar.setNewColours();
	brw.repaint();
}

function on_font_changed() {
	get_font();
	get_metrics();
	brw.repaint();
}

function on_get_album_art_done(metadb, art_id, image) {
	if (!image)
		return;

	for (var i = 0; i < brw.groups.length; i++) {
		if (brw.groups[i].metadb && brw.groups[i].metadb.Compare(metadb)) {
			var cached_filename = generate_filename(brw.groups[i].cachekey, art_id);
			image.SaveAs(cached_filename);
			images.cache[cached_filename] = image;
			brw.groups[i].cover_image = image;
			brw.repaint();
			break;
		}
	}
}

function on_size() {
	ww = window.Width;
	wh = window.Height;
	brw.setSize();
}

function draw_header_bar(gr, text, x, y, w, h) {
	if (!ppt.showHeaderBar)
		return;

	gr.FillRectangle(0, 0, ww, y - 1, g_colour_background);
	gr.FillRectangle(x, 0, w + cScrollBar.width, ppt.headerBarHeight - 1, g_colour_background & 0x20ffffff);
	gr.FillRectangle(x, ppt.headerBarHeight - 2, w + cScrollBar.width, 1, g_colour_text & 0x22ffffff);
	gr.WriteTextSimple(text, g_font_box, g_colour_text, 0, 0, ww - 5, ppt.headerBarHeight - 1, 1, 2, 1, 1);
}

function update_extra_font_size(step) {
	var tmp = Clamp(ppt.extra_font_size + step, 0, 10);

	if (ppt.extra_font_size != tmp) {
		ppt.extra_font_size = tmp;
		window.SetProperty("SMOOTH.EXTRA.FONT.SIZE", ppt.extra_font_size);
		get_font();
		get_metrics();
		get_images();
		brw.repaint();
	}
}

function get_images() {
	var gb;
	var cover_size = 200;
	var button_size = scale(24);

	var background = setAlpha(g_colour_text, 10);
	var text_colour = setAlpha(g_colour_text, 150);

	var image_font = JSON.stringify({"Name":"Segoe UI","Size":40,"Weight":700})

	images.noart = utils.CreateImage(cover_size, cover_size);
	gb = images.noart.GetGraphics();
	gb.FillRectangle(0, 0, cover_size, cover_size, background);
	gb.WriteTextSimple("NO\nCOVER", image_font, text_colour, 1, 1, cover_size, cover_size, 2, 2);
	images.noart.ReleaseGraphics();

	images.stream = utils.CreateImage(cover_size, cover_size);
	gb = images.stream.GetGraphics();
	gb.FillRectangle(0, 0, cover_size, cover_size, background);
	gb.WriteTextSimple("STREAM", image_font, text_colour, 1, 1, cover_size, cover_size, 2, 2);
	images.stream.ReleaseGraphics();

	images.all = utils.CreateImage(cover_size, cover_size);
	gb = images.all.GetGraphics();
	gb.FillRectangle(0, 0, cover_size, cover_size, background);
	gb.WriteTextSimple("ALL\nITEMS", image_font, text_colour, 1, 1, cover_size, cover_size, 2, 2);
	images.all.ReleaseGraphics();

	images.reset = utils.CreateImage(button_size, button_size);
	gb = images.reset.GetGraphics();
	gb.WriteTextSimple(chars.close, g_font_fluent_12, g_colour_text, 0, 0, button_size, button_size, 2, 2);
	images.reset.ReleaseGraphics();

	// force re-creation of buttons with new colours
	if (typeof brw == 'object') brw.setSize();
}

function validate_indexes(playlist, item) {
	return playlist >= 0 && playlist < plman.PlaylistCount && item >= 0 && item < plman.GetPlaylistItemCount(playlist);
}

function play(playlist, item) {
	if (validate_indexes(playlist, item)) {
		plman.ExecutePlaylistDefaultAction(playlist, item);
	}
}

function generate_filename(cachekey, art_id) {
	var prefix = art_id == 4 ? "artist" : "front";
	return Paths.smooth_cache + prefix + cachekey + ".jpg";
}

function get_art(metadb, cachekey, art_id) {
	var filename = generate_filename(cachekey, art_id);
	var img = images.cache[filename];

	if (img)
		return img;

	img = utils.LoadImage(filename);

	if (img) {
		images.cache[filename] = img;
		return img;
	}

	window.SetTimeout(function () {
		metadb.GetAlbumArtThumbAsync(art_id);
	}, 10);

	return img;
}

function drawImage(gr, img, dst_x, dst_y, dst_w, dst_h, auto_fill, border, opacity) {
	if (!img || !dst_w || !dst_h)
		return;

	if (auto_fill) {
		if (img.Width / img.Height < dst_w / dst_h) {
			var src_x = 0;
			var src_w = img.Width;
			var src_h = Math.round(dst_h * img.Width / dst_w);
			var src_y = Math.round((img.Height - src_h) / 2);
		} else {
			var src_y = 0;
			var src_w = Math.round(dst_w * img.Height / dst_h);
			var src_h = img.Height;
			var src_x = Math.round((img.Width - src_w) / 2);
		}
		gr.DrawImage(img, dst_x, dst_y, dst_w, dst_h, src_x + 3, src_y + 3, src_w - 6, src_h - 6, opacity || 1);
	} else {
		var s = Math.min(dst_w / img.Width, dst_h / img.Height);
		var w = Math.floor(img.Width * s);
		var h = Math.floor(img.Height * s);
		dst_x += Math.round((dst_w - w) / 2);
		dst_y += Math.round((dst_h - h) / 2);
		dst_w = w;
		dst_h = h;
		gr.DrawImage(img, dst_x, dst_y, dst_w, dst_h, 0, 0, img.Width, img.Height, opacity || 1);
	}

	if (border) {
		gr.DrawRectangle(dst_x, dst_y, dst_w - 1, dst_h - 1, 1, border);
	}
}

function drawBackground(gr) {
	gr.Clear(g_colour_background);

	if (!ppt.wallpapermode || !g_wallpaperImg)
		return;

	if (g_wallpaperImg.Width / g_wallpaperImg.Height < brw.w / brw.h) {
		var src_x = 0;
		var src_w = g_wallpaperImg.Width;
		var src_h = Math.round(brw.h * g_wallpaperImg.Width / brw.w);
		var src_y = Math.round((g_wallpaperImg.Height - src_h) / 2);
	} else {
		var src_y = 0;
		var src_w = Math.round(brw.w * g_wallpaperImg.Height / brw.h);
		var src_h = g_wallpaperImg.Height;
		var src_x = Math.round((g_wallpaperImg.Width - src_w) / 2);
	}

	gr.DrawBitmap(g_wallpaperImg, brw.x, brw.y, brw.w, brw.h, src_x + 3, src_y + 3, src_w - 6, src_h - 6, ppt.wallpaperopacity);
}

function drawSelectedRectangle(gr, x, y, w, h) {
	gr.FillRectangle(x, y, w, h, g_colour_selection);
}

function GetKeyboardMask() {
	if (utils.IsKeyPressed(VK_CONTROL))
		return KMask.ctrl;
	else if (utils.IsKeyPressed(VK_SHIFT))
		return KMask.shift;
	else
		return KMask.none;
}

function button(normal, hover, down) {
	this.x = 0;
	this.y = 0;
	this.w = normal.Width;
	this.h = normal.Height;
	this.img = [normal, hover, down];
	this.state = ButtonStates.normal;

	this.update = function (normal, hover, down) {
		this.w = normal.Width;
		this.h = normal.Height;
		this.img = [normal, hover, down];
	}

	this.draw = function (gr, x, y, alpha) {
		this.x = x;
		this.y = y;
		if (this.img[this.state]) {
			gr.DrawImage(this.img[this.state], this.x, this.y, this.w, this.h, 0, 0, this.w, this.h);
		}
	}

	this.repaint = function () {
		window.RepaintRect(this.x, this.y, this.w, this.h);
	}

	this.checkstate = function (event, x, y) {
		var hover = x > this.x && x < this.x + this.w && y > this.y && y < this.y + this.h;
		var old = this.state;

		switch (event) {
		case "lbtn_down":
			switch (this.state) {
			case ButtonStates.normal:
			case ButtonStates.hover:
				this.state = hover ? ButtonStates.down : ButtonStates.normal;
				this.isdown = true;
				break;
			}
			break;
		case "lbtn_up":
			this.state = hover ? ButtonStates.hover : ButtonStates.normal;
			this.isdown = false;
			break;
		case "move":
			switch (this.state) {
			case ButtonStates.normal:
			case ButtonStates.hover:
				this.state = hover ? ButtonStates.hover : ButtonStates.normal;
				break;
			}
			break;
		}

		if (this.state != old)
			this.repaint();

		return this.state;
	}
}

function setWallpaperImg() {
	if (g_wallpaperImg) {
		g_wallpaperImg = null;
	}

	if (ppt.wallpapermode == 0)
		return;

	var metadb = playback.GetNowPlaying();
	if (!metadb)
		return;

	var img = null;

	if (ppt.wallpapermode == 1) {
		img = metadb.GetAlbumArt();
	} else if (ppt.wallpapermode == 2) {
		if (utils.IsFile(ppt.wallpaperpath)) {
			img = utils.LoadImage(ppt.wallpaperpath);
		} else {
			img = utils.LoadImage(fb.ProfilePath + ppt.wallpaperpath);
		}
	}

	if (img) {
		if (ppt.wallpaperblurred) {
			img.StackBlur(ppt.wallpaperblur);
		}

		g_wallpaperImg = img.CreateBitmap();
	}
}

function scale(size) {
	return Math.round(size * g_fsize / 12);
}

function smooth_font(name, size, bold) {
	return JSON.stringify({
		Name : name,
		Size : scale(size),
		Weight : bold ? 700 : 400,
	});
}

function get_font() {
	var default_font = JSON.parse(window.GetUIFont(FontType.playlists));
	var name = default_font.Name;
	g_fsize = default_font.Size + Math.min(ppt.extra_font_size, 10);

	g_font = smooth_font(name, 12);
	g_font_bold = smooth_font(name, 14, true);
	g_font_box = smooth_font(name, 10, true);
	g_font_group1 = smooth_font(name, 20, true);
	g_font_group2 = smooth_font(name, 16);
	g_font_group3 = smooth_font(name, 12);
	g_font_fluent_12 = smooth_font("Segoe Fluent Icons", 12);
	g_font_fluent_20 = smooth_font("Segoe Fluent Icons", 20);

	g_time_width = "00:00:00".calc_width(g_font) + 20;
	g_font_height = g_fsize + 4;
}

function get_colours() {
	if (ppt.enableDynamicColours) {
		var arr = GetNowPlayingColours();
		if (arr.length) {
			g_colour_background = arr[0];
			g_colour_text = arr[1];
			g_colour_selection = arr[2];
			g_colour_selected_text = arr[3];
			get_images();
			return;
		}
	}

	if (ppt.enableCustomColours) {
		g_colour_background = window.GetProperty("SMOOTH.COLOUR.BACKGROUND.NORMAL", RGB(25, 25, 35));
		g_colour_selection = window.GetProperty("SMOOTH.COLOUR.BACKGROUND.SELECTED", RGB(15, 177, 255));
		g_colour_text = window.GetProperty("SMOOTH.COLOUR.TEXT", RGB(255, 255, 255));
		g_colour_selected_text = DetermineTextColour(g_colour_selection);
	} else {
		g_colour_background = window.GetUIColour(ColourType.background);
		g_colour_selection = window.GetUIColour(ColourType.selection);
		g_colour_text = window.GetUIColour(ColourType.text);
		g_colour_selected_text = DetermineTextColour(g_colour_selection);
	}

	get_images();
}

var cInputbox = {
	timer_cursor: false,
	cursor_state: true,
	clipboard: null
}

var cScrollBar = {
	visible: true,
	defaultWidth: 17,
	width: 17,
	ButtonType: {
		cursor: 0,
		up: 1,
		down: 2
	},
	defaultMinCursorHeight: 20,
	minCursorHeight: 20,
	timerID: false,
	timerCounter: -1
};

var ButtonStates = {
	normal: 0,
	hover: 1,
	down: 2
};

var KMask = {
	none: 0,
	ctrl: 1,
	shift: 2,
};

var images = {
	cache : {},
	clear : function () {
		for (var i in this.cache) {
			this.cache[i] = null;
		}
		this.cache = {};
	}
}

var ppt = {
	enableDynamicColours : window.GetProperty("SMOOTH.DYNAMIC.COLOURS.ENABLED", false),
	enableCustomColours: window.GetProperty("SMOOTH.CUSTOM.COLOURS.ENABLED", false),
	extra_font_size: Clamp(window.GetProperty("SMOOTH.EXTRA.FONT.SIZE", 0), 0, 10),
	showHeaderBar: window.GetProperty("SMOOTH.SHOW.TOP.BAR", true),
	autoFill: window.GetProperty("SMOOTH.AUTO.FILL", true),
	wallpapermode: window.GetProperty("SMOOTH.WALLPAPER.MODE2", 0), // 0 none, 1 front cover 2 custom image
	wallpaperblurred: window.GetProperty("SMOOTH.WALLPAPER.BLURRED", false),
	wallpaperblur: window.GetProperty("SMOOTH.WALLPAPER.BLUR", 50),
	wallpaperpath: window.GetProperty("SMOOTH.WALLPAPER.PATH", ""),
	wallpaperopacity: 0.1,
	refreshRate: 40,
	defaultHeaderBarHeight: 25,
	headerBarHeight: 25,
	scrollSmoothness: 2.5,
	rowScrollStep: 3,
};

utils.CreateFolder(Paths.smooth_cache);

var g_font;
var g_font_bold;
var g_font_box;
var g_font_group1;
var g_font_group2;
var g_font_group3;
var g_font_fluent_12;
var g_font_fluent_20;
var g_fsize = 16;

var g_colour_text = 0;
var g_colour_selected_text = 0;
var g_colour_background = 0;
var g_colour_selection = 0;

var g_time_width = 0;

var g_active_playlist = plman.ActivePlaylist;
var g_wallpaperImg = null;
var isScrolling = false;
var need_repaint = false;
var g_start_ = 0, g_end_ = 0;
var m_x = 0, m_y = 0;
var scroll_ = 0, scroll = 0, scroll_prev = 0;
var ww = 0, wh = 0;

get_font();
get_colours();
