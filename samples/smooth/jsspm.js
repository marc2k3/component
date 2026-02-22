function on_char(code) {
	if (brw.inputboxID >= 0) {
		brw.inputbox.on_char(code);
	}
}

function on_drag_drop(action, x, y, mask) {
	if (x > brw.scrollbar.x || y < brw.y) {
		action.Effect = 0;
	} else {
		if (g_drag_drop_target_id > -1) {
			if (PlaylistCanAddItems(g_drag_drop_target_id)) {
				plman.UndoBackup(g_drag_drop_target_id);
				action.Playlist = g_drag_drop_target_id;
				action.Base = plman.GetPlaylistItemCount(g_drag_drop_target_id);
				action.ToSelect = false;
				action.Effect = 1;
			} else {
				action.Effect = 0;
			}
		} else {
			action.Playlist = plman.CreatePlaylist(plman.PlaylistCount, "Dropped Items");;
			action.Base = 0;
			action.ToSelect = true;
			action.Effect = 1;
		}
	}
	g_drag_drop_target_id = -1;
	brw.repaint();
}

function on_drag_leave() {
	g_drag_drop_target_id = -1;

	if (cScrollBar.timerID) {
		window.ClearInterval(cScrollBar.timerID);
		cScrollBar.timerID = false;
	}

	brw.repaint();
}

function on_drag_over(action, x, y, mask) {
	if (x > brw.scrollbar.x || y < brw.y) {
		action.Effect = 0;
	} else {
		g_drag_drop_target_id = -1;
		brw.on_mouse("drag_over", x, y);
		if (g_drag_drop_target_id > -1) {
			action.Effect = PlaylistCanAddItems(g_drag_drop_target_id) ? 1 : 0;
		} else {
			action.Effect = 1;
		}
	}
	brw.repaint();
}

function on_focus(is_focused) {
	if (brw.inputboxID >= 0) {
		brw.inputbox.on_focus(is_focused);
	}
	if (!is_focused) {
		brw.inputboxID = -1;
		brw.repaint();
	}
}

function on_key_down(vkey) {
	if (brw.inputboxID >= 0) {
		if (vkey == VK_ESCAPE) brw.inputboxID = -1;
		brw.inputbox.on_key_down(vkey);
	} else {
		var mask = GetKeyboardMask();

		if (mask == KMask.none && brw.rows.length > 0) {
			switch (vkey) {
			case VK_F2:
				if (brw.selectedRow > -1) {
					if (PlaylistCanRename(brw.selectedRow)) {
						brw.showSelectedPlaylist();
						brw.rename_playlist(brw.selectedRow);
					}
				}
				break;
			case VK_RETURN:
				if (brw.selectedRow > -1) {
					plman.ActivePlaylist = brw.selectedRow;
					brw.repaint();
				}
				break;
			case VK_DELETE:
				if (brw.selectedRow > -1) {
					plman.RemovePlaylistSwitch(brw.selectedRow);
				}
				break;
			case VK_UP:
				if (brw.selectedRow > 0) {
					brw.selectedRow--;
					brw.showSelectedPlaylist();
					brw.repaint();
				}
				break;
			case VK_DOWN:
				if (brw.selectedRow < brw.rows.length - 1) {
					brw.selectedRow++;
					brw.showSelectedPlaylist();
					brw.repaint();
				}
				break;
			case VK_HOME:
				brw.selectedRow = 0;
				brw.showSelectedPlaylist();
				brw.repaint();
				break;
			case VK_END:
				brw.selectedRow = brw.rows.length - 1;
				brw.showSelectedPlaylist();
				brw.repaint();
				break;
			}
		} else if (mask == KMask.ctrl) {
			if (vkey == 48) { // CTRL+0
				if (ppt.extra_font_size > 0) {
					ppt.extra_font_size = 0;
					window.SetProperty("SMOOTH.EXTRA.FONT.SIZE", ppt.extra_font_size);
					get_font();
					get_metrics();
					get_images();
					brw.repaint();
				}
			} else if (vkey == 84) { // CTRL+T
				ppt.showHeaderBar = !ppt.showHeaderBar;
				window.SetProperty("SMOOTH.SHOW.TOP.BAR", ppt.showHeaderBar);
				get_metrics();
				brw.repaint();
			}
		}
	}
}

function on_key_up(vkey) {
	cScrollBar.timerCounter = -1;

	if (cScrollBar.timerID) {
		window.ClearTimeout(cScrollBar.timerID);
		cScrollBar.timerID = false;
	}

	brw.repaint();
}

function on_mouse_lbtn_down(x, y) {
	brw.on_mouse("lbtn_down", x, y);
}

function on_mouse_lbtn_up(x, y) {
	brw.on_mouse("lbtn_up", x, y);
}

function on_mouse_lbtn_dblclk(x, y, mask) {
	brw.on_mouse("lbtn_dblclk", x, y);
}

function on_mouse_rbtn_up(x, y) {
	brw.on_mouse("rbtn_up", x, y);
	return true;
}

function on_mouse_move(x, y) {
	if (m_x == x && m_y == y)
		return;

	m_x = x;
	m_y = y;

	brw.on_mouse("move", x, y);
}

function on_mouse_wheel(step) {
	if (utils.IsKeyPressed(VK_CONTROL)) {
		brw.inputboxID = -1;
		update_extra_font_size(step);
	} else {
		scroll -= step * ppt.rowHeight * ppt.rowScrollStep;
		scroll = check_scroll(scroll);
		brw.on_mouse("wheel", m_x, m_y, step);
	}
}

function on_paint(gr) {
	brw.draw(gr);
}

function on_playback_new_track() {
	setWallpaperImg();

	if (ppt.enableDynamicColours) {
		on_colours_changed();
	}

	brw.repaint();
}

function on_playback_stop(reason) {
	if (reason != 2) {
		setWallpaperImg();

		if (ppt.enableDynamicColours) {
			on_colours_changed();
		}
	}
	brw.repaint();
}

function on_playlist_items_added(playlistIndex) {
	brw.rows[playlistIndex].count = plman.GetPlaylistItemCount(playlistIndex);
	brw.repaint();
}

function on_playlist_items_removed(playlistIndex) {
	brw.rows[playlistIndex].count = plman.GetPlaylistItemCount(playlistIndex);
	brw.repaint();
}

function on_playlist_switch() {
	g_active_playlist = plman.ActivePlaylist;
	brw.selectedRow = g_active_playlist;
	brw.showSelectedPlaylist();
	brw.repaint();
}

function on_playlists_changed() {
	g_active_playlist = plman.ActivePlaylist;
	brw.populate();
}

function on_stream_album_art_change() {
	if (ppt.wallpapermode == 1) {
		setWallpaperImg();
	}

	if (ppt.enableDynamicColours) {
		on_colours_changed();
	}

	brw.repaint();
}

function oBrowser() {
	this.repaint = function () {
		need_repaint = true;
	}

	this.setSize = function () {
		this.x = 0;
		this.y = ppt.showHeaderBar ? ppt.headerBarHeight : 0;
		this.w = ww - cScrollBar.width;
		this.h = wh - this.y;
		this.totalRows = Math.ceil(this.h / ppt.rowHeight);
		this.totalRowsVis = Math.floor(this.h / ppt.rowHeight);

		if (this.inputboxID > -1) {
			var rh = ppt.rowHeight - 10;
			var tw = this.w - rh - 10;
			if (this.inputbox) {
				this.inputbox.setSize(tw, rh);
			}
		}

		this.scrollbar.setSize();

		scroll = Math.round(scroll / ppt.rowHeight) * ppt.rowHeight;
		scroll = check_scroll(scroll);
		scroll_ = scroll;

		this.scrollbar.updateScrollbar();
	}

	this.getlimits = function () {
		if (this.rows.length <= this.totalRowsVis) {
			var start_ = 0;
			var end_ = this.rows.length - 1;
		} else {
			if (scroll_ < 0)
				scroll_ = scroll;
			var start_ = Math.round(scroll_ / ppt.rowHeight + 0.4);
			var end_ = start_ + this.totalRows;
			start_ = start_ > 0 ? start_ - 1 : start_;
			if (start_ < 0)
				start_ = 0;
			if (end_ >= this.rows.length)
				end_ = this.rows.length - 1;
		}
		g_start_ = start_;
		g_end_ = end_;
	}

	this.populate = function () {
		var count = plman.PlaylistCount;

		this.boxText = count + " playlist";

		if (count != 1) {
			this.boxText += "s";
		}

		this.rows = [];

		for (var i = 0; i < count; i++) {
			var name = plman.GetPlaylistName(i);
			var item_count = plman.GetPlaylistItemCount(i);
			this.rows.push(new oPlaylist(name, item_count));
		}

		this.scrollbar.updateScrollbar();
		this.repaint();
	}

	this.showSelectedPlaylist = function () {
		var offset = ppt.rowHeight * this.selectedRow;
		if (offset < scroll || offset + ppt.rowHeight > scroll + this.h) {
			scroll = (this.selectedRow - Math.floor(this.totalRowsVis / 2)) * ppt.rowHeight;
			scroll = check_scroll(scroll);
			this.scrollbar.updateScrollbar();
		}
	}

	this.draw = function (gr) {
		if (this.rows.length != plman.PlaylistCount) {
			this.populate();
		}

		this.getlimits();

		drawBackground(gr)
		draw_header_bar(gr, this.boxText, this.x, this.y, this.w, this.h);

		if (this.rows.length > 0) {
			gr.PushLayer(this.x, this.y, this.w, this.h);

			var ax = 0;
			var ay = 0;
			var aw = this.w;
			var ah = ppt.rowHeight;

			for (var i = g_start_; i <= g_end_; i++) {
				ay = Math.floor(this.y + (i * ah) - scroll_);
				var normal_text = g_colour_text;

				if (i % 2 != 0) {
					gr.FillRectangle(ax, ay, aw, ah, setAlpha(g_colour_text, 8));
				}

				if (i == g_active_playlist) {
					drawSelectedRectangle(gr, ax, ay, aw, ah);
					normal_text = g_colour_selected_text;
				} else if (i == this.selectedRow) {
					gr.DrawRectangle(ax + 1, ay + 1, aw - 2, ah - 2, 2.0, g_colour_selection);
				}

				if (cPlaylistManager.drag_target_id == i) {
					if (cPlaylistManager.drag_target_id > cPlaylistManager.drag_source_id) {
						gr.DrawRectangle(ax, ay + ppt.rowHeight - 2, aw - 1, 1, 2.0, g_colour_selection);
					} else if (cPlaylistManager.drag_target_id < cPlaylistManager.drag_source_id) {
						gr.DrawRectangle(ax, ay + 1, aw - 1, 1, 2.0, g_colour_selection);
					}
				}

				if (i == g_drag_drop_target_id && PlaylistCanAddItems(i)) {
					gr.DrawRectangle(ax + 1, ay + 1, aw - 2, ah - 2, 2.0, g_colour_text & 0xa0ffffff);
				}

				if (plman.IsAutoPlaylist(i)) {
					gr.WriteTextSimple(chars.autoplaylist, g_font_fluent_20, normal_text, ax + scale(5), ay, ah, ah, 0, 2);
				} else if (plman.IsPlaylistLocked(i)) {
					gr.WriteTextSimple(chars.lock, g_font_fluent_20, normal_text, ax + scale(5), ay, ah, ah, 0, 2);
				} else {
					gr.WriteTextSimple(chars.list, g_font_fluent_20, normal_text, ax + scale(6), ay, ah, ah, 0, 2);
				}

				if (this.inputboxID == i) {
					this.inputbox.draw(gr, ah, ay + 5);
				} else {
					gr.WriteTextSimple(this.rows[i].name, g_font, normal_text, ah * 1.2, ay, aw - (ah * 2.5), ah, 0, 2, 1, 1);
					gr.WriteTextSimple(this.rows[i].count, g_font, normal_text, ah, ay, aw - ah - 5, ah, 1, 2, 1, 1);
				}
			}

			gr.PopLayer();
		}

		this.scrollbar.draw(gr);
	}

	this.on_mouse = function (event, x, y) {
		var activeRow = -1;
		var hover = x > this.x && x < this.x + this.w && y > this.y && y < this.y + this.h;

		if (hover) {
			var tmp = Math.ceil((y + scroll_ - this.y) / ppt.rowHeight - 1);
			if (tmp < this.rows.length) {
				activeRow = tmp;
			}
		}

		switch (event) {
		case "drag_over":
			if (activeRow > -1) {
				g_drag_drop_target_id = activeRow;
			}
			break;
		case "lbtn_dblclk":
			if (activeRow > -1 && g_active_playlist != activeRow) {
				this.inputboxID = -1;
				plman.ActivePlaylist = activeRow;
			}
			break;
		case "lbtn_down":
			this.selectedRow = activeRow;
			if (activeRow > -1) {
				if (activeRow == this.inputboxID) {
					this.inputbox.check("lbtn_down", x, y);
				} else {
					this.inputboxID = -1;
					cPlaylistManager.drag_clicked = true;
					cPlaylistManager.drag_source_id = this.selectedRow;
				}
			} else {
				this.inputboxID = -1;
			}
			break;
		case "lbtn_up":
			if (this.inputboxID > -1) {
				this.inputbox.check("lbtn_up", x, y);
			} else if (cPlaylistManager.drag_target_id > -1 && cPlaylistManager.drag_target_id != cPlaylistManager.drag_source_id) {
				plman.MovePlaylist(cPlaylistManager.drag_source_id, cPlaylistManager.drag_target_id);
				this.selectedRow = cPlaylistManager.drag_target_id;
			}

			if (timers.movePlaylist) {
				window.ClearInterval(timers.movePlaylist);
				timers.movePlaylist = false;
			}

			if (cPlaylistManager.drag_moved)
				window.SetCursor(IDC_ARROW);

			cPlaylistManager.drag_clicked = false;
			cPlaylistManager.drag_moved = false;
			cPlaylistManager.drag_source_id = -1;
			cPlaylistManager.drag_target_id = -1;
			break;
		case "move":
			if (this.inputboxID > -1) {
				this.inputbox.check("move", x, y);
			} else {
				if (cPlaylistManager.drag_clicked) {
					cPlaylistManager.drag_moved = true;
				}
				if (cPlaylistManager.drag_moved) {
					window.SetCursor(IDC_HELP);
					if (activeRow > -1) {
						if (timers.movePlaylist) {
							window.ClearInterval(timers.movePlaylist);
							timers.movePlaylist = false;
						}
						if (activeRow != cPlaylistManager.drag_source_id) {
							cPlaylistManager.drag_target_id = activeRow;
						} else {
							cPlaylistManager.drag_target_id = -1;
						}
					} else {
						if (y < this.y) {
							if (!timers.movePlaylist) {
								timers.movePlaylist = window.SetInterval(function () {
									scroll -= ppt.rowHeight;
									scroll = check_scroll(scroll);
									cPlaylistManager.drag_target_id = cPlaylistManager.drag_target_id > 0 ? cPlaylistManager.drag_target_id - 1 : 0;
								}, 100);
							}
						} else if (y > this.y + this.h) {
							if (!timers.movePlaylist) {
								timers.movePlaylist = window.SetInterval((function () {
									scroll += ppt.rowHeight;
									scroll = check_scroll(scroll);
									cPlaylistManager.drag_target_id = cPlaylistManager.drag_target_id < this.rows.length - 1 ? cPlaylistManager.drag_target_id + 1 : this.rows.length - 1;
								}).bind(this), 100);
							}
						}
					}
				}
			}
			break;
		case "rbtn_up":
			this.selectedRow = activeRow;
			this.repaint();
			if (this.inputboxID > -1) {
				if (this.inputbox.hover) {
					this.inputbox.check("rbtn_up", x, y);
				}
			} else {
				if (hover) {
					this.context_menu(x, y, activeRow);
				} else {
					this.settings_menu(x, y);
				}
			}
			break;
		}

		if (cScrollBar.visible) {
			this.scrollbar.on_mouse(event, x, y);
		}

		if (event != "move") {
			this.repaint();
		}
	}

	this.rename_playlist = function (p) {
		var rh = ppt.rowHeight - 10;
		var tw = this.w - rh - 100;
		this.inputbox = new oInputbox(tw, rh, false, plman.GetPlaylistName(p), "", "renamePlaylist()");
		this.inputboxID = p;
		this.inputbox.on_focus(true);
		this.inputbox.edit = true;
		this.inputbox.Cpos = this.inputbox.text.length;
		this.inputbox.anchor = this.inputbox.Cpos;
		this.inputbox.SelBegin = this.inputbox.Cpos;
		this.inputbox.SelEnd = this.inputbox.Cpos;
		if (!cInputbox.timer_cursor) {
			this.inputbox.resetCursorTimer();
		}
		this.inputbox.dblclk = true;
		this.inputbox.SelBegin = 0;
		this.inputbox.SelEnd = this.inputbox.text.length;
		this.inputbox.text_selected = this.inputbox.text;
		this.inputbox.select = true;
		this.repaint();
	}

	this.context_menu = function (x, y, id) {
		var menu = window.CreatePopupMenu();
		var restore_popup = window.CreatePopupMenu();
		var context_popup = window.CreatePopupMenu();
		var context = fb.CreateContextMenuManager();

		var count = plman.PlaylistCount;
		var recycler_count = plman.RecyclerCount;
		var history = [];

		if (id > -1) {
			var lock_name = plman.GetPlaylistLockName(id);

			menu.AppendMenuItem(EnableMenuIf(PlaylistCanRename(id)), 1, "Rename this playlist\tF2");
			menu.AppendMenuItem(EnableMenuIf(PlaylistCanRemove(id)), 2, "Remove this playlist\tDel");
			menu.AppendMenuSeparator();
			if (plman.IsAutoPlaylist(id)) {
				menu.AppendMenuItem(MF_STRING, 4, lock_name + " properties");
			} else {
				var is_locked = plman.IsPlaylistLocked(id);
				var is_mine = lock_name == "foo_javascript_panel";

				menu.AppendMenuItem(EnableMenuIf(is_mine || !is_locked), 6, "Edit playlist lock...");
				menu.AppendMenuItem(EnableMenuIf(is_mine), 7, "Remove playlist lock");
			}
			var playlist_items = plman.GetPlaylistItems(id);
			if (playlist_items.Count > 0) {
				menu.AppendMenuSeparator();
				context.InitContext(playlist_items);
				context.BuildMenu(context_popup, 1000);
				context_popup.AppendTo(menu, MF_STRING, 'Items');
			}
			menu.AppendMenuSeparator();
		}

		menu.AppendMenuItem(MF_STRING, 100, "Create new playlist");
		menu.AppendMenuItem(MF_STRING, 101, "Load playlist...");

		if (recycler_count > 0) {
			menu.AppendMenuSeparator();

			for (var i = 0; i < recycler_count; i++) {
				history.push(i);
				restore_popup.AppendMenuItem(MF_STRING, 10 + i, plman.GetRecyclerName(i));
			}

			restore_popup.AppendMenuSeparator();
			restore_popup.AppendMenuItem(MF_STRING, 103, "Clear history");
			restore_popup.AppendTo(menu, MF_STRING, "Restore");
		}

		menu.AppendMenuSeparator();
		menu.AppendMenuItem(EnableMenuIf(count > 1), 104, "Sort playlists A-Z");
		menu.AppendMenuItem(EnableMenuIf(count > 1), 105, "Sort playlists Z-A");


		var idx = menu.TrackPopupMenu(x, y);

		switch (idx) {
		case 0:
			break;
		case 1:
			this.rename_playlist(id);
			break;
		case 2:
			plman.RemovePlaylistSwitch(id);
			break;
		case 4:
			plman.ShowAutoPlaylistUI(id);
			break;
		case 6:
			plman.ShowPlaylistLockUI(id);
			break;
		case 7:
			plman.RemovePlaylistLock(id);
			break;
		case 100:
			var p = plman.CreatePlaylist();
			plman.ActivePlaylist = p;
			this.rename_playlist(p);
			break;
		case 101:
			fb.LoadPlaylist();
			break;
		case 102:
			var p = plman.CreateAutoPlaylist(plman.PlaylistCount, "", "enter your query here");
			plman.ActivePlaylist = p;
			plman.ShowAutoPlaylistUI(p);
			this.rename_playlist(p);
			break;
		case 103:
			plman.RecyclerPurge(history);
			break;
		case 104:
			plman.SortPlaylistsByName(1);
			break;
		case 105:
			plman.SortPlaylistsByName(-1);
			break;
		default:
			if (idx >= 10 && idx <= 98) {
				plman.RecyclerRestore(idx - 10);
				plman.ActivePlaylist = plman.PlaylistCount - 1;
			} else if (idx >= 1000) {
				context.ExecuteByID(idx - 1000);
			}
			break;
		}

		this.repaint();
		return true;
	}

	this.settings_menu = function (x, y) {
		var menu = window.CreatePopupMenu();
		var sub1 = window.CreatePopupMenu();
		var sub2 = window.CreatePopupMenu();

		menu.AppendMenuItem(CheckMenuIf(ppt.showHeaderBar), 1, "Header Bar");
		menu.AppendMenuSeparator();

		var colour_flag = EnableMenuIf(ppt.enableCustomColours);
		sub1.AppendMenuItem(CheckMenuIf(ppt.enableDynamicColours), 2, "Enable Dynamic");
		sub1.AppendMenuItem(CheckMenuIf(ppt.enableCustomColours), 3, "Enable Custom");
		sub1.AppendMenuSeparator();
		sub1.AppendMenuItem(colour_flag, 4, "Text");
		sub1.AppendMenuItem(colour_flag, 5, "Background");
		sub1.AppendMenuItem(colour_flag, 6, "Selected background");
		sub1.AppendTo(menu, MF_STRING, "Colours");
		menu.AppendMenuSeparator();

		sub2.AppendMenuItem(MF_STRING, 10, "None");
		sub2.AppendMenuItem(MF_STRING, 11, "Front cover of playing track");
		sub2.AppendMenuItem(MF_STRING, 12, "Custom image");
		sub2.CheckMenuRadioItem(10, 12, ppt.wallpapermode + 10);
		sub2.AppendMenuSeparator();
		sub2.AppendMenuItem(EnableMenuIf(ppt.wallpapermode == 2), 13, "Custom image path...");
		sub2.AppendMenuSeparator();

		sub2.AppendMenuItem(GetMenuFlags(ppt.wallpapermode != 0, ppt.wallpaperblurred), 14, "Blur");
		sub2.AppendTo(menu, MF_STRING, "Background Wallpaper");

		menu.AppendMenuSeparator();
		menu.AppendMenuItem(MF_STRING, 50, "Configure...");

		var idx = menu.TrackPopupMenu(x, y);

		switch (idx) {
		case 1:
			ppt.showHeaderBar = !ppt.showHeaderBar;
			window.SetProperty("SMOOTH.SHOW.TOP.BAR", ppt.showHeaderBar);
			get_metrics();
			this.repaint();
			break;
		case 2:
			ppt.enableDynamicColours = !ppt.enableDynamicColours;
			window.SetProperty("SMOOTH.DYNAMIC.COLOURS.ENABLED", ppt.enableDynamicColours);
			on_colours_changed();
			break
		case 3:
			ppt.enableCustomColours = !ppt.enableCustomColours;
			window.SetProperty("SMOOTH.CUSTOM.COLOURS.ENABLED", ppt.enableCustomColours);
			on_colours_changed();
			break;
		case 4:
			g_colour_text = utils.ColourPicker(g_colour_text);
			window.SetProperty("SMOOTH.COLOUR.TEXT", g_colour_text);
			on_colours_changed();
			break;
		case 5:
			g_colour_background = utils.ColourPicker(g_colour_background);
			window.SetProperty("SMOOTH.COLOUR.BACKGROUND.NORMAL", g_colour_background);
			on_colours_changed();
			break;
		case 6:
			g_colour_selection = utils.ColourPicker(g_colour_selection);
			window.SetProperty("SMOOTH.COLOUR.BACKGROUND.SELECTED", g_colour_selection);
			on_colours_changed();
			break;
		case 10:
		case 11:
		case 12:
			ppt.wallpapermode = idx - 10;
			window.SetProperty("SMOOTH.WALLPAPER.MODE2", ppt.wallpapermode);
			setWallpaperImg();
			this.repaint();
			break;
		case 13:
			var tmp = utils.InputBox("Enter the full path to an image.", window.Name, ppt.wallpaperpath);
			if (tmp != ppt.wallpaperpath) {
				ppt.wallpaperpath = tmp;
				window.SetProperty("SMOOTH.WALLPAPER.PATH", ppt.wallpaperpath);
				setWallpaperImg();
				this.repaint();
			}
			break;
		case 14:
			ppt.wallpaperblurred = !ppt.wallpaperblurred;
			window.SetProperty("SMOOTH.WALLPAPER.BLURRED", ppt.wallpaperblurred);
			setWallpaperImg();
			this.repaint();
			break;
		case 50:
			window.ShowConfigure();
			break;
		}
		return true;
	}

	window.SetInterval(function () {
		if (!window.IsVisible) {
			need_repaint = true;
			return;
		}

		scroll = check_scroll(scroll);
		if (Math.abs(scroll - scroll_) >= 1) {
			scroll_ += (scroll - scroll_) / ppt.scrollSmoothness;
			need_repaint = true;
			isScrolling = true;
			if (scroll_prev != scroll)
				brw.scrollbar.updateScrollbar();
		} else {
			if (isScrolling) {
				if (scroll_ < 1)
					scroll_ = 0;
				isScrolling = false;
				need_repaint = true;
			}
		}

		if (need_repaint) {
			need_repaint = false;
			window.Repaint();
		}

		scroll_prev = scroll;

	}, ppt.refreshRate);

	window.SetTimeout(function () {
		brw.populate();
		brw.showSelectedPlaylist();
	}, 100);

	this.rows = [];
	this.scrollbar = new oScrollbar();
	this.inputbox = null;
	this.inputboxID = -1;
	this.selectedRow = g_active_playlist;
	this.boxText = '';
}

function oPlaylist(name, count) {
	this.name = name;
	this.count = count;
}

function get_metrics() {
	if (ppt.showHeaderBar) {
		ppt.headerBarHeight = scale(ppt.defaultHeaderBarHeight);
	} else {
		ppt.headerBarHeight = 0;
	}

	ppt.rowHeight = scale(ppt.defaultRowHeight);
	cScrollBar.width = scale(cScrollBar.defaultWidth);
	cScrollBar.minCursorHeight = scale(cScrollBar.defaultMinCursorHeight);

	brw.setSize();
}

function check_scroll(scroll___) {
	if (scroll___ < 0)
		scroll___ = 0;
	var g1 = brw.h - (brw.totalRowsVis * ppt.rowHeight);
	var end_limit = (brw.rows.length * ppt.rowHeight) - (brw.totalRowsVis * ppt.rowHeight) - g1;

	if (scroll___ != 0 && scroll___ > end_limit) {
		scroll___ = end_limit;
	}

	return scroll___;
}

function renamePlaylist() {
	var text = brw.inputbox.text.trim();

	if (brw.inputboxID > -1 && text.length) {
		plman.RenamePlaylist(brw.inputboxID, text);
		brw.inputboxID = -1;
	}
}

ppt.defaultRowHeight = 32;
ppt.rowHeight = ppt.defaultRowHeight;

var cPlaylistManager = {
	drag_clicked: false,
	drag_source_id: -1,
	drag_target_id: -1,
}

var timers = {
	movePlaylist: false,
};

var g_drag_drop_target_id = -1;
var brw = new oBrowser();

get_metrics();
setWallpaperImg();
