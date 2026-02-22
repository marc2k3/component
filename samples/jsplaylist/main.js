function DrawCover(gr, img, dst_x, dst_y, dst_w, dst_h) {
	if (img) {
		var s = Math.min(dst_w / img.Width, dst_h / img.Height);
		var w = Math.floor(img.Width * s);
		var h = Math.floor(img.Height * s);
		dst_x += Math.round((dst_w - w) / 2);
		dst_w = w;
		dst_h = h;
		gr.DrawImage(img, dst_x, dst_y, dst_w, dst_h, 0, 0, img.Width, img.Height);
	}

	DrawRectangle(gr, dst_x, dst_y, dst_w - 1, dst_h - 1, g_colour_text);
}

function DrawWallpaper(gr) {
	if (images.wallpaper.Width / images.wallpaper.Height < ww / wh) {
		var src_x = 0;
		var src_w = images.wallpaper.Width;
		var src_h = Math.round(wh * images.wallpaper.Width / ww);
		var src_y = Math.round((images.wallpaper.Height - src_h) / 2);
	} else {
		var src_y = 0;
		var src_w = Math.round(ww * images.wallpaper.Height / wh);
		var src_h = images.wallpaper.Height;
		var src_x = Math.round((images.wallpaper.Width - src_w) / 2);
	}

	gr.DrawBitmap(images.wallpaper, 0, 0, ww, wh, src_x, src_y, src_w, src_h, 0.1);
}

function GetKeyboardMask() {
	if (utils.IsKeyPressed(VK_CONTROL))
		return KMask.ctrl;
	else if (utils.IsKeyPressed(VK_SHIFT))
		return KMask.shift;
	else
		return KMask.none;
}

function num(strg, nb) {
	var i;
	var str = strg.toString();
	var k = nb - str.length;

	if (k > 0) {
		for (i = 0; i < k; i++) {
			str = "0" + str;
		}
	}

	return str.toString();
}

function button(normal, hover, down) {
	this.img = [normal, hover, down];
	this.w = this.img[0].Width;
	this.h = this.img[0].Height;
	this.state = ButtonStates.normal;

	this.update = function (normal, hover, down) {
		this.img = [normal, hover, down];
		this.w = this.img[0].Width;
		this.h = this.img[0].Height;
	}

	this.draw = function (gr, x, y) {
		this.x = x;
		this.y = y;
		if (this.img[this.state]) gr.DrawImage(this.img[this.state], this.x, this.y, this.w, this.h, 0, 0, this.w, this.h);
	}

	this.checkstate = function (event, x, y) {
		this.ishover = (x > this.x && x < this.x + this.w - 1 && y > this.y && y < this.y + this.h - 1);
		var old = this.state;
		switch (event) {
		case "lbtn_down":
			switch (this.state) {
			case ButtonStates.normal:
			case ButtonStates.hover:
				this.state = this.ishover ? ButtonStates.down : ButtonStates.normal;
				this.isdown = true;
				break;
			}
			break;
		case "lbtn_up":
			this.state = this.ishover ? ButtonStates.hover : ButtonStates.normal;
			this.isdown = false;
			break;
		case "move":
			switch (this.state) {
			case ButtonStates.normal:
			case ButtonStates.hover:
				this.state = this.ishover ? ButtonStates.hover : ButtonStates.normal;
				break;
			}
			break;
		}

		if (this.state != old) {
			window.RepaintRect(this.x, this.y, this.w, this.h);
		}
		return this.state;
	}
}

function get_tfo(pattern) {
	if (!tfos[pattern]) {
		tfos[pattern] = fb.TitleFormat(pattern);
	}
	return tfos[pattern];
}

function renamePlaylist() {
	var text = p.playlistManager.inputbox.text.trim();

	if (p.playlistManager.inputboxID > -1 && text.length) {
		plman.RenamePlaylist(p.playlistManager.playlists[p.playlistManager.inputboxID].idx, text);
		p.playlistManager.inputboxID = -1;
	}
}

function inputboxPlaylistManager_activate() {
	if (cPlaylistManager.inputbox_timeout) {
		window.ClearTimeout(cPlaylistManager.inputbox_timeout);
		cPlaylistManager.inputbox_timeout = false;
	}

	p.playlistManager.inputbox.on_focus(true);
	p.playlistManager.inputbox.edit = true;
	p.playlistManager.inputbox.Cpos = p.playlistManager.inputbox.text.length;
	p.playlistManager.inputbox.anchor = p.playlistManager.inputbox.Cpos;
	p.playlistManager.inputbox.SelBegin = p.playlistManager.inputbox.Cpos;
	p.playlistManager.inputbox.SelEnd = p.playlistManager.inputbox.Cpos;

	if (!cInputbox.cursor_interval) {
		p.playlistManager.inputbox.resetCursorTimer();
	}

	p.playlistManager.inputbox.dblclk = true;
	p.playlistManager.inputbox.SelBegin = 0;
	p.playlistManager.inputbox.SelEnd = p.playlistManager.inputbox.text.length;
	p.playlistManager.inputbox.text_selected = p.playlistManager.inputbox.text;
	p.playlistManager.inputbox.select = true;
	full_repaint();
}

function togglePlaylistManager() {
	if (!cPlaylistManager.hscroll_interval) {
		if (cPlaylistManager.visible) {
			cPlaylistManager.hscroll_interval = window.SetInterval(function () {
				p.playlistManager.repaint();
				p.playlistManager.woffset -= cPlaylistManager.step;
				if (p.playlistManager.woffset <= 0) {
					p.playlistManager.woffset = 0;
					cPlaylistManager.visible = false;
					p.headerBar.button.update(p.headerBar.slide_open, p.headerBar.slide_open, p.headerBar.slide_open);
					full_repaint();
					window.ClearInterval(cPlaylistManager.hscroll_interval);
					cPlaylistManager.hscroll_interval = false;
				}
			}, 16);
		} else {
			p.playlistManager.refresh();
			cPlaylistManager.hscroll_interval = window.SetInterval(function () {
				p.playlistManager.woffset += cPlaylistManager.step;
				if (p.playlistManager.woffset >= cPlaylistManager.width) {
					p.playlistManager.woffset = cPlaylistManager.width;
					cPlaylistManager.visible = true;
					p.headerBar.button.update(p.headerBar.slide_close, p.headerBar.slide_close, p.headerBar.slide_close);
					full_repaint();
					window.ClearInterval(cPlaylistManager.hscroll_interval);
					cPlaylistManager.hscroll_interval = false;
				} else {
					p.playlistManager.repaint();
				}
			}, 16);
		}
	}
}

function image_cache() {
	this.get = function (metadb, group_key) {
		var img = this.cachelist[group_key];
		if (img)
			return img;

		if (!this.requested[group_key]) {
			this.requested[group_key] = true;
			window.SetTimeout(function () {
				metadb.GetAlbumArtThumbAsync(cGroup.art_id);
			}, 20);
		}
		return null;
	}

	this.set = function (group_key, image) {
		this.cachelist[group_key] = image;
		full_repaint();
	}

	this.reset = function () {
		for (var key in this.cachelist) {
			this.cachelist[key] = null;
		}
		this.cachelist = {};
		this.requested = {};
	}

	this.cachelist = {};
	this.requested = {};
}

function full_repaint() {
	need_repaint = true;
}

function resize_panels() {
	cRow.playlist_h = scale(cRow.default_playlist_h) + scale(6);
	p.topBar.setSize(0, 0, ww, cTopBar.visible ? cTopBar.height + cHeaderBar.borderWidth : 0);

	p.headerBar.visible = cHeaderBar.locked;
	p.headerBar.setSize(0, p.topBar.h, ww, cHeaderBar.height);
	p.headerBar.calculateColumns();

	// set Size of List
	var list_h = wh - p.topBar.h - (p.headerBar.visible ? p.headerBar.h + cHeaderBar.borderWidth : 0);
	p.list.setSize(0, wh - list_h, ww, list_h);

	if (g_init_on_size) {
		p.list.setItems(true);
	}

	// set Size of scrollbar
	p.scrollbar.setSize(p.list.x + p.list.w - cScrollBar.width, p.list.y, cScrollBar.width, p.list.h);
	p.scrollbar.setCursor(p.list.totalRowVisible, p.list.totalRows, p.list.offset);

	// set Size of Settings
	p.settings.setSize(0, 0, ww, wh);

	// set Size of PlaylistManager
	if (cPlaylistManager.visible) {
		cPlaylistManager.visible = g_init_on_size;
		p.playlistManager.woffset = g_init_on_size ? 0 : cPlaylistManager.width;
	}
	p.playlistManager.setSize(ww, p.list.y, cPlaylistManager.width, p.list.h);
	p.playlistManager.refresh();
}

function init() {
	get_font();
	get_colours();
	plman.SetActivePlaylistContext();
	update_wallpaper();
	g_stub_image = fb.GetAlbumArtStub(cGroup.art_id);

	p.list = new oList("p.list");
	p.topBar = new oTopBar();
	p.headerBar = new oHeaderBar();
	p.scrollbar = new PlaylistScrollBar();

	p.playlistManager = new oPlaylistManager();
	p.settings = new oSettings();

	window.SetInterval(function () {
		if (!window.IsVisible) {
			need_repaint = true;
			return;
		}

		if (need_repaint) {
			need_repaint = false;
			window.Repaint();
		}
	}, 40);
}

function update_playlist() {
	g_group_id_focused = 0;
	p.list.updateHandleList();

	p.list.setItems(false);
	p.scrollbar.setCursor(p.list.totalRowVisible, p.list.totalRows, p.list.offset);

	if (cHeaderBar.sortRequested) {
		window.SetCursor(IDC_ARROW);
		cHeaderBar.sortRequested = false;
	}
}

function height(font) {
	return JSON.parse(font).Size + scale(4)
}

function scale(size) {
	return Math.round(size * g_font_size / 12);
}

function js_font(name, size, bold) {
	return JSON.stringify({
		Name : name,
		Size : scale(size),
		Weight : bold ? 700 : 400,
	});
}

function get_font() {
	var default_font = JSON.parse(window.GetUIFont(FontType.playlists));
	var name = default_font.Name;
	g_font_size = default_font.Size;

	cTopBar.height = scale(54);
	cHeaderBar.height = scale(26);
	cHeaderBar.borderWidth = scale(2);
	cSettings.topBarHeight = scale(50);
	cSettings.tabPaddingWidth = scale(16);
	cSettings.rowHeight = scale(30);
	cPlaylistManager.width = scale(220);
	cPlaylistManager.rowHeight = scale(28);
	cPlaylistManager.statusBarHeight = scale(18);
	cScrollBar.width = scale(cScrollBar.defaultWidth);

	g_z2 = scale(2);
	g_z4 = scale(4);
	g_z5 = scale(5);
	g_z10 = scale(10);
	g_z16 = scale(16);

	g_font_12 = js_font(name, 12);
	g_font_12_bold = js_font(name, 12, true);
	g_font_20_bold = js_font(name, 20, true);

	g_font_fluent_12 = js_font("Segoe Fluent Icons", 12);
	g_font_fluent_20 = js_font("Segoe Fluent Icons", 20);

	g_font_group1 = js_font(name, 16, true);
	g_font_group2 = js_font(name, 14);

	g_queue_width = "0000".calc_width(g_font_20_bold);
}

function get_colours() {
	g_dynamic = false;
	g_colour_mood = window.GetProperty("JSPLAYLIST.COLOUR.MOOD", RGB(196,30,35));

	if (properties.enableDynamicColours) {
		var arr = GetNowPlayingColours();
		if (arr.length) {
			g_dynamic = true;
			g_colour_background = arr[0];
			g_colour_text = arr[1];
			g_colour_selection = arr[2];
			g_colour_selected_text = arr[3];
			g_colour_highlight = g_colour_text;
			return;
		}
	}

	if (properties.enableCustomColours) {
		g_colour_background = window.GetProperty("JSPLAYLIST.COLOUR BACKGROUND NORMAL", RGB(25, 25, 35));
		g_colour_selection = window.GetProperty("JSPLAYLIST.COLOUR BACKGROUND SELECTED", RGB(130,150,255));
		g_colour_text = window.GetProperty("JSPLAYLIST.COLOUR TEXT NORMAL", RGB(180, 180, 180));
		g_colour_selected_text = DetermineTextColour(g_colour_selection);
		g_colour_highlight = window.GetProperty("JSPLAYLIST.COLOUR TEXT HIGHLIGHT", g_colour_text);
	} else {
		g_colour_background = window.GetUIColour(ColourType.background);
		g_colour_selection = window.GetUIColour(ColourType.selection);
		g_colour_text = window.GetUIColour(ColourType.text);
		g_colour_selected_text = DetermineTextColour(g_colour_selection);
		g_colour_highlight = window.GetUIColour(ColourType.highlight);
	}
}

function update_wallpaper() {
	if (images.wallpaper) {
		images.wallpaper = null;
	}

	if (!properties.showwallpaper)
		return;

	var metadb = playback.GetNowPlaying();

	if (!metadb)
		return;

	var img = null;

	if (properties.wallpapertype == -1) {
		if (utils.IsFile(properties.wallpaperpath)) {
			img = utils.LoadImage(properties.wallpaperpath);
		} else {
			img = utils.LoadImage(fb.ProfilePath + properties.wallpaperpath);
		}
	} else {
		img = metadb.GetAlbumArt(properties.wallpapertype);
	}

	if (!img)
		return;

	if (properties.wallpaperblurred) {
		img.StackBlur(properties.wallpaperblurvalue);
	}

	images.wallpaper = img.CreateBitmap();
}

var g_middle_clicked = false;
var g_middle_click_timeout = false;
var g_textbox_tabbed = false;
var g_init_on_size = false;
var g_seconds = 0;
var g_mouse_wheel_timeout = false;
var g_active_playlist = plman.ActivePlaylist;
var g_image_cache = new image_cache();
var g_stub_image = null;

var g_drag_drop_status = false;
var g_drag_drop_bottom = false;
var g_drag_drop_track_id = -1;
var g_drag_drop_row_id = -1;
var g_drag_drop_playlist_id = -1;
var g_drag_drop_playlist_manager_hover = false;
var g_drag_drop_internal = false;

var g_colour_text = 0;
var g_colour_selected_text = 0;
var g_colour_background = 0;
var g_colour_selection = 0;
var g_colour_highlight = 0;
var g_colour_mood = 0;

var g_font_12;
var g_font_12_bold;
var g_font_20_bold;
var g_font_fluent_12;
var g_font_fluent_20;
var g_font_fluent_40 = JSON.stringify({Name:"Segoe Fluent Icons", Size:40}); // fixed, not relative to UI font size
var g_font_group1;
var g_font_group2;
var g_font_size;

var g_queue_width = 0;
var g_dynamic = false;
var g_double_clicked = false;

var g_tf_pattern = "";
var g_tf2_pattern = "";

var ww = 0, wh = 0;
var mouse_x = 0, mouse_y = 0;
var need_repaint = false;
var foo_lastfm_playcount_sync = fb.CheckComponent("foo_lastfm_playcount_sync");
var tfos = {};
var tf_group_key = null;

var KMask = {
	none: 0,
	ctrl: 1,
	shift: 2
};

var ButtonStates = {
	normal: 0,
	hover: 1,
	down: 2
};

var properties = {
	enableDynamicColours: window.GetProperty("JSPLAYLIST.Enable Dynamic Colours", false),
	enableCustomColours: window.GetProperty("JSPLAYLIST.Enable Custom Colours", false),
	showgroupheaders : window.GetProperty("JSPLAYLIST.Show Group Headers", true),
	showscrollbar : window.GetProperty("JSPLAYLIST.Show Scrollbar", true),
	showwallpaper : window.GetProperty("JSPLAYLIST.Show Wallpaper", false),
	wallpaperblurred : window.GetProperty("JSPLAYLIST.Wallpaper Blurred", false),
	wallpaperblurvalue : window.GetProperty("JSPLAYLIST.Wallpaper StackBlur value", 60),
	wallpapertype : window.GetProperty("JSPLAYLIST.Wallpaper Type", 0),
	wallpaperpath : window.GetProperty("JSPLAYLIST.Default Wallpaper Path", ""),
	max_columns : 24,
	max_patterns : 25,
};

var images = {
	wallpaper : null,
};

var cRow = {
	default_playlist_h : window.GetProperty("JSPLAYLIST.Playlist Row Height in Pixel", 28),
	playlist_h : 29,
};

var p = {
	topbar : null,
	headerBar : null,
	list : null,
	playlistManager : null,
	settings : null,
};

var cSettings = {
	visible : false,
	topBarHeight : 50,
	tabPaddingWidth : 16,
	rowHeight : 30,
	wheel_timeout : false
};

var cPlaylistManager = {
	width : 220,
	rowHeight : 28,
	showStatusBar : true,
	statusBarHeight : 18,
	step : 50,
	visible : false,
	hscroll_interval : false,
	drag_clicked : false,
	drag_moved : false,
	drag_target_id : -1,
	drag_source_id : -1,
	drag_dropped : false,
	rightClickedId : null,
	init_timeout : false,
	inputbox_timeout : false,
};

var cTopBar = {
	height : 54,
	visible : window.GetProperty("JSPLAYLIST.TopBar.Visible", true)
};

var cHeaderBar = {
	height : 26,
	borderWidth : 2,
	locked : window.GetProperty("JSPLAYLIST.HEADERBAR2.Locked", true),
	timerAutoHide : false,
	sortRequested : false
};

var cScrollBar = {
	defaultWidth : 17,
	width : 17,
	buttonType : {
		cursor : 0,
		up : 1,
		down : 2
	},
	interval : false,
	timeout : false,
	timer_counter : 0,
	repaint_timeout : false,
};

var cGroup = {
	expandedHeight : 3,
	pattern_idx : window.GetProperty("JSPLAYLIST.GROUPBY2.INDEX", 0),
	art_id : window.GetProperty("JSPLAYLIST.GROUPBY2.ART.ID", 0),
};

var cover = { show : true };

var cList = {
	scrollstep : window.GetProperty("JSPLAYLIST.Playlist Scroll Step", 3),
	scroll_timer : false,
	scroll_delta : cRow.playlist_h,
	scroll_direction : 1,
	scroll_step : Math.floor(cRow.playlist_h / 3),
	scroll_div : 2,
	borderWidth : 2
};

var columns = {
	mood_x : 0,
	mood_w : 0,
};

init();
