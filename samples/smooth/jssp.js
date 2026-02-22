function on_char(code) {
	if (ppt.showHeaderBar && brw.inputbox.edit) {
		brw.inputbox.on_char(code);
	}
}

function on_drag_drop(action, x, y, mask) {
	if (x > brw.scrollbar.x || y < brw.y) {
		action.Effect = 0;
	} else {
		if (PlaylistCanAddItems(g_active_playlist)) {
			plman.ClearPlaylistSelection(g_active_playlist);
			plman.UndoBackup(g_active_playlist);
			action.Playlist = g_active_playlist;
			action.Base = plman.GetPlaylistItemCount(g_active_playlist);
			action.ToSelect = true;
			action.Effect = 1;
		} else if (g_active_playlist == -1) {
			action.Playlist = plman.CreatePlaylist(plman.PlaylistCount, "Dropped Items");
			action.Base = 0;
			action.ToSelect = true;
			action.Effect = 1;
		} else {
			action.Effect = 0;
		}
	}
}

function on_drag_over(action, x, y, mask) {
	if (x > brw.scrollbar.x || y < brw.y) {
		action.Effect = 0;
	} else {
		if (g_active_playlist == -1 || PlaylistCanAddItems(g_active_playlist)) {
			action.Effect = 1;
		} else {
			action.Effect = 0;
		}
	}
}

function on_focus(is_focused) {
	if (is_focused) {
		plman.SetActivePlaylistContext();
		window.SetPlaylistSelectionTracking();
	} else {
		brw.repaint();
	}
}

function on_item_focus_change(playlist, from, to) {
	g_focus_id = to;

	if (playlist == g_active_playlist) {
		g_focus_row = brw.getOffsetFocusItem(g_focus_id);
		if (g_focus_row < scroll / ppt.rowHeight || g_focus_row > scroll / ppt.rowHeight + brw.totalRowsVis - 0.1) {
			var old = scroll;
			scroll = (g_focus_row - Math.floor(brw.totalRowsVis / 2)) * ppt.rowHeight;
			scroll = check_scroll(scroll);
			if (Math.abs(scroll - scroll_) > ppt.rowHeight * 5) {
				if (scroll_ > scroll) {
					scroll_ = scroll + ppt.rowHeight * 5;
				} else {
					scroll_ = scroll - ppt.rowHeight * 5;
				}
			}
			brw.scrollbar.updateScrollbar();
		}

		if (!isScrolling)
			brw.repaint();
	}
}

function on_key_down(vkey) {
	if (ppt.showHeaderBar) {
		brw.inputbox.on_key_down(vkey);
	}

	var mask = GetKeyboardMask();

	if (mask == KMask.none) {
		switch (vkey) {
		case VK_F3:
			if (g_search_indexes.length > 1) {
				g_search_index++;
				if (g_search_index == g_search_indexes.length) {
					g_search_index = 0;
				}
				plman.SetPlaylistFocusItem(g_active_playlist, g_search_indexes[g_search_index]);
			}
			break;
		case VK_UP:
			if (brw.rows.length > 0 && !brw.keypressed && !cScrollBar.timerID) {
				brw.keypressed = true;

				vk_up();
				if (!cScrollBar.timerID) {
					cScrollBar.timerID = window.SetTimeout(function () {
						cScrollBar.timerID = window.SetInterval(vk_up, 100);
					}, 400);
				}
			}
			break;
		case VK_DOWN:
			if (brw.rows.length > 0 && !brw.keypressed && !cScrollBar.timerID) {
				brw.keypressed = true;

				vk_down();
				if (!cScrollBar.timerID) {
					cScrollBar.timerID = window.SetTimeout(function () {
						cScrollBar.timerID = window.SetInterval(vk_down, 100);
					}, 400);
				}
			}
			break;
		case VK_RETURN:
			play(g_active_playlist, g_focus_id);
			break;
		case VK_END:
			if (brw.rows.length > 0) {
				var new_focus_id = brw.rows[brw.rows.length - 1].playlistTrackId;
				plman.SetPlaylistFocusItem(g_active_playlist, new_focus_id);
				plman.ClearPlaylistSelection(g_active_playlist);
				plman.SetPlaylistSelectionSingle(g_active_playlist, new_focus_id, true);
			}
			break;
		case VK_HOME:
			if (brw.rows.length > 0) {
				var new_focus_id = brw.rows[0].playlistTrackId;
				plman.ClearPlaylistSelection(g_active_playlist);
				plman.SetPlaylistSelectionSingle(g_active_playlist, new_focus_id, true);
				plman.SetPlaylistFocusItem(g_active_playlist, new_focus_id);
			}
			break;
		case VK_DELETE:
			if (PlaylistCanRemoveItems(g_active_playlist)) {
				plman.UndoBackup(g_active_playlist);
				plman.RemovePlaylistSelection(g_active_playlist);
			}
			break;
		}
	} else if (mask == KMask.shift) {
		switch (vkey) {
		case VK_SHIFT:
			brw.SHIFT_count = 0;
			break;
		case VK_UP:
			if (brw.SHIFT_count == 0) {
				if (brw.SHIFT_start_id == null) {
					brw.SHIFT_start_id = g_focus_id;
				}
				plman.ClearPlaylistSelection(g_active_playlist);
				plman.SetPlaylistSelectionSingle(g_active_playlist, g_focus_id, true);
				if (g_focus_id > 0) {
					brw.SHIFT_count--;
					g_focus_id--;
					plman.SetPlaylistSelectionSingle(g_active_playlist, g_focus_id, true);
					plman.SetPlaylistFocusItem(g_active_playlist, g_focus_id);
				}
			} else if (brw.SHIFT_count < 0) {
				if (g_focus_id > 0) {
					brw.SHIFT_count--;
					g_focus_id--;
					plman.SetPlaylistSelectionSingle(g_active_playlist, g_focus_id, true);
					plman.SetPlaylistFocusItem(g_active_playlist, g_focus_id);
				}
			} else {
				plman.SetPlaylistSelectionSingle(g_active_playlist, g_focus_id, false);
				brw.SHIFT_count--;
				g_focus_id--;
				plman.SetPlaylistFocusItem(g_active_playlist, g_focus_id);
			}
			break;
		case VK_DOWN:
			if (brw.SHIFT_count == 0) {
				if (brw.SHIFT_start_id == null) {
					brw.SHIFT_start_id = g_focus_id;
				}
				plman.ClearPlaylistSelection(g_active_playlist);
				plman.SetPlaylistSelectionSingle(g_active_playlist, g_focus_id, true);
				if (g_focus_id < brw.list.Count - 1) {
					brw.SHIFT_count++;
					g_focus_id++;
					plman.SetPlaylistSelectionSingle(g_active_playlist, g_focus_id, true);
					plman.SetPlaylistFocusItem(g_active_playlist, g_focus_id);
				}
			} else if (brw.SHIFT_count > 0) {
				if (g_focus_id < brw.list.Count - 1) {
					brw.SHIFT_count++;
					g_focus_id++;
					plman.SetPlaylistSelectionSingle(g_active_playlist, g_focus_id, true);
					plman.SetPlaylistFocusItem(g_active_playlist, g_focus_id);
				}
			} else {
				plman.SetPlaylistSelectionSingle(g_active_playlist, g_focus_id, false);
				brw.SHIFT_count++;
				g_focus_id++;
				plman.SetPlaylistFocusItem(g_active_playlist, g_focus_id);
			}
			break;
		}
	} else if (mask == KMask.ctrl) {
		switch (vkey) {
		case 48: // CTRL+0
			if (ppt.extra_font_size > 0) {
				ppt.extra_font_size = 0;
				window.SetProperty("SMOOTH.EXTRA.FONT.SIZE", ppt.extra_font_size);
				get_font();
				get_metrics();
				get_images();
				brw.repaint();
			}
			break;
		case 65: // CTRL+A
			fb.RunMainMenuCommand("Edit/Select all");
			brw.repaint();
			break;
		case 67: // CTRL+C
			var items = plman.GetPlaylistSelectedItems(g_active_playlist);
			items.CopyToClipboard();
			break;
		case 84: // CTRL+T
			ppt.showHeaderBar = !ppt.showHeaderBar;
			window.SetProperty("SMOOTH.SHOW.TOP.BAR", ppt.showHeaderBar);
			get_metrics();
			brw.repaint();
			break;
		case 86: // CTRL+V
			if (PlaylistCanAddItems(g_active_playlist) && fb.CheckClipboardContents()) {
				var clipboard_contents = fb.GetClipboardContents();
				plman.UndoBackup(g_active_playlist);
				plman.InsertPlaylistItems(g_active_playlist, plman.GetPlaylistItemCount(g_active_playlist), clipboard_contents);
			}
			break;
		case 88: // CTRL+X
			if (PlaylistCanRemoveItems(g_active_playlist)) {
				var items = plman.GetPlaylistSelectedItems(g_active_playlist);
				if (items.CopyToClipboard()) {
					plman.UndoBackup(g_active_playlist);
					plman.RemovePlaylistSelection(g_active_playlist);
				}
			}
			break;
		case 89: // CTRL+Y
			fb.RunMainMenuCommand("Edit/Redo");
			break;
		case 90: // CTRL+Z
			fb.RunMainMenuCommand("Edit/Undo");
			break;
		}
	}
}

function on_key_up(vkey) {
	brw.keypressed = false;
	kill_scrollbar_timer()
	if (vkey == VK_SHIFT) {
		brw.SHIFT_start_id = null;
		brw.SHIFT_count = 0;
	}
	brw.repaint();
}

function on_mouse_lbtn_dblclk(x, y, mask) {
	brw.on_mouse("lbtn_dblclk", x, y);
}

function on_mouse_lbtn_down(x, y) {
	brw.on_mouse("lbtn_down", x, y);
}

function on_mouse_lbtn_up(x, y) {
	brw.on_mouse("lbtn_up", x, y);
}

function on_mouse_move(x, y) {
	if (m_x == x && m_y == y)
		return;

	m_x = x;
	m_y = y;

	brw.on_mouse("move", x, y);
}

function on_mouse_rbtn_up(x, y) {
	brw.on_mouse("rbtn_up", x, y);
	return true;
}

function on_mouse_wheel(step) {
	if (utils.IsKeyPressed(VK_CONTROL)) {
		update_extra_font_size(step);
	} else {
		scroll -= step * ppt.rowHeight * ppt.rowScrollStep;
		scroll = check_scroll(scroll);
		brw.on_mouse("wheel", m_x, m_y, step);
	}
}

function on_paint(gr) {
	brw.draw(gr);

	if (ppt.showHeaderBar && brw.list.Count > 0) {
		var size = ppt.headerBarHeight;

		if (brw.inputbox.text.length > 0) {
			brw.reset_bt.draw(gr, 0, 0);
		} else {
			gr.WriteTextSimple(chars.search, g_font_fluent_20, g_colour_text, 0, -2, size, size, 2, 2);
		}

		brw.inputbox.draw(gr, size + 4, 2);
	}
}

function on_playback_new_track() {
	g_time = tfo.time.Eval();
	setWallpaperImg();

	if (ppt.enableDynamicColours) {
		on_colours_changed();
	}

	brw.repaint();
}

function on_playback_pause(state) {
	if (brw.nowplaying_y + ppt.rowHeight > brw.y && brw.nowplaying_y < brw.y + brw.h) {
		brw.repaint();
	}
}

function on_playback_stop(reason) {
	g_time = "";

	if (reason != 2) {
		setWallpaperImg();

		if (ppt.enableDynamicColours) {
			on_colours_changed();
		}
	}

	brw.repaint();
}

function on_playback_time() {
	g_seconds++;
	g_time = tfo.time.Eval();

	if (brw.nowplaying_y + ppt.rowHeight > brw.y && brw.nowplaying_y < brw.y + brw.h) {
		brw.repaint();
	}
}

function on_playlist_item_ensure_visible(playlist, index) {
	on_item_focus_change(playlist, 0, index);
}

function on_playlist_items_added(playlistIndex) {
	if (playlistIndex == g_active_playlist) {
		g_focus_id = getFocusId();
		brw.populate();
	}
}

function on_playlist_items_changed(playlistIndex) {
	if (playlistIndex == g_active_playlist) {
		brw.populate();
	}
}

function on_playlist_items_removed(playlistIndex) {
	if (playlistIndex == g_active_playlist) {
		g_focus_id = getFocusId();
		brw.populate();
	}
}

function on_playlist_items_reordered(playlistIndex) {
	if (playlistIndex == g_active_playlist) {
		g_focus_id = getFocusId();
		brw.populate();
	}
}

function on_playlist_items_replaced(playlistIndex) {
	if (playlistIndex == g_active_playlist) {
		brw.populate();
	}
}

function on_playlist_items_selection_change() {
	brw.repaint();
}

function on_playlist_switch() {
	g_active_playlist = plman.ActivePlaylist;
	g_focus_id = getFocusId();
	brw.populate();
}

function on_playlists_changed() {
	g_active_playlist = plman.ActivePlaylist;
	brw.update_playlist_info();
	brw.repaint();
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

		this.reset_bt = new button(images.reset, images.reset, images.reset);
		this.inputbox.setSize(ww * 0.4, scale(20));
		this.scrollbar.setSize();

		scroll = Math.round(scroll / ppt.rowHeight) * ppt.rowHeight;
		scroll = check_scroll(scroll);
		scroll_ = scroll;

		this.scrollbar.updateScrollbar();
	}

	this.setList = function () {
		this.rows = [];
		var r = 0;

		for (var i = 0; i < this.groups.length; i++) {
			var s = this.groups[i].start;

			if (ppt.showGroupHeaders) {
				this.groups[i].rowId = r;
				for (var k = 0; k < ppt.groupHeaderRowsNumber; k++) {
					this.rows[r] = new Object();
					this.rows[r].type = k + 1;
					this.rows[r].metadb = this.groups[i].metadb;
					this.rows[r].albumId = i;
					this.rows[r].albumTrackId = 0;
					this.rows[r].playlistTrackId = s;
					this.rows[r].groupkey = this.groups[i].groupkey;
					r++;
				}
			}

			var m = this.groups[i].count;
			for (var j = 0; j < m; j++) {
				this.rows[r] = new Object();
				this.rows[r].type = 0;
				this.rows[r].metadb = this.list.GetItem(s + j);
				this.rows[r].track_tf = this.track_tf_arr[s + j];
				this.rows[r].albumId = i;
				this.rows[r].albumTrackId = j;
				this.rows[r].playlistTrackId = s + j;
				this.rows[r].groupkey = this.groups[i].groupkey;
				r++;
			}
		}
	}

	this.showFocusedItem = function () {
		g_focus_row = this.getOffsetFocusItem(g_focus_id);
		scroll = (g_focus_row - Math.floor(this.totalRowsVis / 2)) * ppt.rowHeight;
		scroll = check_scroll(scroll);
		this.scrollbar.updateScrollbar();
	}

	this.getAlbumIdfromTrackId = function (value) {
		if (value >= 0) {
			var mediane = 0;
			var deb = 0;
			var fin = this.groups.length - 1;
			while (deb <= fin) {
				mediane = Math.floor((fin + deb) / 2);
				if (value >= this.groups[mediane].start && value < this.groups[mediane].start + this.groups[mediane].count) {
					return mediane;
				} else if (value < this.groups[mediane].start) {
					fin = mediane - 1;
				} else {
					deb = mediane + 1;
				}
			}
		}
		return -1;
	}

	this.getOffsetFocusItem = function (fid) {
		var row_idx = 0;
		if (fid > -1) {
			if (ppt.showGroupHeaders) {
				g_focus_album_id = this.getAlbumIdfromTrackId(fid);
				for (i = 0; i < this.rows.length; i++) {
					if (this.rows[i].type != 0 && this.rows[i].albumId == g_focus_album_id) {
						var albumTrackId = g_focus_id - this.groups[g_focus_album_id].start;
						row_idx = i + ppt.groupHeaderRowsNumber + albumTrackId;
						break;
					}
				}
			} else {
				g_focus_album_id = this.getAlbumIdfromTrackId(fid);
				for (i = 0; i < this.rows.length; i++) {
					if (this.rows[i].type == 0 && this.rows[i].albumId == g_focus_album_id) {
						var albumTrackId = g_focus_id - this.groups[g_focus_album_id].start;
						row_idx = i + albumTrackId;
						break;
					}
				}
			}
		}
		return row_idx;
	}

	this.get_track_tags = function (index) {
		var track_arr = this.rows[index].track_tf.split(" ^^ ");
		var tags = {
			artist : track_arr[0],
			title : track_arr[1],
			tracknumber : track_arr[2],
			length : track_arr[3],
		};
		return tags;
	}

	this.init_groups = function () {
		this.groups = [];
		if (this.list.Count == 0)
			return;

		var arr = tfo.groupkey.EvalWithMetadbs(this.list);
		var previous = "";
		var g = 0, t = 0;

		for (var i = 0; i < this.list.Count; i++) {
			var handle = this.list.GetItem(i);
			var meta = arr[i];
			var current = meta.toLowerCase();
			var cachekey = utils.HashString(handle.Path);

			if (current != previous) {
				if (g > 0) {
					this.groups[g - 1].finalise(t);
					t = 0;
				}
				this.groups.push(new oGroup(g, i, handle, meta, cachekey));
				t++;
				g++;
				previous = current;
			} else {
				t++;
			}
		}

		this.groups[g - 1].finalise(t);
	}

	this.populate = function () {
		this.list.RemoveAll();
		this.list = plman.GetPlaylistItems(g_active_playlist);
		this.track_tf_arr = tfo.track.EvalWithMetadbs(this.list);

		this.init_groups();
		this.setList();
		g_focus_row = this.getOffsetFocusItem(g_focus_id);

		this.update_playlist_info();
		this.scrollbar.updateScrollbar();
		this.repaint();
	}

	this.update_playlist_info = function () {
		this.playlist_info = "";
		if (g_active_playlist > -1) {
			this.playlist_info += plman.GetPlaylistName(g_active_playlist) + ", " + this.list.Count + " track";

			if (this.list.Count != 1) {
				this.playlist_info += "s";
			}

			var duration = this.list.CalcTotalDuration();

			if (duration > 0) {
				this.playlist_info += ", " + utils.FormatDuration(duration);
			}
		}
	}

	this.getlimits = function () {
		if (this.rows.length <= this.totalRowsVis) {
			var start_ = 0;
			var end_ = this.rows.length - 1;
		} else {
			if (scroll_ < 0)
				scroll_ = scroll;
			var start_ = Math.round(scroll_ / ppt.rowHeight + 0.4);
			var end_ = start_ + this.totalRows + (ppt.groupHeaderRowsNumber - 1);
			start_ = start_ > 0 ? start_ - 1 : start_;
			if (start_ < 0)
				start_ = 0;
			if (end_ >= this.rows.length)
				end_ = this.rows.length - 1;
		}

		g_start_ = start_;
		g_end_ = end_;
	}

	this.draw = function (gr) {
		this.getlimits();
		drawBackground(gr);
		draw_header_bar(gr, this.playlist_info, this.x, this.y, this.w, this.h);

		if (this.rows.length > 0) {
			gr.PushLayer(this.x, this.y, this.w, this.h);

			var ax = 0;
			var ay = 0;
			var aw = this.w;
			var ah = ppt.rowHeight;
			var g = 0;

			var loc = plman.GetPlayingItemLocation();

			for (var i = g_start_; i <= g_end_; i++) {
				ay = Math.floor(this.y + (i * ah) - scroll_);
				var normal_text = g_colour_text;
				var fader_txt = setAlpha(normal_text, 180);

				switch (this.rows[i].type) {
				case ppt.groupHeaderRowsNumber:
					ay -= (ppt.groupHeaderRowsNumber - 1) * ah;

					gr.FillRectangle(ax, ay, aw, ah * ppt.groupHeaderRowsNumber, setAlpha(g_colour_text, 8));
					gr.DrawRectangle(ax, ay, aw, ah * ppt.groupHeaderRowsNumber, 1, setAlpha(g_colour_text, 25));

					var id = this.rows[i].albumId;
					var group = this.groups[id];
					var image_height = 0;
					if (ppt.groupHeaderRowsNumber >= 2) {
						image_height = ah * ppt.groupHeaderRowsNumber;
						if (!group.cover_image && !group.image_requested) {
							group.image_requested = true;
							group.cover_image = get_art(this.rows[i].metadb, group.cachekey, AlbumArtId.front);
						}
						drawImage(gr, group.cover_image || (this.rows[i].metadb.Length ? images.noart : images.stream), ax + 1, ay + 1, image_height - 3, image_height - 3, ppt.autoFill, g_colour_text & 0x25ffffff);
					}

					var text_width = aw - image_height - 20;
					if (ppt.groupHeaderRowsNumber == 1) {
						gr.WriteTextSimple(group.album_artist + " - " + group.album, g_font_group1, normal_text, ax + image_height + 5, ay, text_width - group.date.calc_width(g_font_group1), ah, 0, 2, 1, 1);
						gr.WriteTextSimple(group.date, g_font_group1, normal_text, 0, ay, aw - 5, ah, 1, 2, 1, 1);
					} else {
						gr.WriteTextSimple(group.album, g_font_group1, normal_text, ax + image_height + 5, ay, text_width, ah, 0, 2, 1, 1);

						var bottom_y = ay + (g_font_height * 1.5);
						gr.WriteTextSimple(group.album_artist, g_font_group2, fader_txt, ax + image_height + 5, bottom_y, text_width, ah, 0, 2, 1, 1);
						gr.WriteTextSimple(group.date, g_font_group3, fader_txt, ax + image_height + 5, bottom_y + (g_font_height * 1.25), text_width, ah, 0, 2, 1, 1);
					}
					break;
				case 0:
					if (ppt.showGroupHeaders ? this.rows[i].albumTrackId % 2 != 0 : i % 2 != 0) {
						gr.FillRectangle(ax, ay, aw, ah, setAlpha(g_colour_text, 8));
					}

					if (!this.rows[i].tags) {
						this.rows[i].tags = this.get_track_tags(i);
					}

					var playlistTrackId = this.rows[i].playlistTrackId;
					var is_focused = g_focus_id == playlistTrackId;
					var is_playing = loc.PlaylistIndex == g_active_playlist && loc.PlaylistItemIndex == playlistTrackId;
					var is_selected = plman.IsPlaylistItemSelected(g_active_playlist, playlistTrackId);
					var tags = this.rows[i].tags;
					var artist = "", title = "", right_text = "";
					var rw = 0;

					if (is_selected) {
						drawSelectedRectangle(gr, ax, ay, aw, ah);
						normal_text = g_colour_selected_text;
						fader_txt = setAlpha(normal_text, 180);
					}

					if (is_focused) {
						DrawRectangle(gr, ax, ay, aw - 1, ah - 1, fader_txt);
					}

					if (is_playing) {
						var arr = tfo.artist_title.Eval().split(" ^^ ");
						artist = arr[0];
						title = arr[1];
						right_text = g_time;

						this.nowplaying_y = ay;
						if (playback.IsPaused) {
							gr.WriteTextSimple(chars.pause, g_font_fluent_20, normal_text, ax + 5, ay, ah, ah, 2, 2);
						} else {
							gr.WriteTextSimple(chars.play, g_font_fluent_20, g_seconds % 2 == 0 ? normal_text : setAlpha(normal_text, 128), ax + 5, ay, ah, ah, 2, 2);
						}
					} else {
						artist = tags.artist;
						title = tags.title;
						right_text = tags.length;

						gr.WriteTextSimple(tags.tracknumber, g_font, normal_text, ax + 5, ay, ah, ah / 2, 2, 2, 1, 1);
					}

					gr.WriteTextSimple(title, g_font, normal_text, ax + ah + 10, ay, aw - ah - rw - g_time_width - 10, ah / 2, 0, 2, 1, 1);
					gr.WriteTextSimple(artist, g_font, fader_txt, ax + ah + 10, ay + (ah / 2) - 2, aw - ah - rw - g_time_width - 10, ah / 2, 0, 2, 1, 1);
					gr.WriteTextSimple(right_text, g_font, normal_text, ax, ay, aw - 5, ah / 2, 1, 2, 1, 1);
					break;
				}
			}

			gr.PopLayer();
		}

		this.scrollbar.draw(gr);
	}

	this.selectGroupTracks = function (aId) {
		var affectedItems = [];
		var end = this.groups[aId].start + this.groups[aId].count;
		for (var i = this.groups[aId].start; i < end; i++) {
			affectedItems.push(i);
		}
		plman.SetPlaylistSelection(g_active_playlist, affectedItems, true);
	}

	this.on_mouse = function (event, x, y) {
		if (g_active_playlist == -1)
			return;

		this.activeRow = -1
		var shift = utils.IsKeyPressed(VK_SHIFT);
		var ctrl = utils.IsKeyPressed(VK_CONTROL);
		var playlistTrackId = -1;
		var rowType = -1;
		var hover = x > this.x && x < this.x + this.w && y > this.y && y < this.y + this.h;

		if (hover) {
			var tmp = Math.ceil((y + scroll_ - this.y) / ppt.rowHeight - 1);
			if (tmp < this.rows.length && this.rows[tmp]) {
				this.activeRow = tmp;
				playlistTrackId = this.rows[tmp].playlistTrackId;
				rowType = this.rows[tmp].type;
			}
		}

		switch (event) {
		case "lbtn_dblclk":
			if (this.activeRow > -1 && rowType == 0) {
				play(g_active_playlist, playlistTrackId);
			}
			break;
		case "lbtn_down":
			if (y > this.y) {
				clear_search();
				if (this.activeRow > -1) {
					switch (true) {
					case rowType == 0: // ----------------> track row
						if (shift) {
							var affectedItems = [];

							if (this.old_activeRow == -1 || this.activeRow == this.old_activeRow) {
								affectedItems.push(playlistTrackId);
							} else {
								var start = Math.min(this.activeRow, this.old_activeRow);
								var end = Math.max(this.activeRow, this.old_activeRow);

								for (var i = start; i <= end; i++) {
									affectedItems.push(this.rows[i].playlistTrackId);
								}
							}

							plman.ClearPlaylistSelection(g_active_playlist);
							plman.SetPlaylistSelection(g_active_playlist, affectedItems, true);
							plman.SetPlaylistFocusItem(g_active_playlist, playlistTrackId);
						} else {
							this.old_activeRow = this.activeRow;

							if (ctrl) {
								if (plman.IsPlaylistItemSelected(g_active_playlist, playlistTrackId)) {
									plman.SetPlaylistSelectionSingle(g_active_playlist, playlistTrackId, false);
								} else {
									plman.SetPlaylistSelectionSingle(g_active_playlist, playlistTrackId, true);
								}
								plman.SetPlaylistFocusItem(g_active_playlist, playlistTrackId);
							} else if (!plman.IsPlaylistItemSelected(g_active_playlist, playlistTrackId)) {
								plman.ClearPlaylistSelection(g_active_playlist);
								plman.SetPlaylistSelectionSingle(g_active_playlist, playlistTrackId, true);
								plman.SetPlaylistFocusItem(g_active_playlist, playlistTrackId);
							}
						}
						break;
					default: // ----------------> group header row
						if (!ctrl) {
							plman.ClearPlaylistSelection(g_active_playlist);
						}
						this.selectGroupTracks(this.rows[this.activeRow].albumId);
						plman.SetPlaylistFocusItem(g_active_playlist, playlistTrackId);
						break;
					}
				} else if (!shift && !ctrl) {
					plman.ClearPlaylistSelection(g_active_playlist);
				}
			}
			break;
		case "lbtn_up":
			if (shift || ctrl) {
				// do nothing
			} else if (this.activeRow > -1) {
				if (rowType == 0) { // ----------------> track row
					plman.ClearPlaylistSelection(g_active_playlist);
					plman.SetPlaylistSelectionSingle(g_active_playlist, playlistTrackId, true);
					plman.SetPlaylistFocusItem(g_active_playlist, playlistTrackId);
				}
			}
			break;
		case "rbtn_up":
			var is_group_header = false;
			if (hover) {
				clear_search();
				if (this.activeRow > -1) {
					switch (true) {
					case rowType == 0: // ----------------> track row
						if (!plman.IsPlaylistItemSelected(g_active_playlist, playlistTrackId)) {
							plman.ClearPlaylistSelection(g_active_playlist);
							plman.SetPlaylistSelectionSingle(g_active_playlist, playlistTrackId, true);
							plman.SetPlaylistFocusItem(g_active_playlist, playlistTrackId);
						}
						break;
					default: // ----------------> group header row
						if (!plman.IsPlaylistItemSelected(g_active_playlist, playlistTrackId)) {
							plman.ClearPlaylistSelection(g_active_playlist);
							this.selectGroupTracks(this.rows[this.activeRow].albumId);
							plman.SetPlaylistFocusItem(g_active_playlist, playlistTrackId);
						}
						is_group_header = true;
						break;
					}
				} else {
					plman.ClearPlaylistSelection(g_active_playlist);
				}
			}
			if (!this.inputbox.hover) {
				this.context_menu(x, y, is_group_header);
			}
			break;
		}

		if (ppt.showHeaderBar && this.list.Count > 0) {
			this.inputbox.check(event, x, y);

			if (this.inputbox.text.length > 0) {
				if (event == "lbtn_down" || event == "move") {
					this.reset_bt.checkstate(event, x, y);
				} else if (event == "lbtn_up") {
					if (this.reset_bt.checkstate("lbtn_up", x, y) == ButtonStates.hover) {
						this.inputbox.text = "";
						this.inputbox.offset = 0;
						g_sendResponse();
					}
				}
			}
		}

		if (cScrollBar.visible) {
			this.scrollbar.on_mouse(event, x, y);
		}

		if (event != "move") {
			this.repaint();
		}
	}

	this.context_menu = function (x, y, is_group_header) {
		var menu = window.CreatePopupMenu();
		var context = fb.CreateContextMenuManager();
		var selected_items = plman.GetPlaylistSelectedItems(g_active_playlist);

		var sub1 = window.CreatePopupMenu();
		var sub2 = window.CreatePopupMenu();
		var sub3 = window.CreatePopupMenu();
		var sub5 = window.CreatePopupMenu();

		// settings start
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

		sub3.AppendMenuItem(CheckMenuIf(ppt.showGroupHeaders), 20, "Enable");
		sub3.AppendMenuSeparator();
		sub3.AppendMenuItem(MF_GRAYED, 0, "Rows");
		sub3.AppendMenuItem(EnableMenuIf(ppt.showGroupHeaders), 21, "1");
		sub3.AppendMenuItem(EnableMenuIf(ppt.showGroupHeaders), 22, "2");
		sub3.AppendMenuItem(EnableMenuIf(ppt.showGroupHeaders), 23, "3");
		sub3.CheckMenuRadioItem(21, 23, ppt.groupHeaderRowsNumber + 20);
		sub3.AppendMenuSeparator();
		sub3.AppendMenuItem(GetMenuFlags(ppt.showGroupHeaders && ppt.groupHeaderRowsNumber > 1, ppt.autoFill), 24, "Album Art: Auto-fill");
		sub3.AppendMenuItem(MF_STRING, 25, "Clear Album Art cache");
		sub3.AppendTo(menu, MF_STRING, "Group Headers");
		// settings end

		if (x < brw.w && y > brw.y) {
			var remove_flag = EnableMenuIf(PlaylistCanRemoveItems(g_active_playlist));
			var paste_flag = EnableMenuIf(!is_group_header && PlaylistCanAddItems(g_active_playlist) && fb.CheckClipboardContents());

			menu.AppendMenuSeparator();

			if (this.activeRow > -1) {
				menu.AppendMenuItem(remove_flag, 101, "Crop");
				menu.AppendMenuItem(remove_flag, 102, "Remove");
				menu.AppendMenuItem(MF_STRING, 103, "Invert Selection");
				menu.AppendMenuSeparator();
				menu.AppendMenuItem(remove_flag, 104, "Cut");
				menu.AppendMenuItem(MF_STRING, 105, "Copy");
				menu.AppendMenuItem(paste_flag, 106, "Paste");
				menu.AppendMenuSeparator();

				sub5.AppendMenuItem(MF_STRING, 110, "New Playlist");
				if (plman.PlaylistCount > 0) {
					sub5.AppendMenuSeparator();
				}
				for (var i = 0; i < plman.PlaylistCount; i++) {
					sub5.AppendMenuItem(EnableMenuIf(i != g_active_playlist && PlaylistCanAddItems(i)), 200 + i, plman.GetPlaylistName(i));
				}
				sub5.AppendTo(menu, MF_STRING, "Add to");
				menu.AppendMenuSeparator();

				context.InitContextPlaylist();
				context.BuildMenu(menu, 1000);
			} else {
				menu.AppendMenuItem(paste_flag, 107, "Paste");
			}
		} else {
			menu.AppendMenuSeparator();
			menu.AppendMenuItem(MF_STRING, 50, "Configure...");
		}

		var idx = menu.TrackPopupMenu(x, y);

		switch (idx) {
		case 0:
			break;
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
		case 20:
			ppt.showGroupHeaders = !ppt.showGroupHeaders;
			window.SetProperty("SMOOTH.SHOW.GROUP.HEADERS", ppt.showGroupHeaders);
			get_metrics();
			this.repaint();
			break;
		case 21:
		case 22:
		case 23:
			ppt.groupHeaderRowsNumber = idx - 20;
			window.SetProperty("SMOOTH.HEADER.ROWS", ppt.groupHeaderRowsNumber);
			this.populate();
			break;
		case 24:
			ppt.autoFill = !ppt.autoFill;
			window.SetProperty("SMOOTH.AUTO.FILL", ppt.autoFill);
			images.clear();
			this.populate();
			break;
		case 25:
			utils.RemovePath(Paths.smooth_cache);
			utils.CreateFolder(Paths.smooth_cache);
			images.clear();
			this.populate();
			break;
		case 50:
			window.ShowConfigure();
			break;
		case 101:
			plman.UndoBackup(g_active_playlist);
			plman.RemovePlaylistSelection(g_active_playlist, true);
			break;
		case 102:
			plman.UndoBackup(g_active_playlist);
			plman.RemovePlaylistSelection(g_active_playlist);
			break;
		case 103:
			plman.InvertSelection(g_active_playlist);
			break;
		case 104:
			selected_items.CopyToClipboard();
			plman.UndoBackup(g_active_playlist);
			plman.RemovePlaylistSelection(g_active_playlist);
			break;
		case 105:
			selected_items.CopyToClipboard();
			break;
		case 106:
			this.paste_items(getFocusId() + 1);
			break;
		case 107:
			this.paste_items(plman.GetPlaylistItemCount(g_active_playlist));
			break;
		case 110:
			var pl = plman.CreatePlaylist();
			plman.ActivePlaylist = pl;
			plman.InsertPlaylistItems(pl, 0, selected_items);
			break;
		default:
			if (idx < 1000) {
				var pl = idx - 200;
				plman.UndoBackup(pl);
				plman.InsertPlaylistItems(pl, plman.GetPlaylistItemCount(pl), selected_items);
			} else {
				context.ExecuteByID(idx - 1000);
			}
			break;
		}

		return true;
	}

	this.paste_items = function (pos) {
		var clipboard_contents = fb.GetClipboardContents();
		plman.UndoBackup(g_active_playlist);
		plman.InsertPlaylistItems(g_active_playlist, pos, clipboard_contents);
	}

	window.SetInterval(function () {
		if (!window.IsVisible) {
			need_repaint = true;
			return;
		}

		if (m_y > brw.y && m_y < brw.y + brw.h) {
			brw.activeRow = Math.ceil((m_y + scroll_ - brw.y) / ppt.rowHeight - 1);
			if (brw.activeRow >= brw.rows.length)
				brw.activeRow = -1;
		} else {
			brw.activeRow = -1;
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
		brw.showFocusedItem();
	}, 100);

	this.groups = [];
	this.rows = [];
	this.scrollbar = new oScrollbar();
	this.keypressed = false;
	this.playlist_info = "";
	this.list = fb.CreateHandleList();
	this.track_tf_arr = [];
	this.old_activeRow = -1;
	this.nowplaying_y = 0;
	this.inputbox = new oInputbox(300, scale(20), true, "", "Search", g_sendResponse);
}

function oGroup(index, start, handle, groupkey, cachekey) {
	this.index = index;
	this.start = start;
	this.count = 1;
	this.metadb = handle;
	this.groupkey = groupkey;
	this.cachekey = cachekey;
	this.cover_image = null;
	this.image_requested = false;

	var arr = this.groupkey.split(" ^^ ");
	this.album = arr[0] || "";
	this.album_artist = arr[1] || "";
	this.date = arr[2] || "";

	this.finalise = function (count) {
		this.count = count;
	}
}

function g_sendResponse() {
	g_search_text = brw.inputbox.text;
	g_search_index = 0;

	if (g_search_text.empty()) {
		plman.ClearPlaylistSelection(g_active_playlist);
		g_search_indexes = [];
	} else {
		g_search_indexes = plman.SelectQueryItems(g_active_playlist, g_search_text);
	}
}

function clear_search() {
	brw.inputbox.text = "";
	g_search_index = 0;
	g_search_indexes = [];
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
	brw.setList();
}

function kill_scrollbar_timer() {
	cScrollBar.timerCounter = -1;

	if (cScrollBar.timerID) {
		window.ClearTimeout(cScrollBar.timerID);
		cScrollBar.timerID = false;
	}
}

function vk_up() {
	var scrollstep = 1;
	var new_focus_id = 0;
	var new_row = 0;

	new_row = g_focus_row - scrollstep;

	if (new_row < 0) {
		if (ppt.showGroupHeaders) {
			new_row = ppt.groupHeaderRowsNumber;
		} else {
			new_row = 0;
		}
		kill_scrollbar_timer();
	} else {
		if (brw.rows[new_row].type != 0) {
			new_row -= ppt.groupHeaderRowsNumber;
		}

		if (new_row >= 0) {
			new_focus_id = brw.rows[new_row].playlistTrackId;
			plman.ClearPlaylistSelection(g_active_playlist);
			plman.SetPlaylistSelectionSingle(g_active_playlist, new_focus_id, true);
			plman.SetPlaylistFocusItem(g_active_playlist, new_focus_id);
		}
	}
}

function vk_down() {
	var scrollstep = 1;
	var new_focus_id = 0;
	var new_row = 0;

	new_row = g_focus_row + scrollstep;

	if (new_row > brw.rows.length - 1) {
		new_row = brw.rows.length - 1;
		kill_scrollbar_timer();
	} else {
		if (brw.rows[new_row].type != 0) {
			if (brw.rows[new_row].type <= 1) {
				new_row += ppt.groupHeaderRowsNumber;
			}
		}

		if (new_row < brw.rows.length) {
			new_focus_id = brw.rows[new_row].playlistTrackId;
			plman.ClearPlaylistSelection(g_active_playlist);
			plman.SetPlaylistSelectionSingle(g_active_playlist, new_focus_id, true);
			plman.SetPlaylistFocusItem(g_active_playlist, new_focus_id);
		}
	}
}

function check_scroll(scroll___) {
	if (scroll___ < 0) {
		scroll___ = 0;
	}

	var g1 = brw.h - (brw.totalRowsVis * ppt.rowHeight);
	var end_limit = (brw.rows.length * ppt.rowHeight) - (brw.totalRowsVis * ppt.rowHeight) - g1;

	if (scroll___ != 0 && scroll___ > end_limit) {
		scroll___ = end_limit;
	}

	return isNaN(scroll___) ? 0 : scroll___;
}

function getFocusId() {
	return plman.GetPlaylistFocusItemIndex(g_active_playlist);
}

ppt.groupkey_tf = window.GetProperty("SMOOTH.GROUPKEY", "$if2(%album%,$if(%length%,'('Singles')',%title%)) ^^ $if2(%album artist%,$if(%length%,%directory%,Stream)) ^^ [%date%]")
ppt.groupHeaderRowsNumber = window.GetProperty("SMOOTH.HEADER.ROWS", 2);
ppt.showGroupHeaders = window.GetProperty("SMOOTH.SHOW.GROUP.HEADERS", true);

ppt.defaultRowHeight = 36;
ppt.rowHeight = ppt.defaultRowHeight;

if (ppt.groupHeaderRowsNumber < 1) ppt.groupHeaderRowsNumber = 1;
else if (ppt.groupHeaderRowsNumber > 3) ppt.groupHeaderRowsNumber = 3;

var tfo = {
	artist_title : fb.TitleFormat("%artist% ^^ %title%"),
	track : fb.TitleFormat("[%artist%] ^^ [%title%] ^^ [[%discnumber%.]%tracknumber%.] ^^ [%length%]"),
	time : fb.TitleFormat("$if3(-%playback_time_remaining%,%playback_time%,)"),
	groupkey : fb.TitleFormat(ppt.groupkey_tf),
}

var foo_playcount = fb.CheckComponent("foo_playcount");

var g_focus_id = getFocusId();
var g_focus_row = 0;
var g_focus_album_id = -1;
var g_seconds = 0;
var g_time = "";
var g_search_text = "";
var g_search_index = 0;
var g_search_indexes = [];

var brw = new oBrowser();

get_metrics();
setWallpaperImg();
