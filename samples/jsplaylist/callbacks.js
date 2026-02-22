function on_char(code) {
	if (cSettings.visible) {
		for (var i = 0; i < p.settings.pages.length; i++) {
			for (var j = 0; j < p.settings.pages[i].elements.length; j++) {
				if (p.settings.pages[i].elements[j].objType == "TB") p.settings.pages[i].elements[j].on_char(code);
			}
		}
	} else if (p.playlistManager.inputboxID >= 0) {
		p.playlistManager.inputbox.on_char(code);
	}
}

function on_colours_changed() {
	get_colours();
	p.topBar.setButtons();
	p.headerBar.setButtons();
	p.scrollbar.setButtons();
	p.scrollbar.setCursorButton();
	p.playlistManager.setButtons();
	p.settings.setButtons();
	resize_panels();
	window.Repaint();
}

function on_drag_drop(action, x, y, mask) {
	if (y < p.list.y) {
		action.Effect = 0;
	} else if (cPlaylistManager.visible && p.playlistManager.isHoverObject(x, y)) {
		if (g_drag_drop_playlist_id == -1) {
			if (p.playlistManager.ishoverHeader) {
				if (g_drag_drop_internal) {
					var pl = plman.CreatePlaylist(plman.PlaylistCount, "Dropped Items")
					plman.InsertPlaylistItems(pl, 0, plman.GetPlaylistSelectedItems(g_active_playlist), true);
					plman.ActivePlaylist = pl;
					action.Effect = 0;
				} else {
					action.Playlist = plman.CreatePlaylist(plman.PlaylistCount, "Dropped Items");
					action.Base = 0;
					action.ToSelect = true;
					action.Effect = 1;
				}
			} else {
				action.Effect = 0;
			}
		} else if (PlaylistCanAddItems(g_drag_drop_playlist_id)) {
			var base = plman.GetPlaylistItemCount(g_drag_drop_playlist_id);

			if (g_drag_drop_internal) {
				if (g_drag_drop_playlist_id != g_active_playlist) {
					plman.UndoBackup(g_drag_drop_playlist_id);
					plman.InsertPlaylistItems(g_drag_drop_playlist_id, base, plman.GetPlaylistSelectedItems(g_active_playlist));
				}
				action.Effect = 0;
			} else {
				plman.UndoBackup(g_drag_drop_playlist_id);
				action.Playlist = g_drag_drop_playlist_id;
				action.Base = base;
				action.ToSelect = false;
				action.Effect = 1;
			}
		} else {
			action.Effect = 0;
		}
	} else {
		var new_pos = g_drag_drop_bottom ? plman.GetPlaylistItemCount(g_active_playlist) : g_drag_drop_track_id;

		if (g_drag_drop_internal) {
			if (PlaylistCanReorder(g_active_playlist)) {
				plman.UndoBackup(g_active_playlist);
				plman.MovePlaylistSelection(g_active_playlist, new_pos);
			}
			action.Effect = 0;
		} else if (PlaylistCanAddItems(g_active_playlist)) {
			plman.ClearPlaylistSelection(g_active_playlist);
			plman.UndoBackup(g_active_playlist);
			action.Playlist = g_active_playlist;
			action.Base = new_pos;
			action.ToSelect = true;
			action.Effect = 1;
		} else {
			action.Effect = 0;
		}
	}

	g_drag_drop_playlist_manager_hover = false;
	g_drag_drop_playlist_id = -1;
	g_drag_drop_track_id = -1;
	g_drag_drop_row_id = -1;
	g_drag_drop_bottom = false;
	g_drag_drop_internal = false;
	full_repaint();
}

function on_drag_enter() {
	g_drag_drop_status = true;
}

function on_drag_leave() {
	g_drag_drop_status = false;
	g_drag_drop_playlist_manager_hover = false;
	g_drag_drop_track_id = -1;
	g_drag_drop_row_id = -1;
	g_drag_drop_playlist_id = -1;
	p.list.buttonclicked = false;

	if (cScrollBar.interval) {
		window.ClearInterval(cScrollBar.interval);
		cScrollBar.interval = false;
	}

	window.Repaint();
}

function on_drag_over(action, x, y, mask) {
	g_drag_drop_playlist_manager_hover = false;
	g_drag_drop_track_id = -1;
	g_drag_drop_row_id = -1;
	g_drag_drop_bottom = false;

	if (y < p.list.y) {
		action.Effect = 0;
	} else if (cPlaylistManager.visible && p.playlistManager.isHoverObject(x, y)) {
		g_drag_drop_playlist_manager_hover = true;
		p.playlistManager.check("drag_over", x, y);
		if (g_drag_drop_playlist_id == -1) {
			action.Effect = p.playlistManager.ishoverHeader ? 1 : 0;
		} else if (g_drag_drop_internal) {
			action.Effect = g_drag_drop_playlist_id == g_active_playlist ? 0 : 1;
		} else if (PlaylistCanAddItems(g_drag_drop_playlist_id)) {
			action.Effect = 1;
		} else {
			action.Effect = 0;
		}
	} else if (g_drag_drop_internal && !PlaylistCanReorder(g_active_playlist)) {
		action.Effect = 0;
	} else if (g_drag_drop_internal || PlaylistCanAddItems(g_active_playlist)) {
		p.list.check("drag_over", x, y);
		if (y > p.list.y && y < p.list.y + 40) {
			on_mouse_wheel(1);
		} else if (y > p.list.y + p.list.h - 40 && y < p.list.y + p.list.h) {
			on_mouse_wheel(-1);
		}
		action.Effect = 1;
	} else {
		action.Effect = 0;
	}
	full_repaint();
}

function on_focus(is_focused) {
	if (p.playlistManager.inputboxID >= 0) {
		p.playlistManager.inputbox.on_focus(is_focused);
	}
	if (is_focused) {
		plman.SetActivePlaylistContext();
		window.SetPlaylistSelectionTracking();
	} else {
		p.playlistManager.inputboxID = -1;
		full_repaint();
	}
}

function on_font_changed() {
	get_font();
	p.topBar.setButtons();
	p.headerBar.setButtons();
	p.scrollbar.setButtons();
	p.scrollbar.setCursorButton();
	p.playlistManager.setButtons();
	p.settings.setButtons();
	resize_panels();
	window.Repaint();
}

function on_get_album_art_done(metadb, art_id, image) {
	if (!image)
		return;

	for (var i = 0; i < p.list.groups.length; i++) {
		var group = p.list.groups[i];
		if (group.metadb && group.metadb.Compare(metadb)) {
			g_image_cache.set(group.group_key, image);
			break;
		}
	}
}

function on_item_focus_change(playlist, from, to) {
	if (playlist == g_active_playlist) {
		p.list.focusedTrackId = to;
		var center_focus_item = p.list.isFocusedItemVisible();
		if ((!center_focus_item && !p.list.drawRectSel) || (center_focus_item && to == 0)) {
			p.list.setItems(true);
		}
		p.scrollbar.setCursor(p.list.totalRowVisible, p.list.totalRows, p.list.offset);
	}
	full_repaint();
}

function on_key_down(vkey) {
	if (cSettings.visible) {
		g_textbox_tabbed = false;
		var elements = p.settings.pages[p.settings.currentPageId].elements;
		for (var j = 0; j < elements.length; j++) {
			if (typeof elements[j].on_key_down == "function") elements[j].on_key_down(vkey);
		}
	} else {
		if (p.playlistManager.inputboxID >= 0) {
			switch (vkey) {
			case VK_ESCAPE:
			case 222:
				p.playlistManager.inputboxID = -1;
				full_repaint();
				break;
			default:
				p.playlistManager.inputbox.on_key_down(vkey);
			}
		} else {
			var mask = GetKeyboardMask();
			if (mask == KMask.none) {
				switch (vkey) {
				case VK_F2:
					// rename playlist (playlist manager panel visible)
					if (cPlaylistManager.visible && PlaylistCanRename(g_active_playlist)) {
						p.playlistManager.inputbox = new oInputbox(p.playlistManager.w - p.playlistManager.border - p.playlistManager.scrollbarWidth - scale(40), cPlaylistManager.rowHeight - 10, plman.GetPlaylistName(g_active_playlist), "", "renamePlaylist()");
						p.playlistManager.inputboxID = g_active_playlist;
						// activate box content + selection activated
						if (cPlaylistManager.inputbox_timeout) window.ClearTimeout(cPlaylistManager.inputbox_timeout);
						cPlaylistManager.inputbox_timeout = window.SetTimeout(inputboxPlaylistManager_activate, 20);
					}
					break;
				case VK_F5:
					p.list.groups.forEach(function (item) {
						item.cover_img = null;
					});
					g_image_cache.reset();
					g_stub_image = fb.GetAlbumArtStub(cGroup.art_id);
					full_repaint();
					break;
				case VK_TAB:
					togglePlaylistManager();
					break;
				case VK_UP:
					var scrollstep = 1;
					var new_focus_id = 0;
					if (p.list.count > 0 && !p.list.keypressed && !cScrollBar.timeout) {
						p.list.keypressed = true;
						new_focus_id = (p.list.focusedTrackId > 0) ? p.list.focusedTrackId - scrollstep : 0;
						var grpId = p.list.getGroupIdfromTrackId(new_focus_id);

						if (p.list.focusedTrackId == 0 && p.list.offset > 0) {
							p.list.scrollItems(1, scrollstep);
							cScrollBar.timeout = window.SetTimeout(function () {
								cScrollBar.timeout = false;
								p.list.scrollItems(1, scrollstep);
								if (cScrollBar.interval) window.ClearInterval(cScrollBar.interval);
								cScrollBar.interval = window.SetInterval(function () {
									p.list.scrollItems(1, scrollstep);
								}, 50);
							}, 400);
						} else {
							plman.SetPlaylistFocusItem(g_active_playlist, new_focus_id);
							plman.ClearPlaylistSelection(g_active_playlist);
							plman.SetPlaylistSelectionSingle(g_active_playlist, new_focus_id, true);
							cScrollBar.timeout = window.SetTimeout(function () {
								cScrollBar.timeout = false;
								if (cScrollBar.interval) window.ClearInterval(cScrollBar.interval);
								cScrollBar.interval = window.SetInterval(function () {
									new_focus_id = (p.list.focusedTrackId > 0) ? p.list.focusedTrackId - scrollstep : 0;
									var grpId = p.list.getGroupIdfromTrackId(new_focus_id);
									plman.SetPlaylistFocusItem(g_active_playlist, new_focus_id);
									plman.ClearPlaylistSelection(g_active_playlist);
									plman.SetPlaylistSelectionSingle(g_active_playlist, new_focus_id, true);
								}, 50);
							}, 400);
						}
					}
					break;
				case VK_DOWN:
					if (p.list.count > 0 && !p.list.keypressed && !cScrollBar.timeout) {
						p.list.keypressed = true;
						var new_focus_id = (p.list.focusedTrackId < p.list.count - 1) ? p.list.focusedTrackId + 1 : p.list.count - 1;

						plman.SetPlaylistFocusItem(g_active_playlist, new_focus_id);
						plman.ClearPlaylistSelection(g_active_playlist);
						plman.SetPlaylistSelectionSingle(g_active_playlist, new_focus_id, true);
						cScrollBar.timeout = window.SetTimeout(function () {
							cScrollBar.timeout = false;
							if (cScrollBar.interval) window.ClearInterval(cScrollBar.interval);
							cScrollBar.interval = window.SetInterval(function () {
								new_focus_id = (p.list.focusedTrackId < p.list.count - 1) ? p.list.focusedTrackId + 1 : p.list.count - 1;
								var grpId = p.list.getGroupIdfromTrackId(new_focus_id);
								plman.SetPlaylistFocusItem(g_active_playlist, new_focus_id);
								plman.ClearPlaylistSelection(g_active_playlist);
								plman.SetPlaylistSelectionSingle(g_active_playlist, new_focus_id, true);
							}, 50);
						}, 400);
					}
					break;
				case VK_RETURN:
					plman.ExecutePlaylistDefaultAction(g_active_playlist, p.list.focusedTrackId);
					break;
				case VK_END:
					if (p.list.count > 0) {
						plman.SetPlaylistFocusItem(g_active_playlist, p.list.count - 1);
						plman.ClearPlaylistSelection(g_active_playlist);
						plman.SetPlaylistSelectionSingle(g_active_playlist, p.list.count - 1, true);
					}
					break;
				case VK_HOME:
					if (p.list.count > 0) {
						plman.SetPlaylistFocusItem(g_active_playlist, 0);
						plman.ClearPlaylistSelection(g_active_playlist);
						plman.SetPlaylistSelectionSingle(g_active_playlist, 0, true);
					}
					break;
				case VK_DELETE:
					if (cPlaylistManager.visible) {
						if (PlaylistCanRemove(g_active_playlist)) {
							plman.RemovePlaylistSwitch(g_active_playlist);
						}
					} else {
						if (PlaylistCanRemoveItems(g_active_playlist)) {
							plman.UndoBackup(g_active_playlist);
							plman.RemovePlaylistSelection(g_active_playlist);
						}
					}
					break;
				}
			} else {
				switch (mask) {
				case KMask.shift:
					switch (vkey) {
					case VK_SHIFT: // SHIFT key alone
						p.list.SHIFT_count = 0;
						break;
					case VK_UP: // SHIFT + KEY UP
						if (p.list.SHIFT_count == 0) {
							if (p.list.SHIFT_start_id == null) {
								p.list.SHIFT_start_id = p.list.focusedTrackId;
							}
							plman.ClearPlaylistSelection(g_active_playlist);
							plman.SetPlaylistSelectionSingle(g_active_playlist, p.list.focusedTrackId, true);
							if (p.list.focusedTrackId > 0) {
								p.list.SHIFT_count--;
								p.list.focusedTrackId--;
								plman.SetPlaylistSelectionSingle(g_active_playlist, p.list.focusedTrackId, true);
								plman.SetPlaylistFocusItem(g_active_playlist, p.list.focusedTrackId);
							}
						} else if (p.list.SHIFT_count < 0) {
							if (p.list.focusedTrackId > 0) {
								p.list.SHIFT_count--;
								p.list.focusedTrackId--;
								plman.SetPlaylistSelectionSingle(g_active_playlist, p.list.focusedTrackId, true);
								plman.SetPlaylistFocusItem(g_active_playlist, p.list.focusedTrackId);
							}
						} else {
							plman.SetPlaylistSelectionSingle(g_active_playlist, p.list.focusedTrackId, false);
							p.list.SHIFT_count--;
							p.list.focusedTrackId--;
							plman.SetPlaylistFocusItem(g_active_playlist, p.list.focusedTrackId);
						}
						break;
					case VK_DOWN: // SHIFT + KEY DOWN
						if (p.list.SHIFT_count == 0) {
							if (p.list.SHIFT_start_id == null) {
								p.list.SHIFT_start_id = p.list.focusedTrackId;
							}
							plman.ClearPlaylistSelection(g_active_playlist);
							plman.SetPlaylistSelectionSingle(g_active_playlist, p.list.focusedTrackId, true);
							if (p.list.focusedTrackId < p.list.count - 1) {
								p.list.SHIFT_count++;
								p.list.focusedTrackId++;
								plman.SetPlaylistSelectionSingle(g_active_playlist, p.list.focusedTrackId, true);
								plman.SetPlaylistFocusItem(g_active_playlist, p.list.focusedTrackId);
							}
						} else if (p.list.SHIFT_count > 0) {
							if (p.list.focusedTrackId < p.list.count - 1) {
								p.list.SHIFT_count++;
								p.list.focusedTrackId++;
								plman.SetPlaylistSelectionSingle(g_active_playlist, p.list.focusedTrackId, true);
								plman.SetPlaylistFocusItem(g_active_playlist, p.list.focusedTrackId);
							}
						} else {
							plman.SetPlaylistSelectionSingle(g_active_playlist, p.list.focusedTrackId, false);
							p.list.SHIFT_count++;
							p.list.focusedTrackId++;
							plman.SetPlaylistFocusItem(g_active_playlist, p.list.focusedTrackId);
						}
						break;
					}
					break;
				case KMask.ctrl:
					if (vkey == 65) { // CTRL+A
						fb.RunMainMenuCommand("Edit/Select all");
						full_repaint();
					}
					if (vkey == 88) { // CTRL+X
						if (PlaylistCanRemoveItems(g_active_playlist)) {
							var items = plman.GetPlaylistSelectedItems(g_active_playlist);
							if (items.CopyToClipboard()) {
								plman.UndoBackup(g_active_playlist);
								plman.RemovePlaylistSelection(g_active_playlist);
							}
						}
					}
					if (vkey == 67) { // CTRL+C
						var items = plman.GetPlaylistSelectedItems(g_active_playlist);
						items.CopyToClipboard();
					}
					if (vkey == 86) { // CTRL+V
						if (PlaylistCanAddItems(g_active_playlist) && fb.CheckClipboardContents()) {
							var clipboard_contents = fb.GetClipboardContents();
							plman.UndoBackup(g_active_playlist);
							plman.InsertPlaylistItems(g_active_playlist, p.list.focusedTrackId + 1, clipboard_contents);
						}
					}
					if (vkey == 73) { // CTRL+I
						cTopBar.visible = !cTopBar.visible;
						window.SetProperty("JSPLAYLIST.TopBar.Visible", cTopBar.visible);
						resize_panels();
						full_repaint();
					}
					if (vkey == 84) { // CTRL+T
						// Toggle Toolbar
						cHeaderBar.locked = !cHeaderBar.locked;
						window.SetProperty("JSPLAYLIST.HEADERBAR2.Locked", cHeaderBar.locked);
						if (!cHeaderBar.locked) {
							p.headerBar.visible = false;
						}
						resize_panels();
						full_repaint();
					}
					if (vkey == 89) { // CTRL+Y
						fb.RunMainMenuCommand("Edit/Redo");
					}
					if (vkey == 90) { // CTRL+Z
						fb.RunMainMenuCommand("Edit/Undo");
					}
					break;
				}
			}
		}
	}
}

function on_key_up(vkey) {
	if (!cSettings.visible) {
		p.list.keypressed = false;
		if (cScrollBar.timeout) {
			window.ClearTimeout(cScrollBar.timeout);
			cScrollBar.timeout = false;
		}
		if (cScrollBar.interval) {
			window.ClearInterval(cScrollBar.interval);
			cScrollBar.interval = false;
		}
		if (vkey == VK_SHIFT) {
			p.list.SHIFT_start_id = null;
			p.list.SHIFT_count = 0;
		}
	}
}

function on_mouse_lbtn_dblclk(x, y, mask) {
	g_double_clicked = true;

	if (cSettings.visible) {
		p.settings.on_mouse("lbtn_dblclk", x, y);
	} else {
		p.list.check("lbtn_dblclk", x, y);

		if (p.headerBar.visible)
			p.headerBar.on_mouse("lbtn_dblclk", x, y);

		if (cPlaylistManager.visible) {
			p.playlistManager.check("lbtn_dblclk", x, y);
		} else {
			if (properties.showscrollbar && p.scrollbar && p.list.totalRows > 0 && (p.list.totalRows > p.list.totalRowVisible)) {
				p.scrollbar.check("lbtn_dblclk", x, y);
				if (p.scrollbar.hover) {
					on_mouse_lbtn_down(x, y);
				}
			}
		}
	}
}

function on_mouse_lbtn_down(x, y) {
	if (cSettings.visible) {
		p.settings.on_mouse("lbtn_down", x, y);
	} else {
		p.list.check("lbtn_down", x, y);

		if (!cPlaylistManager.visible) {
			if (p.playlistManager.woffset == 0 && properties.showscrollbar && p.scrollbar && p.list.totalRows > 0 && (p.list.totalRows > p.list.totalRowVisible)) {
				p.scrollbar.check("lbtn_down", x, y);
			}

			if (p.scrollbar.hover && !p.scrollbar.cursorDrag) {
				var scrollstep = p.list.totalRowVisible;
				if (y < p.scrollbar.cursorPos) {
					if (!p.list.buttonclicked && !cScrollBar.timeout) {
						p.list.buttonclicked = true;
						p.list.scrollItems(1, scrollstep);
						cScrollBar.timeout = window.SetTimeout(function () {
							cScrollBar.timeout = false;
							p.list.scrollItems(1, scrollstep);
							if (cScrollBar.interval) window.ClearInterval(cScrollBar.interval);
							cScrollBar.interval = window.SetInterval(function () {
								if (p.scrollbar.hover) {
									if (mouse_x > p.scrollbar.x && p.scrollbar.cursorPos > mouse_y) {
										p.list.scrollItems(1, scrollstep);
									}
								}
							}, 60);
						}, 400);
					}
				} else {
					if (!p.list.buttonclicked && !cScrollBar.timeout) {
						p.list.buttonclicked = true;
						p.list.scrollItems(-1, scrollstep);
						cScrollBar.timeout = window.SetTimeout(function () {
							cScrollBar.timeout = false;
							p.list.scrollItems(-1, scrollstep);
							if (cScrollBar.interval) window.ClearInterval(cScrollBar.interval);
							cScrollBar.interval = window.SetInterval(function () {
								if (p.scrollbar.hover) {
									if (mouse_x > p.scrollbar.x && p.scrollbar.cursorPos + p.scrollbar.cursorHeight < mouse_y) {
										p.list.scrollItems(-1, scrollstep);
									}
								}
							}, 60);
						}, 400)
					}
				}
			}
		} else {
			p.playlistManager.check("lbtn_down", x, y);
		}

		if (cTopBar.visible) {
			p.topBar.buttonCheck("lbtn_down", x, y);
		}

		if (p.headerBar.visible) {
			p.headerBar.on_mouse("lbtn_down", x, y);
		}
	}
}

function on_mouse_lbtn_up(x, y) {
	if (cSettings.visible) {
		p.settings.on_mouse("lbtn_up", x, y);
	} else {
		p.list.buttonclicked = false;
		if (cScrollBar.timeout) {
			window.ClearTimeout(cScrollBar.timeout);
			cScrollBar.timeout = false;
		}
		if (cScrollBar.interval) {
			window.ClearInterval(cScrollBar.interval);
			cScrollBar.interval = false;
		}

		p.list.check("lbtn_up", x, y);

		if (p.playlistManager.woffset > 0 || cPlaylistManager.visible) {
			p.playlistManager.check("lbtn_up", x, y);
		}

		if (properties.showscrollbar && p.scrollbar && p.list.totalRows > 0 && (p.list.totalRows > p.list.totalRowVisible)) {
			p.scrollbar.check("lbtn_up", x, y);
		}

		if (cTopBar.visible) {
			p.topBar.buttonCheck("lbtn_up", x, y);
		}

		if (p.headerBar.visible) {
			p.headerBar.on_mouse("lbtn_up", x, y);
		}

		full_repaint();
	}
}

function on_mouse_mbtn_down(x, y, mask) {
	g_middle_clicked = true;
	togglePlaylistManager();
}

function on_mouse_mbtn_up(x, y, mask) {
	if (g_middle_click_timeout) window.ClearTimeout(g_middle_click_timeout);
	g_middle_click_timeout = window.SetTimeout(function () {
		g_middle_click_timeout = false;
		g_middle_clicked = false;
	}, 250);
}

function on_mouse_move(x, y) {
	if (x == mouse_x && y == mouse_y)
		return;

	if (cSettings.visible) {
		p.settings.on_mouse("move", x, y);
	} else {
		if (p.playlistManager.woffset > 0) {
			if (!cPlaylistManager.blink_interval) {
				p.playlistManager.check("move", x, y);
			}
		}

		p.list.check("move", x, y);

		if (!cPlaylistManager.visible) {
			if (properties.showscrollbar && p.scrollbar && p.list.totalRows > 0 && (p.list.totalRows > p.list.totalRowVisible)) {
				p.scrollbar.check("move", x, y);
			}
		}

		if (p.headerBar.visible) {
			p.headerBar.on_mouse("move", x, y);
		}

		if (cPlaylistManager.drag_moved) {
			if (p.playlistManager.ishoverItem) {
				window.SetCursor(IDC_HELP);
			} else {
				window.SetCursor(IDC_NO);
			}
		}
	}

	mouse_x = x;
	mouse_y = y;
}

function on_mouse_rbtn_up(x, y) {
	if (cSettings.visible) {
		p.settings.on_mouse("rbtn_up", x, y);
	} else {
		if (x >= ww - p.scrollbar.w)
			return false;

		if (p.headerBar.visible)
			p.headerBar.on_mouse("rbtn_up", x, y);

		p.playlistManager.check("rbtn_up", x, y);
		p.list.check("rbtn_up", x, y);
	}

	return true;
}

function on_mouse_wheel(delta) {
	if (g_middle_clicked)
		return;

	if (cSettings.visible) {
		p.settings.on_mouse("wheel", mouse_x, mouse_y, delta);
		if (cSettings.wheel_timeout) window.ClearTimeout(cSettings.wheel_timeout);
		cSettings.wheel_timeout = window.SetTimeout(function () {
			cSettings.wheel_timeout = false;
			on_mouse_move(mouse_x + 1, mouse_y + 1);
		}, 50);
	}

	if (p.list.ishover || cScrollBar.timeout) {
		if (!g_mouse_wheel_timeout) {
			g_mouse_wheel_timeout = window.SetTimeout(function () {
				g_mouse_wheel_timeout = false;
				p.list.scrollItems(delta, cList.scrollstep);
			}, 20);
		}
	} else {
		p.playlistManager.check("wheel", mouse_x, mouse_y, delta);
	}
}

function on_paint(gr) {
	if (cSettings.visible) {
		p.settings && p.settings.draw(gr);
	} else {
		gr.Clear(g_colour_background);

		if (playback.IsPlaying && properties.showwallpaper && images.wallpaper) {
			DrawWallpaper(gr);
		}

		p.topBar.draw(gr);
		p.headerBar.draw(gr);

		if (p.list.count == 0) {
			if (plman.PlaylistCount > 0) {
				var text_top = plman.GetPlaylistName(g_active_playlist);
				var text_bot = "This playlist is empty";
			} else {
				var text_top = "JSPlaylist coded by Br3tt";
				var text_bot = "Create a playlist to start!";
			}

			var y = Math.floor(wh / 2);
			gr.WriteTextSimple(text_top, g_font_20_bold, g_colour_text, 0, y - g_z5 - height(g_font_20_bold), ww, height(g_font_20_bold), 2, 1, 1);
			gr.FillRectangle(40, Math.floor(wh / 2), ww - 80, 1, g_colour_text & 0x40ffffff);
			gr.WriteTextSimple(text_bot, g_font_12_bold, blendColours(g_colour_text, g_colour_background, 0.35), 0, y + g_z5, ww, height(g_font_12_bold), 2, 0, 1);
		} else {
			p.headerBar.calculateColumns();

			if (properties.showscrollbar && p.scrollbar && p.list.totalRows > 0 && (p.list.totalRows > p.list.totalRowVisible)) {
				p.scrollbar.visible = true;
				p.scrollbar.draw(gr);
			} else {
				p.scrollbar.visible = false;
			}

			p.list.draw(gr);
		}

		p.playlistManager.draw(gr);
	}
}

function on_playback_new_track() {
	update_wallpaper();

	if (properties.enableDynamicColours) {
		on_colours_changed();
	}

	full_repaint();
}

function on_playback_pause(state) {
	if (p.list.nowplaying_y + cRow.playlist_h > p.list.y && p.list.nowplaying_y < p.list.y + p.list.h) {
		window.RepaintRect(p.list.x, p.list.nowplaying_y, p.list.w, cRow.playlist_h);
	}
}

function on_playback_queue_changed() {
	full_repaint();
}

function on_playback_stop(reason) {
	if (reason != 2) {
		update_wallpaper();

		if (properties.enableDynamicColours) {
			on_colours_changed();
		}

		full_repaint();
	}
}

function on_playback_time(time) {
	g_double_clicked = false;
	g_seconds = time;

	if (!cSettings.visible && p.list.nowplaying_y + cRow.playlist_h > p.list.y && p.list.nowplaying_y < p.list.y + p.list.h) {
		window.RepaintRect(p.list.x, p.list.nowplaying_y, p.list.w, cRow.playlist_h);
	}
}

function on_playlist_item_ensure_visible(playlist, index) {
	if (g_double_clicked)
		return;

	on_item_focus_change(playlist, 0, index);
}

function on_playlist_items_added(playlistIndex) {
	if (playlistIndex == g_active_playlist) {
		update_playlist();
		p.topBar.setDatas();
		p.headerBar.resetSortIndicators();
		full_repaint();
	}
}

function on_playlist_items_changed(playlistIndex) {
	if (playlistIndex == g_active_playlist) {
		update_playlist();
		p.topBar.setDatas();
		p.headerBar.resetSortIndicators();
		full_repaint();
	}
}

function on_playlist_items_removed(playlistIndex) {
	if (playlistIndex == g_active_playlist) {
		update_playlist();
		p.topBar.setDatas();
		p.headerBar.resetSortIndicators();
		full_repaint();
	}
}

function on_playlist_items_reordered(playlistIndex) {
	if (playlistIndex == g_active_playlist && p.headerBar.columnDragged == 0) {
		update_playlist();
		p.headerBar.resetSortIndicators();
		full_repaint();
	} else {
		p.headerBar.columnDragged = 0;
	}
}

function on_playlist_items_replaced(playlistIndex) {
	if (playlistIndex == g_active_playlist) {
		update_playlist();
		p.topBar.setDatas();
		p.headerBar.resetSortIndicators();
		full_repaint();
	}
}

function on_playlist_items_selection_change() {
	full_repaint();
}

function on_playlist_switch() {
	g_active_playlist = plman.ActivePlaylist
	update_playlist();
	p.topBar.setDatas();
	p.headerBar.resetSortIndicators();
	full_repaint();
}

function on_playlists_changed() {
	g_active_playlist = plman.ActivePlaylist;

	p.topBar.setDatas();

	if (cPlaylistManager.visible && cPlaylistManager.drag_dropped) {
		window.SetCursor(IDC_ARROW);
	}

	p.playlistManager.refresh();
	full_repaint();
}

function on_size() {
	ww = window.Width;
	wh = window.Height;
	resize_panels();

	if (!g_init_on_size) {
		update_playlist();
		g_init_on_size = true;
	}
}

function on_stream_album_art_change() {
	update_wallpaper();

	if (properties.enableDynamicColours) {
		on_colours_changed();
	}

	full_repaint();
}
