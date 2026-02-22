'use strict';

class Property {
	#name;
	#default_;
	#val;

	constructor (name, default_) {
		Object.defineProperty(this, typeof default_ == 'boolean' ? 'enabled' : 'value', {
			get : () => {
				return this.#val;
			},
			set : (value) => {
				this.#val = value;
				window.SetProperty(this.#name, this.#val);
			}
		});

		this.#name = name;
		this.#default_ = default_;
		this.#val = window.GetProperty(name, default_);
	}

	toggle () {
		this.#val = !this.#val;
		window.SetProperty(this.#name, this.#val);
	}
}

class Paths {
	static component_path = fb.ComponentPath;
	static samples = this.component_path + 'samples\\';

	static js = this.samples + 'js\\'
	static jsplaylist = this.samples + 'jsplaylist\\';
	static smooth = this.samples + 'smooth\\';
	static text = this.samples + 'text\\';

	static data = fb.ProfilePath + 'js_data\\';
	static smooth_cache = this.data + 'smooth_cache\\';
	static artists = this.data + 'artists\\';
	static lastfm = this.data + 'lastfm\\';
}

const includeJS = (filename) => {
	return include(Paths.js + filename);
};

const pos2vol = (pos) => {
	return Math.max(-100, 10 * Math.log(pos) / Math.LN2);
}

const vol2pos = (v) => {
	return Math.pow(2, v / 10);
}

const Point2Pixel = (pt, dpi) => {
	return pt * dpi / 72;
}

const RGB = (r, g, b) => {
	return (0xff000000 | (r << 16) | (g << 8) | (b));
}

const RGBA = (r, g, b, a) => {
	return ((a << 24) | (r << 16) | (g << 8) | (b));
}

const toRGB = (col) => {
	const a = col - 0xFF000000;
	return [a >> 16, a >> 8 & 0xFF, a & 0xFF];
}

const getAlpha = (colour) => {
	return ((colour >> 24) & 0xff);
}

const getRed = (colour) => {
	return ((colour >> 16) & 0xff);
}

const getGreen = (colour) => {
	return ((colour >> 8) & 0xff);
}

const getBlue = (colour) => {
	return (colour & 0xff);
}

const setAlpha = (colour, a) => {
	return ((colour & 0x00ffffff) | (a << 24));
}

const setRed = (colour, r) => {
	return ((colour & 0xff00ffff) | (r << 16));
}

const setGreen = (colour, g) => {
	return ((colour & 0xffff00ff) | (g << 8));
}

const setBlue = (colour, b) => {
	return ((colour & 0xffffff00) | b);
}

const blendColours = (c1, c2, factor) => {
	c1 = toRGB(c1);
	c2 = toRGB(c2);
	const r = Math.round(c1[0] + factor * (c2[0] - c1[0]));
	const g = Math.round(c1[1] + factor * (c2[1] - c1[1]));
	const b = Math.round(c1[2] + factor * (c2[2] - c1[2]));
	return (0xff000000 | (r << 16) | (g << 8) | (b));
}

const Clamp = (value, min, max) => {
	if (value < min)
		return min;
	else if (value > max)
		return max;
	else
		return value;
}

// Lunminance and DetermineTextColour are based on code from the foobar2000 SDK.
const Luminance = (colour) => {
	const r = getRed(colour);
	const g = getGreen(colour)
	const b = getBlue(colour);
	return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255.0;
}

const DetermineTextColour = (background) => {
	if (Luminance(background) > 0.6) {
		return RGB(0, 0, 0);
	}
	return RGB(255, 255, 255);
}

// fixed line width of 1px
const DrawRectangle = (gr, x, y, w, h, colour) => {
	gr.DrawRectangle(Math.floor(x) + 0.5, Math.floor(y) + 0.5, w, h, 1, colour);
}

// Simplified 2 colour helper
const FillGradientRectangle = (gr, x, y, w, h, direction, colour1, colour2) => {
	const stops = [[0, colour1], [1, colour2]];
	const brush = {Start : [0, 0], Stops: stops};

	if (direction == 0)
		brush.End = [0, h];
	else
		brush.End = [w, 0];

	gr.FillRectangle(x, y, w, h, JSON.stringify(brush));
}

const EnableMenuIf = (condition) => {
	return condition ? MF_STRING : MF_GRAYED;
}

const CheckMenuIf = (condition) => {
	let flags = MF_STRING;

	if (condition) {
		flags |= MF_CHECKED;
	}

	return flags;
}

const GetMenuFlags = (enabled, checked) => {
	let flags = enabled ? MF_STRING : MF_GRAYED;

	if (checked) {
		flags |= MF_CHECKED;
	}

	return flags;
}

const CreateFontString = (name, size, bold) => {
	return JSON.stringify({
		Name : name,
		Size : Math.round(size * DPI / 72),
		Weight : bold ? DWRITE_FONT_WEIGHT_BOLD : DWRITE_FONT_WEIGHT_NORMAL
	});
}

const GetNowPlayingColours = () => {
	const metadb = playback.GetNowPlaying();
	if (!metadb)
		return [];

	const img = metadb.GetAlbumArt(AlbumArtId.front, false); // 2nd arg is want_stub - we don't
	if (!img)
		return [];

	const extracted_colours = img.GetColourScheme(10).map((item) => {
		return {
			colour: item,
			luminance: Luminance(item),
		};
	});

	const background_colour = extracted_colours[0].colour;
	const text_colour = DetermineTextColour(background_colour);
	let selected_background_colour;
	let selected_text_colour;

	// extreme edge case where image is solid colour :/
	if (extracted_colours.length == 1) {
		// invert
		selected_background_colour = text_colour;
		selected_text_colour = background_colour;
	} else {
		const l = extracted_colours[0].luminance;
		extracted_colours.pop();

		let diff = 0;
		let idx = 0;
		extracted_colours.forEach((item, i) => {
			const tmp = Math.abs(l - item.luminance);
			if (tmp > diff) {
				diff = tmp;
				idx = i;
			}
		});

		selected_background_colour = extracted_colours[idx].colour;
		selected_text_colour = DetermineTextColour(selected_background_colour);
	}

	return [background_colour, text_colour, selected_background_colour, selected_text_colour];
}

const Scale = (size) => {
	return Math.round(size * DPI / 72);
}

const IsFlagSet = (value, flags) => {
	return (value & flags) != 0;
}

const PlaylistCanAddItems = (playlistIndex) => {
	const mask = plman.GetPlaylistLockFilterMask(playlistIndex);
	return !IsFlagSet(mask, PlaylistLockFilterMask.filter_add);
}

const PlaylistCanRemoveItems = (playlistIndex) => {
	const mask = plman.GetPlaylistLockFilterMask(playlistIndex);
	return !IsFlagSet(mask, PlaylistLockFilterMask.filter_remove);
}

const PlaylistCanReorder = (playlistIndex) => {
	const mask = plman.GetPlaylistLockFilterMask(playlistIndex);
	return !IsFlagSet(mask, PlaylistLockFilterMask.filter_reorder);
}

const PlaylistCanReplaceItems = (playlistIndex) => {
	const mask = plman.GetPlaylistLockFilterMask(playlistIndex);
	return !IsFlagSet(mask, PlaylistLockFilterMask.filter_replace);
}

const PlaylistCanRename = (playlistIndex) => {
	const mask = plman.GetPlaylistLockFilterMask(playlistIndex);
	return !IsFlagSet(mask, PlaylistLockFilterMask.filter_rename);
}

const PlaylistCanRemove = (playlistIndex) => {
	const mask = plman.GetPlaylistLockFilterMask(playlistIndex);
	return !IsFlagSet(mask, PlaylistLockFilterMask.filter_remove_playlist);
}

const chars = {
	check_on : '\ue73a',
	check_off : '\ue739',
	heart_on : '\ueb52',
	heart_off : '\ueb51',
	radio_on : '\ueccb',
	radio_off : '\uecca',
	rating_on : '\ue735',
	rating_off : '\ue734',
	list : '\uea37',
	lock : '\ue72e',
	working : '\ue916',
	up : '\ue70e',
	down : '\ue70d',
	left : '\ue76b',
	right : '\ue76c',
	close : '\uef2c',
	stop : '\uE71A',
	prev : '\uE892',
	play : '\uE768',
	pause : '\uE769',
	next : '\uE893',
	search : '\uE721',
	preferences : '\uE713',
	menu : '\ue700',
	music : '\uec4f',
	volume : '\ue767',
	repeat_all : '\ue8ee',
	repeat_one : '\ue8ed',
	repeat_off : '\uf5e7',
	shuffle : '\ue8b1',
	random : '\ue9ce',
	album : '\ue93c',
	folder : '\ued25',
	autoplaylist : '\uea69',
	moon : '\ue708',
	brightness : '\ue706',
// Ignore these, they are special chars for $rgb and $font parsing
	etx : String.fromCharCode(3),
	bel : String.fromCharCode(7),
	tab : '\t',
};

const DWRITE_FONT_WEIGHT_THIN = 100;
const DWRITE_FONT_WEIGHT_EXTRA_LIGHT = 200;
const DWRITE_FONT_WEIGHT_ULTRA_LIGHT = 200;
const DWRITE_FONT_WEIGHT_LIGHT = 300;
const DWRITE_FONT_WEIGHT_SEMI_LIGHT = 350;
const DWRITE_FONT_WEIGHT_NORMAL = 400;
const DWRITE_FONT_WEIGHT_REGULAR = 400;
const DWRITE_FONT_WEIGHT_MEDIUM = 500;
const DWRITE_FONT_WEIGHT_DEMI_BOLD = 600;
const DWRITE_FONT_WEIGHT_SEMI_BOLD = 600;
const DWRITE_FONT_WEIGHT_BOLD = 700;
const DWRITE_FONT_WEIGHT_EXTRA_BOLD = 800;
const DWRITE_FONT_WEIGHT_ULTRA_BOLD = 800;
const DWRITE_FONT_WEIGHT_BLACK = 900;
const DWRITE_FONT_WEIGHT_HEAVY = 900;
const DWRITE_FONT_WEIGHT_EXTRA_BLACK = 950;
const DWRITE_FONT_WEIGHT_ULTRA_BLACK = 950;

const DWRITE_FONT_STYLE_NORMAL = 0;
const DWRITE_FONT_STYLE_OBLIQUE = 1;
const DWRITE_FONT_STYLE_ITALIC = 2;

const DWRITE_FONT_STRETCH_ULTRA_CONDENSED = 1;
const DWRITE_FONT_STRETCH_EXTRA_CONDENSED = 2;
const DWRITE_FONT_STRETCH_CONDENSED = 3;
const DWRITE_FONT_STRETCH_SEMI_CONDENSED = 4;
const DWRITE_FONT_STRETCH_NORMAL = 5;
const DWRITE_FONT_STRETCH_MEDIUM = 5;
const DWRITE_FONT_STRETCH_SEMI_EXPANDED = 6;
const DWRITE_FONT_STRETCH_EXPANDED = 7;
const DWRITE_FONT_STRETCH_EXTRA_EXPANDED = 8;
const DWRITE_FONT_STRETCH_ULTRA_EXPANDED = 9;

const DWRITE_TEXT_ALIGNMENT_LEADING = 0;
const DWRITE_TEXT_ALIGNMENT_TRAILING = 1;
const DWRITE_TEXT_ALIGNMENT_CENTER = 2;
const DWRITE_TEXT_ALIGNMENT_JUSTIFIED = 3;

const DWRITE_PARAGRAPH_ALIGNMENT_NEAR = 0;
const DWRITE_PARAGRAPH_ALIGNMENT_FAR = 1;
const DWRITE_PARAGRAPH_ALIGNMENT_CENTER = 2;

const DWRITE_WORD_WRAPPING_WRAP = 0;
const DWRITE_WORD_WRAPPING_NO_WRAP = 1;
const DWRITE_WORD_WRAPPING_EMERGENCY_BREAK = 2;
const DWRITE_WORD_WRAPPING_WHOLE_WORD = 3;
const DWRITE_WORD_WRAPPING_CHARACTER = 4;

const DWRITE_TRIMMING_GRANULARITY_NONE = 0;
const DWRITE_TRIMMING_GRANULARITY_CHARACTER = 1;
const DWRITE_TRIMMING_GRANULARITY_WORD = 2;

const WICBitmapTransformRotate0 = 0;
const WICBitmapTransformRotate90 = 1;
const WICBitmapTransformRotate180 = 2;
const WICBitmapTransformRotate270 = 3;
const WICBitmapTransformFlipHorizontal = 8;
const WICBitmapTransformFlipVertical = 16;

const MB_OK = 0;
const MB_OKCANCEL = 1;
const MB_ABORTRETRYIGNORE = 2;
const MB_YESNOCANCEL = 3;
const MB_YESNO = 4;

const MB_ICONHAND = 16;
const MB_ICONQUESTION = 32;
const MB_ICONEXCLAMATION = 48;
const MB_ICONASTERISK = 64;

const IDOK = 1;
const IDCANCEL = 2;
const IDABORT = 3;
const IDRETRY = 4;
const IDIGNORE = 5;
const IDYES = 6;
const IDNO = 7;

const MF_SEPARATOR = 0x00000800;
const MF_ENABLED = 0x00000000;
const MF_GRAYED = 0x00000001;
const MF_DISABLED = 0x00000002;
const MF_UNCHECKED = 0x00000000;
const MF_CHECKED = 0x00000008;
const MF_STRING = 0x00000000;
const MF_MENUBARBREAK = 0x00000020;
const MF_MENUBREAK = 0x00000040;
// const MF_BITMAP; // do not use
// const MF_OWNERDRAW // do not use
// const MF_POPUP // do not use

const TPM_LEFTALIGN = 0x0000;
const TPM_CENTERALIGN = 0x0004;
const TPM_RIGHTALIGN = 0x0008;
const TPM_TOPALIGN = 0x0000;
const TPM_VCENTERALIGN = 0x0010;
const TPM_BOTTOMALIGN = 0x0020;
const TPM_HORIZONTAL = 0x0000;
const TPM_VERTICAL = 0x0040;
const TPM_HORPOSANIMATION = 0x0400;
const TPM_HORNEGANIMATION = 0x0800;
const TPM_VERPOSANIMATION = 0x1000;
const TPM_VERNEGANIMATION = 0x2000;
const TPM_NOANIMATION = 0x4000;

const MK_LBUTTON = 0x0001;
const MK_RBUTTON = 0x0002;
const MK_SHIFT = 0x0004;
const MK_CONTROL = 0x0008;
const MK_MBUTTON = 0x0010;
const MK_XBUTTON1 = 0x0020;
const MK_XBUTTON2 = 0x0040;

const IDC_ARROW = 32512;
const IDC_IBEAM = 32513;
const IDC_WAIT = 32514;
const IDC_CROSS = 32515;
const IDC_UPARROW = 32516;
const IDC_SIZE = 32640;
const IDC_ICON = 32641;
const IDC_SIZENWSE = 32642;
const IDC_SIZENESW = 32643;
const IDC_SIZEWE = 32644;
const IDC_SIZENS = 32645;
const IDC_SIZEALL = 32646;
const IDC_NO = 32648;
const IDC_APPSTARTING = 32650;
const IDC_HAND = 32649;
const IDC_HELP = 32651;

const FILE_ATTRIBUTE_READONLY = 0x00000001;
const FILE_ATTRIBUTE_HIDDEN = 0x00000002;
const FILE_ATTRIBUTE_SYSTEM = 0x00000004;
const FILE_ATTRIBUTE_DIRECTORY = 0x00000010;
const FILE_ATTRIBUTE_ARCHIVE = 0x00000020;
const FILE_ATTRIBUTE_NORMAL = 0x00000080;
const FILE_ATTRIBUTE_TEMPORARY = 0x00000100;
const FILE_ATTRIBUTE_SPARSE_FILE = 0x00000200;
const FILE_ATTRIBUTE_REPARSE_POINT = 0x00000400;
const FILE_ATTRIBUTE_COMPRESSED = 0x00000800;
const FILE_ATTRIBUTE_OFFLINE = 0x00001000;
const FILE_ATTRIBUTE_NOT_CONTENT_INDEXED = 0x00002000;
const FILE_ATTRIBUTE_ENCRYPTED = 0x00004000;
// const FILE_ATTRIBUTE_DEVICE // do not use
// const FILE_ATTRIBUTE_VIRTUAL // do not use

const VK_F1 = 0x70;
const VK_F2 = 0x71;
const VK_F3 = 0x72;
const VK_F4 = 0x73;
const VK_F5 = 0x74;
const VK_F6 = 0x75;
const VK_BACK = 0x08;
const VK_TAB = 0x09;
const VK_RETURN = 0x0D;
const VK_SHIFT = 0x10;
const VK_CONTROL = 0x11;
const VK_ALT = 0x12;
const VK_ESCAPE = 0x1B;
const VK_PGUP = 0x21;
const VK_PGDN = 0x22;
const VK_END = 0x23;
const VK_HOME = 0x24;
const VK_LEFT = 0x25;
const VK_UP = 0x26;
const VK_RIGHT = 0x27;
const VK_DOWN = 0x28;
const VK_INSERT = 0x2D;
const VK_DELETE = 0x2E;
const VK_SPACEBAR = 0x20;

const UINT_MAX = Math.pow(2, 32) - 1;
const DPI = window.DPI;
const GET = 0;
const POST = 1;

const AlbumArtId = {
	front : 0,
	back : 1,
	disc : 2,
	icon : 3,
	artist : 4,
};

const AlbumArtType = {
	embedded : 0,
	default : 1,
	stub : 2,
};

const ColourType = {
	text : 0,
	background : 1,
	highlight : 2,
	selection : 3,
};

const FontType = {
	defaults : 0,
	tabs : 1,
	lists : 2,
	playlists : 3,
	statusbar : 4,
	console : 5,
};

const PlaylistLockFilterMask = {
	filter_add : 1,
	filter_remove : 2,
	filter_reorder : 4,
	filter_replace : 8,
	filter_rename : 16,
	filter_remove_playlist : 32,
};

const ReplaygainMode = {
	None : 0,
	Track : 1,
	Album : 2,
	Track_Album_By_Playback_Order : 3,
};

const PlaybackOrder = {
	Default : 0,
	Repeat_Playlist : 1,
	Repeat_Track : 2,
	Random : 3,
	Shuffle_tracks : 4,
	Shuffle_albums : 5,
	Shuffle_folders : 6,
};

const PlaybackQueueOrigin = {
	user_added : 0,
	user_removed : 1,
	playback_advance : 2,
};

const PlaybackStartingCMD = {
	default : 0,
	play : 1,
	next : 2,
	prev : 3,
	settrack : 4,
	rand : 5,
	resume : 6,
};

const PlaybackStopReason = {
	user : 0,
	eof : 1,
	starting_another : 2,
};

const SelectionType = {
	undefined : 0,
	active_playlist_selection : 1,
	caller_active_playlist : 2,
	playlist_manager : 3,
	now_playing : 4,
	keyboard_shortcut_list : 5,
	media_library_viewer : 6,
};

Number.prototype.calc_width = function (font) {
	return utils.CalcTextWidth(this.toString(), font);
}

String.prototype.calc_width = function (font) {
	if (this.empty())
		return 0;

	return utils.CalcTextWidth(this, font);
}

String.prototype.empty = function () {
	return this.length == 0;
}
