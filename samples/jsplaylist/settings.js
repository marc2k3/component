function settings_checkboxes_action(id, status, parentId) {
	switch (parentId) {
	case 0: // page 0 : General
		switch (id) {
		case 0:
			eval(p.settings.pages[parentId].elements[id].linkedVariable + " = " + status);
			window.SetProperty("JSPLAYLIST.TopBar.Visible", status);
			resize_panels();
			full_repaint();
			break;
		case 1:
			eval(p.settings.pages[parentId].elements[id].linkedVariable + " = " + status);
			window.SetProperty("JSPLAYLIST.HEADERBAR2.Locked", status);
			if (!cHeaderBar.locked) {
				p.headerBar.visible = false;
			}
			resize_panels();
			full_repaint();
			break;
		}
		break;
	case 1: // page 1 : Columns
		switch (id) {
		case 0:
			var idx = p.settings.pages[1].elements[0].selectedId;
			// all size changes are in percent / ww
			if (p.headerBar.columns[idx].percent == 0) {
				p.settings.pages[1].elements[8].status = true;
				var newColumnSize = 8000;
				p.headerBar.columns[idx].percent = newColumnSize;
				var totalColsToResizeDown = 0;
				var last_idx = 0;
				for (var k = 0; k < p.headerBar.columns.length; k++) {
					if (k != idx && p.headerBar.columns[k].percent > newColumnSize) {
						totalColsToResizeDown++;
						last_idx = k;
					}
				}
				var minus_value = Math.floor(newColumnSize / totalColsToResizeDown);
				var reste = newColumnSize - (minus_value * totalColsToResizeDown);
				for (var k = 0; k < p.headerBar.columns.length; k++) {
					if (k != idx && p.headerBar.columns[k].percent > newColumnSize) {
						p.headerBar.columns[k].percent = Math.abs(p.headerBar.columns[k].percent) - minus_value;
						if (reste > 0 && k == last_idx) {
							p.headerBar.columns[k].percent = Math.abs(p.headerBar.columns[k].percent) - reste;
						}
					}
					p.headerBar.columns[k].w = Math.abs(p.headerBar.w * p.headerBar.columns[k].percent / 100000);
				}
				p.headerBar.saveColumns();
			} else {
				// check if it's not the last column visible, otherwise, we coundn't hide it!
				var nbvis = 0;
				for (var k = 0; k < p.headerBar.columns.length; k++) {
					if (p.headerBar.columns[k].percent > 0) {
						nbvis++;
					}
				}
				if (nbvis > 1) {
					p.settings.pages[1].elements[8].status = false;
					var RemovedColumnSize = Math.abs(p.headerBar.columns[idx].percent);
					p.headerBar.columns[idx].percent = 0;
					var totalColsToResizeUp = 0;
					var last_idx = 0;
					for (var k = 0; k < p.headerBar.columns.length; k++) {
						if (k != idx && p.headerBar.columns[k].percent > 0) {
							totalColsToResizeUp++;
							last_idx = k;
						}
					}
					var add_value = Math.floor(RemovedColumnSize / totalColsToResizeUp);
					var reste = RemovedColumnSize - (add_value * totalColsToResizeUp);
					for (var k = 0; k < p.headerBar.columns.length; k++) {
						if (k != idx && p.headerBar.columns[k].percent > 0) {
							p.headerBar.columns[k].percent = Math.abs(p.headerBar.columns[k].percent) + add_value;
							if (reste > 0 && k == last_idx) {
								p.headerBar.columns[k].percent = Math.abs(p.headerBar.columns[k].percent) + reste;
							}
						}
						p.headerBar.columns[k].w = Math.abs(p.headerBar.w * p.headerBar.columns[k].percent / 100000);
					}
					p.headerBar.saveColumns();
				}
			}

			p.headerBar.initColumns();
			full_repaint();
			break;
		}
		break;
	case 2: // page 2 : Groups
		switch (id) {
		case 7:
			p.list.groupby[p.settings.pages[parentId].elements[0].selectedId].showCover = status ? 1 : 0;
			p.list.saveGroupBy();
			break;
		}
		break;
	case 3: // page 3 : Appearance
		switch (id) {
		case 0:
			eval(p.settings.pages[parentId].elements[id].linkedVariable + " = " + status);
			window.SetProperty("JSPLAYLIST.Show Wallpaper", status);
			update_wallpaper();
			break;
		case 4:
			eval(p.settings.pages[parentId].elements[id].linkedVariable + " = " + status);
			window.SetProperty("JSPLAYLIST.Wallpaper Blurred", status);
			update_wallpaper();
			break;
		}
		break;
	}
}

function settings_radioboxes_action(id, status, pid) {
	switch (pid) {
	case 1:
		var selectedColumnId = p.settings.pages[1].elements[0].selectedId;

		if (id >=5 && id <= 7) {
			p.settings.pages[pid].elements[5].status = id == 5;
			p.settings.pages[pid].elements[6].status = id == 6;
			p.settings.pages[pid].elements[7].status = id == 7;
			p.headerBar.columns[selectedColumnId].align = id - 5;
		}

		p.headerBar.saveColumns();
		full_repaint();
		break;
	case 2:
		var selectedPatternId = p.settings.pages[2].elements[0].selectedId;

		if (id >= 3 && id <= 6) {
			p.settings.pages[pid].elements[3].status = id == 3;
			p.settings.pages[pid].elements[4].status = id == 4;
			p.settings.pages[pid].elements[5].status = id == 5;
			p.settings.pages[pid].elements[6].status = id == 6;
			p.list.groupby[selectedPatternId].expandedHeight = id - 2;
		}

		p.list.saveGroupBy();
		full_repaint();
		break;
	case 3:
		if (id >= 1 && id <= 3) {
			p.settings.pages[pid].elements[1].status = id == 1;
			p.settings.pages[pid].elements[2].status = id == 2;
			p.settings.pages[pid].elements[3].status = id == 3;
			properties.wallpapertype = id == 1 ? 0 : id == 2 ? 4 : -1;
			window.SetProperty("JSPLAYLIST.Wallpaper Type", properties.wallpapertype);
			update_wallpaper();
		}

		full_repaint();
		break;
	}
}

function settings_listboxes_action(pageId, id, selectedId) {
	switch (pageId) {
	case 1:
		switch (id) {
		case 0:
			p.settings.pages[1].elements[0].selectedId = selectedId;

			var txtbox_value = p.headerBar.columns[selectedId].label;
			p.settings.pages[1].elements[1].inputbox.check("lbtn_down", 0, 0);
			p.settings.pages[1].elements[1].inputbox.text = txtbox_value;
			p.settings.pages[1].elements[1].inputbox.default_text = txtbox_value;
			txtbox_value = p.headerBar.columns[selectedId].tf;
			p.settings.pages[1].elements[2].inputbox.check("lbtn_down", 0, 0);
			p.settings.pages[1].elements[2].inputbox.text = txtbox_value;
			p.settings.pages[1].elements[2].inputbox.default_text = txtbox_value;
			txtbox_value = p.headerBar.columns[selectedId].tf2;
			p.settings.pages[1].elements[3].inputbox.check("lbtn_down", 0, 0);
			p.settings.pages[1].elements[3].inputbox.text = txtbox_value;
			p.settings.pages[1].elements[3].inputbox.default_text = txtbox_value;
			txtbox_value = p.headerBar.columns[selectedId].sortOrder;
			p.settings.pages[1].elements[4].inputbox.check("lbtn_down", 0, 0);
			p.settings.pages[1].elements[4].inputbox.text = txtbox_value;
			p.settings.pages[1].elements[4].inputbox.default_text = txtbox_value;

			// update radio buttons values / selected column Id in the listbox
			var tmp = p.headerBar.columns[selectedId].align;
			p.settings.pages[1].elements[5].status = tmp == 0; // Left align
			p.settings.pages[1].elements[6].status = tmp == 1; // Right align
			p.settings.pages[1].elements[7].status = tmp == 2; // Centre align

			// update checkbox status / selected column Id in the listbox
			p.settings.pages[1].elements[0].status = p.headerBar.columns[selectedId].percent > 0;
			full_repaint();
			break;
		}
		break;
	case 2:
		var txtbox_value = "";
		switch (id) {
		case 0:
			p.settings.pages[2].elements[0].selectedId = selectedId;

			txtbox_value = p.list.groupby[selectedId].label;
			p.settings.pages[2].elements[1].inputbox.check("lbtn_down", 0, 0);
			p.settings.pages[2].elements[1].inputbox.text = txtbox_value;
			p.settings.pages[2].elements[1].inputbox.default_text = txtbox_value;
			txtbox_value = p.list.groupby[selectedId].tf;
			p.settings.pages[2].elements[2].inputbox.check("lbtn_down", 0, 0);
			p.settings.pages[2].elements[2].inputbox.text = txtbox_value;
			p.settings.pages[2].elements[2].inputbox.default_text = txtbox_value;

			// update radio buttons values / selected column Id in the listbox
			var tmp = p.list.groupby[selectedId].expandedHeight;
			p.settings.pages[2].elements[3].status = tmp == 1;
			p.settings.pages[2].elements[4].status = tmp == 2;
			p.settings.pages[2].elements[5].status = tmp == 3;
			p.settings.pages[2].elements[6].status = tmp == 4;

			txtbox_value = p.list.groupby[selectedId].l1;
			p.settings.pages[2].elements[8].inputbox.check("lbtn_down", 0, 0);
			p.settings.pages[2].elements[8].inputbox.text = txtbox_value;
			p.settings.pages[2].elements[8].inputbox.default_text = txtbox_value;
			txtbox_value = p.list.groupby[selectedId].r1;
			p.settings.pages[2].elements[9].inputbox.check("lbtn_down", 0, 0);
			p.settings.pages[2].elements[9].inputbox.text = txtbox_value;
			p.settings.pages[2].elements[9].inputbox.default_text = txtbox_value;
			txtbox_value = p.list.groupby[selectedId].l2;
			p.settings.pages[2].elements[10].inputbox.check("lbtn_down", 0, 0);
			p.settings.pages[2].elements[10].inputbox.text = txtbox_value;
			p.settings.pages[2].elements[10].inputbox.default_text = txtbox_value;
			txtbox_value = p.list.groupby[selectedId].r2;
			p.settings.pages[2].elements[11].inputbox.check("lbtn_down", 0, 0);
			p.settings.pages[2].elements[11].inputbox.text = txtbox_value;
			p.settings.pages[2].elements[11].inputbox.default_text = txtbox_value;

			full_repaint();
			break;
		}
		break;
	}
}

function settings_textboxes_action(pageId, elementId) {
	switch (pageId) {
	case 1: // Columns
		var selectedColumnId = p.settings.pages[pageId].elements[0].selectedId;
		switch (elementId) {
		case 1:
			var label = p.headerBar.columns[selectedColumnId].label;
			var new_label = p.settings.pages[pageId].elements[elementId].inputbox.text;
			if (new_label.length && new_label != label) {
				p.headerBar.columns[selectedColumnId].label = new_label;
				p.headerBar.saveColumns();

				p.settings.pages[pageId].elements[0].arr = [];
				for (var i = 0; i < p.headerBar.columns.length; i++) {
					p.settings.pages[pageId].elements[0].arr.push(p.headerBar.columns[i].ref);
				}
				full_repaint();
			}
			break;
		case 2:
			var tf = p.headerBar.columns[selectedColumnId].tf;
			var new_tf = p.settings.pages[pageId].elements[elementId].inputbox.text;
			if (new_tf.length && new_tf != tf) {
				p.headerBar.columns[selectedColumnId].tf = new_tf;
				p.headerBar.saveColumns();
			}
			break;
		case 3:
			var tf2 = p.headerBar.columns[selectedColumnId].tf2;
			var new_tf2 = p.settings.pages[pageId].elements[elementId].inputbox.text;
			if (new_tf2.length && new_tf2 != tf2) {
				p.headerBar.columns[selectedColumnId].tf2 = new_tf2;
				p.headerBar.saveColumns();
			}
			break;
		case 4:
			var sortOrder = p.headerBar.columns[selectedColumnId].sortOrder;
			var new_sortOrder = p.settings.pages[pageId].elements[elementId].inputbox.text;
			if (new_sortOrder.length && new_sortOrder != sortOrder) {
				p.headerBar.columns[selectedColumnId].sortOrder = new_sortOrder;
				p.headerBar.saveColumns();
			}
			break;
		}
		break;
	case 2: // Groups
		var selectedId = p.settings.pages[pageId].elements[0].selectedId;
		switch (elementId) {
		case 1:
			var label = p.list.groupby[selectedId].label;
			var new_label = p.settings.pages[pageId].elements[elementId].inputbox.text;
			if (new_label.length && new_label != label) {
				p.list.groupby[selectedId].label = new_label;
				p.list.saveGroupBy();

				p.settings.pages[pageId].elements[0].arr = [];
				for (var i = 0; i < p.list.groupby.length; i++) {
					p.settings.pages[pageId].elements[0].arr.push(p.list.groupby[i].label);
				}
				full_repaint();
			}
			break;
		case 2:
			var tf = p.list.groupby[selectedId].tf;
			var new_tf = p.settings.pages[pageId].elements[elementId].inputbox.text;
			if (new_tf.length && new_tf != tf) {
				p.list.groupby[selectedId].tf = new_tf;
				p.list.saveGroupBy();
			}
			break;
		case 8:
			var l1 = p.list.groupby[selectedId].l1;
			var new_l1 = p.settings.pages[pageId].elements[elementId].inputbox.text;
			if (new_l1.length && new_l1 != l1) {
				p.list.groupby[selectedId].l1 = new_l1;
				p.list.saveGroupBy();
			}
			break;
		case 9:
			var r1 = p.list.groupby[selectedId].r1;
			var new_r1 = p.settings.pages[pageId].elements[elementId].inputbox.text;
			if (new_r1.length && new_r1 != r1) {
				p.list.groupby[selectedId].r1 = new_r1;
				p.list.saveGroupBy();
			}
			break;
		case 10:
			var l2 = p.list.groupby[selectedId].l2;
			var new_l2 = p.settings.pages[pageId].elements[elementId].inputbox.text;
			if (new_l2.length && new_l2 != l2) {
				p.list.groupby[selectedId].l2 = new_l2;
				p.list.saveGroupBy();
			}
			break;
		case 11:
			var r2 = p.list.groupby[selectedId].r2;
			var new_r2 = p.settings.pages[pageId].elements[elementId].inputbox.text;
			if (new_r2.length && new_r2 != r2) {
				p.list.groupby[selectedId].r2 = new_r2;
				p.list.saveGroupBy();
			}
			break;
		}
		break;
	case 3: // Appearance
		switch (elementId) {
		case 5:
			var label = properties.wallpaperpath;
			var new_label = p.settings.pages[pageId].elements[elementId].inputbox.text;
			if (new_label.length && new_label != label) {
				properties.wallpaperpath = new_label;
				window.SetProperty("JSPLAYLIST.Default Wallpaper Path", properties.wallpaperpath);
				update_wallpaper();
			}
			break;
		}
		break;
	}
}

function oCheckBox(id, x, y, label, linkedVariable, parentPageId) {
	this.objType = "CB";
	this.id = id;
	this.x = x;
	this.y = y;
	this.parentPageId = parentPageId;
	this.ly = this.y - (p.settings.pages[this.parentPageId].offset * cSettings.rowHeight);
	this.label = label;
	this.linkedVariable = linkedVariable;
	this.status = eval(linkedVariable);
	this.prevStatus = this.status;
	this.func = "settings_checkboxes_action";

	this.setButtons = function () {
		var gb;
		var button_zoomSize = g_z16;

		this.checkbox_normal_off = utils.CreateImage(48, 48);
		gb = this.checkbox_normal_off.GetGraphics();
		gb.WriteTextSimple(chars.check_off, g_font_fluent_40, p.settings.color1, 0, 0, 48, 48, 2, 2);
		this.checkbox_normal_off.ReleaseGraphics();
		this.checkbox_normal_off.Resize(button_zoomSize, button_zoomSize);

		this.checkbox_hover_off = utils.CreateImage(48, 48);
		gb = this.checkbox_hover_off.GetGraphics();
		gb.WriteTextSimple(chars.check_off, g_font_fluent_40, p.settings.color1, 0, 0, 48, 48, 2, 2);
		this.checkbox_hover_off.ReleaseGraphics();
		this.checkbox_hover_off.Resize(button_zoomSize, button_zoomSize);

		this.checkbox_normal_on = utils.CreateImage(48, 48);
		gb = this.checkbox_normal_on.GetGraphics();
		gb.DrawRectangle(0, 0, 48, 48, 1, p.settings.color1);
		gb.WriteTextSimple(chars.check_on, g_font_fluent_40, p.settings.color2, 0, 0, 48, 48, 2, 2);
		this.checkbox_normal_on.ReleaseGraphics();
		this.checkbox_normal_on.Resize(button_zoomSize, button_zoomSize);

		this.checkbox_hover_on = utils.CreateImage(48, 48);
		gb = this.checkbox_hover_on.GetGraphics();
		gb.WriteTextSimple(chars.check_on, g_font_fluent_40, p.settings.color2, 0, 0, 48, 48, 2, 2);
		this.checkbox_hover_on.ReleaseGraphics();
		this.checkbox_hover_on.Resize(button_zoomSize, button_zoomSize);

		if (this.status) {
			this.button = new button(this.checkbox_normal_on, this.checkbox_hover_on, this.checkbox_hover_on);
		} else {
			this.button = new button(this.checkbox_normal_off, this.checkbox_hover_off, this.checkbox_hover_off);
		}
	}
	this.setButtons();

	this.draw = function (gr) {
		this.status = eval(this.linkedVariable);
		if (this.status != this.prevStatus) {
			var button_zoomSize = g_z16;
			if (this.status) {
				this.button.update(this.checkbox_normal_on, this.checkbox_hover_on, this.checkbox_hover_on);
			} else {
				this.button.update(this.checkbox_normal_off, this.checkbox_hover_off, this.checkbox_hover_off);
			}
			this.prevStatus = this.status;
		}
		this.ly = this.y - (p.settings.pages[this.parentPageId].offset * cSettings.rowHeight);
		if (this.ly > cSettings.topBarHeight) {
			var button_y = this.ly - 1 + Math.ceil((p.settings.txtHeight + 10 - this.button.h) / 2);
			this.button.draw(gr, this.x, button_y);
			var label_x = this.x + this.button.w + 5;
			gr.WriteTextSimple(this.label, g_font_12_bold, (this.status ? p.settings.color2 : p.settings.color1), label_x, this.ly, p.settings.w, p.settings.txtHeight + 10, 0, 2, 1);
		}
	}

	this.on_mouse = function (event, x, y, delta) {
		if (this.ly <= cSettings.topBarHeight) {
			return;
		}
		var state = this.button.checkstate(event, x, y);
		switch (event) {
		case "lbtn_up":
			if (state == ButtonStates.hover) {
				this.status = !this.status;
				eval(this.func + "(" + this.id + "," + this.status + "," + this.parentPageId + ")");
			}
			break;
		}
		return state;
	}
}

function oRadioButton(id, x, y, label, status, parentPageId) {
	this.objType = "RB";
	this.id = id;
	this.x = x;
	this.y = y;
	this.parentPageId = parentPageId;
	this.ly = this.y - (p.settings.pages[this.parentPageId].offset * cSettings.rowHeight);
	this.label = label;
	this.status = status;
	this.func = "settings_radioboxes_action";

	this.setButtons = function () {
		var gb
		var button_zoomSize = g_z16;

		this.radiobt_normal_off = utils.CreateImage(48, 48);
		gb = this.radiobt_normal_off.GetGraphics();
		gb.WriteTextSimple(chars.radio_off, g_font_fluent_40, p.settings.color1, 0, 0, 48, 48, 2, 2);
		this.radiobt_normal_off.ReleaseGraphics();
		this.radiobt_normal_off.Resize(button_zoomSize, button_zoomSize);

		this.radiobt_hover_off = utils.CreateImage(48, 48);
		gb = this.radiobt_hover_off.GetGraphics();
		gb.WriteTextSimple(chars.radio_off, g_font_fluent_40, p.settings.color1, 0, 0, 48, 48, 2, 2);
		this.radiobt_hover_off.ReleaseGraphics();
		this.radiobt_hover_off.Resize(button_zoomSize, button_zoomSize);

		this.radiobt_normal_on = utils.CreateImage(48, 48);
		var gb = this.radiobt_normal_on.GetGraphics();
		gb.WriteTextSimple(chars.radio_on, g_font_fluent_40, p.settings.color2, 0, 0, 48, 48, 2, 2);;
		this.radiobt_normal_on.ReleaseGraphics();
		this.radiobt_normal_on.Resize(button_zoomSize, button_zoomSize);

		this.radiobt_hover_on = utils.CreateImage(48, 48);
		gb = this.radiobt_hover_on.GetGraphics();
		gb.WriteTextSimple(chars.radio_on, g_font_fluent_40, p.settings.color2, 0, 0, 48, 48, 2, 2);
		this.radiobt_hover_on.ReleaseGraphics();
		this.radiobt_hover_on.Resize(button_zoomSize, button_zoomSize)

		if (this.status) {
			this.button = new button(this.radiobt_normal_on, this.radiobt_hover_on, this.radiobt_hover_on);
		} else {
			this.button = new button(this.radiobt_normal_off, this.radiobt_hover_off, this.radiobt_hover_off);
		}
	}
	this.setButtons();

	this.draw = function (gr) {
		var button_zoomSize = g_z16;
		if (this.status) {
			this.button.update(this.radiobt_normal_on, this.radiobt_hover_on, this.radiobt_hover_on);
		} else {
			this.button.update(this.radiobt_normal_off, this.radiobt_hover_off, this.radiobt_hover_off);
		}
		this.ly = this.y - (p.settings.pages[this.parentPageId].offset * cSettings.rowHeight);
		if (this.ly > cSettings.topBarHeight) {
			var button_y = this.ly - 1 + Math.ceil((p.settings.txtHeight + 10 - this.button.h) / 2);
			this.button.draw(gr, this.x, button_y);
			var label_x = this.x + this.button.w + 5;
			gr.WriteTextSimple(this.label, g_font_12_bold, (this.status ? p.settings.color2 : p.settings.color1), label_x, this.ly, p.settings.w, p.settings.txtHeight + 10, 0, 2, 1);
		}
	}

	this.on_mouse = function (event, x, y, delta) {
		if (this.ly <= cSettings.topBarHeight) {
			return;
		}
		var state = this.button.checkstate(event, x, y);
		switch (event) {
		case "lbtn_up":
			if (state == ButtonStates.hover) {
				eval(this.func + "(" + this.id + "," + this.status + "," + this.parentPageId + ")");
			}
			break;
		}
		return state;
	}
}

function oTextBox(id, x, y, w, h, label, value, parentPageId) {
	this.objType = "TB";
	this.id = id;
	this.x = x;
	this.y = y;
	this.parentPageId = parentPageId;
	this.ly = this.y - (p.settings.pages[this.parentPageId].offset * cSettings.rowHeight);
	this.w = w;
	this.h = h;
	this.label = label;
	this.value = value;
	this.func = "settings_textboxes_action";

	this.inputbox = new oInputbox(this.w, this.h, this.value, "", this.func + "(" + this.parentPageId + ", " + this.id + ")");

	this.draw = function (gr) {
		this.ly = this.y - (p.settings.pages[this.parentPageId].offset * cSettings.rowHeight);
		if (this.ly + this.h > cSettings.topBarHeight) {
			gr.WriteTextSimple(this.label, g_font_12_bold, p.settings.color1, this.x, this.ly, p.list.w - p.settings.pages[this.parentPageId].scrollbarWidth - 10, this.h, 0, 2, 1);
			this.inputbox.draw(gr, this.x, this.ly + this.h);
		}
	}

	this.on_mouse = function (event, x, y, delta) {
		if (this.ly + this.h <= cSettings.topBarHeight) {
			return;
		}
		if (!p.settings.pages[1].elements[0].ishover) {
			if (this.ly > cSettings.topBarHeight + 5) {
				this.inputbox.check(event, x, y, delta);
			}
		}
	}

	this.on_key_down = function (vkey) {
		this.inputbox.on_key_down(vkey);

		var kmask = GetKeyboardMask();
		// specific action on RETURN for the textbox Object
		if (kmask == KMask.none && vkey == VK_RETURN) {
			if (this.inputbox.edit) {
				this.inputbox.edit = false;
				this.inputbox.text_selected = "";
				this.inputbox.select = false;
				this.inputbox.default_text = this.inputbox.text; // set default text to new value validated
				this.inputbox.repaint();
			}
		}
		// specific action on TAB for the textbox Object
		if (this.inputbox.edit && !g_textbox_tabbed) {
			if (vkey == VK_TAB && (kmask == KMask.none || kmask == KMask.shift)) {
				// cancel textbox edit on current
				this.inputbox.edit = false;
				this.inputbox.text_selected = "";
				this.inputbox.select = false;
				this.inputbox.default_text = this.inputbox.text; // set default text to new value validated
				this.inputbox.SelBegin = 0;
				this.inputbox.SelEnd = 0;
				this.inputbox.repaint();

				if (kmask == KMask.none) {
					// scan elements to find objectType = "TB" / TextBox
					var first_textbox_id = -1;
					var next_textbox_id = -1;
					for (var i = 0; i < p.settings.pages[this.parentPageId].elements.length; i++) {
						if (p.settings.pages[this.parentPageId].elements[i].objType == "TB") {
							if (first_textbox_id < 0) {
								first_textbox_id = i;
							}
							if (next_textbox_id < 0 && i > this.id) {
								next_textbox_id = i;
								break;
							}
						}
					}
					if (next_textbox_id < 0) {
						next_textbox_id = first_textbox_id;
					}
				} else {
					// scan elements to find objectType = "TB" / TextBox
					var first_textbox_id = -1;
					var next_textbox_id = -1;
					var debut = p.settings.pages[this.parentPageId].elements.length - 1;
					for (var i = debut; i >= 0; i--) {
						if (p.settings.pages[this.parentPageId].elements[i].objType == "TB") {
							if (first_textbox_id < 0) {
								first_textbox_id = i;
							}
							if (next_textbox_id < 0 && i < this.id) {
								next_textbox_id = i;
								break;
							}
						}
					}
					if (next_textbox_id < 0) {
						next_textbox_id = first_textbox_id;
					}
				}

				// set focus and edit mode to the next textbox found
				p.settings.pages[this.parentPageId].elements[next_textbox_id].inputbox.on_focus(true);
				p.settings.pages[this.parentPageId].elements[next_textbox_id].inputbox.edit = true;
				p.settings.pages[this.parentPageId].elements[next_textbox_id].inputbox.Cpos = p.settings.pages[this.parentPageId].elements[next_textbox_id].inputbox.text.length; // this.GetCPos(x);
				p.settings.pages[this.parentPageId].elements[next_textbox_id].inputbox.anchor = p.settings.pages[this.parentPageId].elements[next_textbox_id].inputbox.Cpos;
				p.settings.pages[this.parentPageId].elements[next_textbox_id].inputbox.SelBegin = p.settings.pages[this.parentPageId].elements[next_textbox_id].inputbox.Cpos;
				p.settings.pages[this.parentPageId].elements[next_textbox_id].inputbox.SelEnd = p.settings.pages[this.parentPageId].elements[next_textbox_id].inputbox.Cpos;
				p.settings.pages[this.parentPageId].elements[next_textbox_id].inputbox.repaint();
				p.settings.pages[this.parentPageId].elements[next_textbox_id].inputbox.resetCursorTimer();
				g_textbox_tabbed = true;
				// then check if scroll required (update page offset to show the new activated textbox)
				var next_ly = p.settings.pages[this.parentPageId].elements[next_textbox_id].ly;
				if (next_ly < p.settings.pages[this.parentPageId].y + cSettings.rowHeight * 2) {
					var d = Math.ceil((p.settings.pages[this.parentPageId].y + cSettings.rowHeight * 2 - next_ly) / cSettings.rowHeight);
					p.settings.pages[this.parentPageId].offset -= d;
					if (p.settings.pages[this.parentPageId].offset < 0)
						p.settings.pages[this.parentPageId].offset = 0;
					p.settings.pages[this.parentPageId].scrollbar.reSet(p.settings.pages[this.parentPageId].total_rows, cSettings.rowHeight, p.settings.pages[this.parentPageId].offset);
					full_repaint();
				} else if (next_ly > p.settings.pages[this.parentPageId].y + p.settings.pages[this.parentPageId].h - cSettings.rowHeight * 3) {
					var maxOffset = p.settings.pages[this.parentPageId].total_rows - p.settings.pages[this.parentPageId].totalRowsVis;
					var d = Math.ceil((next_ly - (p.settings.pages[this.parentPageId].y + p.settings.pages[this.parentPageId].h) + cSettings.rowHeight * 3) / cSettings.rowHeight);
					p.settings.pages[this.parentPageId].offset += d;
					if (p.settings.pages[this.parentPageId].offset >= maxOffset)
						p.settings.pages[this.parentPageId].offset = maxOffset;
					p.settings.pages[this.parentPageId].scrollbar.reSet(p.settings.pages[this.parentPageId].total_rows, cSettings.rowHeight, p.settings.pages[this.parentPageId].offset);
					full_repaint();
				}
			}
		}
	}

	this.on_char = function (code) {
		this.inputbox.on_char(code);
	}

	this.on_focus = function (is_focused) {
		this.inputbox.on_focus(is_focused);
	}
}

function oListBox(id, objectName, x, y, w, h, row_height, label, arr, selectedId, parentPageId) {
	this.objType = "LB";
	this.rowHeight = row_height;
	this.id = id;
	this.x = x;
	this.y = y;
	this.parentPageId = parentPageId;
	this.ly = this.y - (p.settings.pages[this.parentPageId].offset * cSettings.rowHeight);
	this.w = w;
	this.h = 3 * this.rowHeight;
	this.totalRows = Math.floor(this.h / this.rowHeight);
	this.label = label;
	this.offset = 0;
	this.arr = arr;
	this.total = this.arr.length;
	this.selectedId = selectedId;
	this.func = "settings_listboxes_action";
	this.scrollbar = new ScrollBar(objectName, this.x + this.w - cScrollBar.width, this.ly, cScrollBar.width, this.h, this.arr.length, this.rowHeight);
	this.scrollbarWidth = 0;

	this.showSelected = function (rowId) {
		this.selectedId = rowId;
		if (this.scrollbar.visible) {
			var max_offset = this.total - this.totalRows;
			this.offset = rowId > max_offset ? max_offset : rowId;
			this.scrollbar.updateCursorPos(this.offset);
		} else {
			this.offset = 0;
		}
		eval(this.func + "(" + this.parentPageId + ", " + this.id + ", " + this.selectedId + ")");
	}

	this.reSet = function (list_array) {
		this.arr = list_array;
		this.total = this.arr.length;
		this.max = (this.total > this.totalRows ? this.totalRows : this.total);
		// scrollbar reset
		this.scrollbar.reSet(this.total, this.rowHeight, this.offset);
		if (this.scrollbar.visible) {
			this.scrollbarWidth = this.scrollbar.w;
		} else {
			this.scrollbarWidth = 0;
		}
	}
	this.reSet(this.arr);

	this.resize = function (x, y, w, h, arr) {
		this.x = x;
		this.y = y;
		this.ly = this.y - (p.settings.pages[this.parentPageId].offset * cSettings.rowHeight);
		this.w = w;
		this.h = 3 * this.rowHeight;

		this.arr = arr;
		this.total = this.arr.length;
		this.max = (this.total > this.totalRows ? this.totalRows : this.total);
		this.offset = 0;

		// scrollbar resize
		this.scrollbar.reSize(this.x + this.w - cScrollBar.width, this.ly, cScrollBar.width, this.h, this.arr.length, this.rowHeight, this.offset);
		if (this.scrollbar.visible) {
			this.scrollbarWidth = this.scrollbar.w;
		} else {
			this.scrollbarWidth = 0;
		}
	}

	this.draw = function (gr) {
		var row = 0;
		this.ly = this.y - (p.settings.pages[this.parentPageId].offset * cSettings.rowHeight);

		this.scrollbar.y = this.ly;
		// scrollbar reset
		this.scrollbar.reSet(this.total, this.rowHeight, this.offset);
		if (this.scrollbar.visible) {
			this.scrollbarWidth = this.scrollbar.w;
		} else {
			this.scrollbarWidth = 0;
		}

		// listbox bg
		if (this.label.length > 0) {
			gr.WriteTextSimple(this.label, g_font_12_bold, p.settings.color1, this.x, this.ly - this.rowHeight - g_z2, this.w, this.rowHeight, 0, 2, 1);
		}
		gr.FillRectangle(this.x, this.ly, this.w, this.h + 1, RGB(240, 240, 240));
		gr.DrawRectangle(this.x - 1, this.ly - 1, this.w + 1, this.h + 2, 1, RGB(180, 180, 180));

		// scrollbar
		if (this.scrollbar.visible)
			this.scrollbar.draw(gr);

		// items
		var isCustom = false;
		for (var i = this.offset; i < this.max + this.offset; i++) {
			switch (this.parentPageId) {
			case 1:
				isCustom = (p.headerBar.columns[i].ref.substr(0, 6) == "Custom");
				break;
			case 2:
				isCustom = (p.list.groupby[i].ref.substr(0, 6) == "Custom");
				break;
			}
			if (i == this.selectedId) {
				gr.FillRectangle(this.x + 1, this.ly + row * this.rowHeight + 1, this.w - this.scrollbarWidth - 2, this.rowHeight - 1, RGBA(150, 150, 150, 200));
			}
			gr.WriteTextSimple((isCustom ? "[" : "") + this.arr[i] + (isCustom ? "]" : ""), i == this.selectedId ? g_font_12_bold : g_font_12, (i == this.selectedId ? RGB(0, 0, 0) : RGB(0, 0, 0)), this.x + g_z5, this.ly + row * this.rowHeight, this.w - this.scrollbarWidth - g_z10, this.rowHeight, 0, 2, 1);
			row++;
		}
	}

	this.isHoverObject = function (x, y) {
		var test = (x >= this.x && x <= this.x + this.w && y >= this.ly && y <= this.ly + this.h);
		return test;
	}

	this.on_mouse = function (event, x, y, delta) {
		this.ishover = this.isHoverObject(x, y);
		var maxHeight = this.max * this.rowHeight;
		this.ishoverRow = (x >= this.x && x <= this.x + this.w - this.scrollbarWidth && y >= this.ly && y <= this.ly + maxHeight);

		switch (event) {
		case "lbtn_down":
			if (this.scrollbar.visible)
				this.scrollbar.check(event, x, y, delta);
			// get row number clicked
			if (y > cSettings.topBarHeight + cSettings.rowHeight) {
				if (this.ishoverRow) {
					var new_selectedId = Math.floor((y - this.ly) / this.rowHeight) + this.offset;
					eval(this.func + "(" + this.parentPageId + ", " + this.id + ", " + new_selectedId + ")");
				}
			}
			break;
		case "lbtn_dblclk":
			this.on_mouse("lbtn_down", x, y);
			break;
		case "lbtn_up":
			if (this.scrollbar.visible)
				this.scrollbar.check(event, x, y, delta);
			break;
		case "move":
			if (this.scrollbar.visible)
				this.scrollbar.check(event, x, y, delta);
			break;
		case "wheel":
			if (this.ishover) {
				if (this.scrollbar.visible && this.ishover)
					this.scrollbar.check(event, x, y, delta);
			}
			break;
		}
	}

	this.on_key_down = function (vkey) {
		switch (vkey) {
		case VK_UP:
			var new_selectedId = (this.selectedId > 0 ? this.selectedId - 1 : 0);
			eval(this.func + "(" + this.parentPageId + ", " + this.id + ", " + new_selectedId + ")");
			var row_idx = this.selectedId - this.offset;
			if (row_idx <= 0) {
				this.showSelected(new_selectedId);
			}
			break;
		case VK_DOWN:
			var new_selectedId = (this.selectedId < this.arr.length - 1 ? this.selectedId + 1 : this.arr.length - 1);
			eval(this.func + "(" + this.parentPageId + ", " + this.id + ", " + new_selectedId + ")");
			var row_idx = this.selectedId - this.offset;
			if (row_idx > 2) { // 2 = max index row of the listbox, because listbox height is 3 rows
				this.showSelected(new_selectedId);
			}
			break;
		}
	}
}

function oPage(id, objectName, label, nbrows) {
	this.id = id;
	this.label = label;
	this.elements = [];
	this.offset = 0;
	this.rows = [];
	this.total_rows = nbrows;
	this.x = p.settings.x;
	this.y = p.settings.y + cSettings.topBarHeight;
	this.w = p.settings.w;
	this.h = p.settings.h - cSettings.topBarHeight;
	this.totalRowsVis = Math.floor((this.h - cHeaderBar.height) / cSettings.rowHeight);
	// scrollbar instance
	this.scrollbar = new ScrollBar(objectName, p.settings.x + p.settings.w - cScrollBar.width, p.settings.y + cSettings.topBarHeight + cHeaderBar.height, cScrollBar.width, p.settings.h - cSettings.topBarHeight - cHeaderBar.height, this.total_rows, cSettings.rowHeight);
	this.scrollbarWidth = 0;

	this.init = function () {
		var txtbox_x = 20;
		switch (this.id) {
		case 0: // General
			var rh = cSettings.rowHeight;
			// Layout options
			this.elements.push(new oCheckBox(0, 20, cSettings.topBarHeight + rh * 2.25, "Show Information Panel (toggle = CTRL+I)", "cTopBar.visible", this.id));
			this.elements.push(new oCheckBox(1, 20, cSettings.topBarHeight + rh * 3.25, "Show Header Toolbar (toggle = CTRL+T)", "cHeaderBar.locked", this.id));
			break;
		case 1: // Columns
			// Create Columns ListBox object
			var arr = [];
			var rh = cSettings.rowHeight;
			for (var i = 0; i < p.headerBar.columns.length; i++) {
				arr.push(p.headerBar.columns[i].label);
			}
			var listBoxRowHeight = scale(21);
			var listBoxHeight = Math.floor(wh - (cSettings.topBarHeight + rh * 1.75 + p.settings.txtHeight) - 25);
			var listBoxWidth = scale(100);
			var listBoxCurrentId = 0;
			this.elements.push(new oListBox(0, "p.settings.pages[" + this.id + "].elements[0]", 20, Math.floor(cSettings.topBarHeight + rh * 1.75 + p.settings.txtHeight), listBoxWidth + cScrollBar.width, listBoxHeight, listBoxRowHeight, "Columns", arr, listBoxCurrentId, this.id));

			// Create TextBoxes
			var txtbox_value = p.headerBar.columns[listBoxCurrentId].label;
			this.elements.push(new oTextBox(1, txtbox_x, Math.ceil(cSettings.topBarHeight + rh * 6.25), ww - txtbox_x - 20 - this.scrollbarWidth, cHeaderBar.height, "Label", txtbox_value, this.id));
			txtbox_value = p.headerBar.columns[listBoxCurrentId].tf;
			this.elements.push(new oTextBox(2, txtbox_x, Math.ceil(cSettings.topBarHeight + rh * 8.25), ww - txtbox_x - 20 - this.scrollbarWidth, cHeaderBar.height, "Title Format", txtbox_value, this.id));
			txtbox_value = p.headerBar.columns[listBoxCurrentId].tf2;
			this.elements.push(new oTextBox(3, txtbox_x, Math.ceil(cSettings.topBarHeight + rh * 10.25), ww - txtbox_x - 20 - this.scrollbarWidth, cHeaderBar.height, "Extra Line Title Format", txtbox_value, this.id));
			txtbox_value = p.headerBar.columns[listBoxCurrentId].sortOrder;
			this.elements.push(new oTextBox(4, txtbox_x, Math.ceil(cSettings.topBarHeight + rh * 12.25), ww - txtbox_x - 20 - this.scrollbarWidth, cHeaderBar.height, "Sort Order", txtbox_value, this.id));

			// Create radio buttons
			var spaceBetween_w = scale(80);
			this.elements.push(new oRadioButton(5, txtbox_x, cSettings.topBarHeight + rh * 15.25, "Left", (p.headerBar.columns[listBoxCurrentId].align == 0), this.id));
			this.elements.push(new oRadioButton(6, txtbox_x + spaceBetween_w, cSettings.topBarHeight + rh * 15.25, "Right", (p.headerBar.columns[listBoxCurrentId].align == 1), this.id));
			this.elements.push(new oRadioButton(7, txtbox_x + spaceBetween_w * 2, cSettings.topBarHeight + rh * 15.25, "Centre", (p.headerBar.columns[listBoxCurrentId].align == 2), this.id));

			// checkbox : activate columns Y/N
			this.elements.push(new oCheckBox(0, txtbox_x, cSettings.topBarHeight + rh * 5.25, "Visible", "p.headerBar.columns[p.settings.pages[1].elements[0].selectedId].percent != 0", this.id));

			break;
		case 2: // Groups
			// Create Groups Pattern ListBox object
			var arr = [];
			var rh = cSettings.rowHeight;
			for (var i = 0; i < p.list.groupby.length; i++) {
				arr.push(p.list.groupby[i].label);
			}
			var listBoxRowHeight = scale(21);
			var listBoxHeight = Math.floor(wh - (cSettings.topBarHeight + rh * 1.75 + p.settings.txtHeight) - 25);
			var listBoxWidth = scale(170);
			var listBoxCurrentId = cGroup.pattern_idx;
			this.elements.push(new oListBox(0, "p.settings.pages[" + this.id + "].elements[0]", 20, Math.floor(cSettings.topBarHeight + rh * 1.75 + p.settings.txtHeight), listBoxWidth + cScrollBar.width, listBoxHeight, listBoxRowHeight, "Group by", arr, listBoxCurrentId, this.id));

			// Create TextBoxes
			var txtbox_value = p.list.groupby[listBoxCurrentId].label;
			this.elements.push(new oTextBox(1, txtbox_x, Math.ceil(cSettings.topBarHeight + rh * 4.5), ww - txtbox_x - 20 - this.scrollbarWidth, cHeaderBar.height, "Label", txtbox_value, this.id));
			txtbox_value = p.list.groupby[listBoxCurrentId].tf;
			this.elements.push(new oTextBox(2, txtbox_x, Math.ceil(cSettings.topBarHeight + rh * 6.5), ww - txtbox_x - 20 - this.scrollbarWidth, cHeaderBar.height, "Title Format", txtbox_value, this.id));

			var spaceBetween_w = scale(50);
			// force value if set to an unauthirized one [1;4]
			if (p.list.groupby[listBoxCurrentId].expandedHeight < 1 || p.list.groupby[listBoxCurrentId].expandedHeight > 4) {
				p.list.groupby[listBoxCurrentId].expandedHeight = (p.list.groupby[listBoxCurrentId].expandedHeight < 1 ? 1 : 4);
				p.list.saveGroupBy();
			}
			var v = p.list.groupby[listBoxCurrentId].expandedHeight;
			this.elements.push(new oRadioButton(3, txtbox_x, cSettings.topBarHeight + rh * 9.75, "1", (v == 1), this.id));
			this.elements.push(new oRadioButton(4, txtbox_x + spaceBetween_w, cSettings.topBarHeight + rh * 9.75, "2", (v == 2), this.id));
			this.elements.push(new oRadioButton(5, txtbox_x + spaceBetween_w * 2, cSettings.topBarHeight + rh * 9.75, "3", (v == 3), this.id));
			this.elements.push(new oRadioButton(6, txtbox_x + spaceBetween_w * 3, cSettings.topBarHeight + rh * 9.75, "4", (v == 4), this.id));

			// Create checkbox Cover Art in Group Header ON/OFF
			this.elements.push(new oCheckBox(7, txtbox_x, cSettings.topBarHeight + rh * 11.75, "Enable Cover", "p.list.groupby[p.settings.pages[2].elements[0].selectedId].showCover != 0", this.id));

			var txtbox_value = p.list.groupby[listBoxCurrentId].l1;
			this.elements.push(new oTextBox(8, txtbox_x, cSettings.topBarHeight + rh * 13, ww - txtbox_x - 20 - this.scrollbarWidth, cHeaderBar.height, "Header line 1, left field", txtbox_value, this.id));
			txtbox_value = p.list.groupby[listBoxCurrentId].r1;
			this.elements.push(new oTextBox(9, txtbox_x, cSettings.topBarHeight + rh * 15, ww - txtbox_x - 20 - this.scrollbarWidth, cHeaderBar.height, "Header line 1, right field", txtbox_value, this.id));
			txtbox_value = p.list.groupby[listBoxCurrentId].l2;
			this.elements.push(new oTextBox(10, txtbox_x, cSettings.topBarHeight + rh * 17, ww - txtbox_x - 20 - this.scrollbarWidth, cHeaderBar.height, "Header line 2, left field", txtbox_value, this.id));
			txtbox_value = p.list.groupby[listBoxCurrentId].r2;
			this.elements.push(new oTextBox(11, txtbox_x, cSettings.topBarHeight + rh * 19, ww - txtbox_x - 20 - this.scrollbarWidth, cHeaderBar.height, "Header line 2, right field", txtbox_value, this.id));
			break;
		case 3: // Appearance
			var rh = cSettings.rowHeight;
			// Create checkbox enable wpp
			this.elements.push(new oCheckBox(0, 20, cSettings.topBarHeight + rh * 2.25, "Enabled", "properties.showwallpaper", this.id));

			// Create radio buttons / Wpp Image
			var spaceBetween_w = scale(80);
			// force value if set to an unauthirized one (default = 0 <=> front album cover)
			if (properties.wallpapertype != 0 && properties.wallpapertype != 4 && properties.wallpapertype != -1) {
				properties.wallpapertype = 0;
				window.SetProperty("JSPLAYLIST.Wallpaper Type", properties.wallpapertype);
			}
			this.elements.push(new oRadioButton(1, txtbox_x, cSettings.topBarHeight + rh * 4, "Album", (properties.wallpapertype == 0), this.id));
			this.elements.push(new oRadioButton(2, txtbox_x + spaceBetween_w, cSettings.topBarHeight + rh * 4, "Artist", (properties.wallpapertype == 4), this.id));
			this.elements.push(new oRadioButton(3, txtbox_x + spaceBetween_w * 2, cSettings.topBarHeight + rh * 4, "Default", (properties.wallpapertype == -1), this.id));

			// Create checkbox blur effect
			this.elements.push(new oCheckBox(4, 20, cSettings.topBarHeight + rh * 5.75, "Blurred", "properties.wallpaperblurred", this.id));

			// Create TextBox Wpp path of default image
			var txtbox_value = properties.wallpaperpath;
			this.elements.push(new oTextBox(5, txtbox_x, Math.ceil(cSettings.topBarHeight + rh * 6.75), ww - txtbox_x - 20 - this.scrollbarWidth, cHeaderBar.height, "Default Wallpaper Path", txtbox_value, this.id));
			break;
		}
	}

	this.reSet = function () {
		this.elements.splice(0, this.elements.length);
		// scrollbar reset
		this.offset = 0;
		this.scrollbar.reSet(this.total_rows, cSettings.rowHeight, this.offset);
		if (this.scrollbar.visible) {
			this.scrollbarWidth = this.scrollbar.w;
		} else {
			this.scrollbarWidth = 0;
		}
		this.init();
	}

	this.setSize = function () {
		this.x = p.settings.x;
		this.y = p.settings.y + cSettings.topBarHeight;
		this.w = p.settings.w;
		this.h = p.settings.h - cSettings.topBarHeight;

		this.elements.splice(0, this.elements.length);

		// scrollbar resize
		this.offset = 0;
		this.scrollbar.reSize(p.settings.x + p.settings.w - cScrollBar.width, p.settings.y + cSettings.topBarHeight + cHeaderBar.height, cScrollBar.width, p.settings.h - cSettings.topBarHeight - cHeaderBar.height, this.total_rows, cSettings.rowHeight, this.offset);
		if (this.scrollbar.visible) {
			this.scrollbarWidth = this.scrollbar.w;
		} else {
			this.scrollbarWidth = 0;
		}
		this.init();
	}

	this.draw = function (gr) {
		for (var i = 0; i < this.elements.length; i++) {
			this.elements[i].draw(gr);
		}

		// draw extra elements
		var rh = cSettings.rowHeight;
		var txtbox_x = 20;

		switch (this.id) {
		case 0:
			gr.WriteTextSimple("Layout", g_font_12_bold, p.settings.color1, txtbox_x, cSettings.topBarHeight + rh * 1.5 - (this.offset * cSettings.rowHeight), p.settings.w - 10, p.settings.txtHeight + 10, 0, 2, 1);
			break;
		case 1:
			var listBoxWidth = scale(100);
			var listBox_button_x = listBoxWidth + scale(50);
			gr.WriteTextSimple("Status", g_font_12_bold, p.settings.color1, txtbox_x, cSettings.topBarHeight + rh * 4.5 - (this.offset * cSettings.rowHeight), p.settings.w - 10, p.settings.txtHeight + 10, 0, 2, 1);
			gr.WriteTextSimple("Text Alignment", g_font_12_bold, p.settings.color1, txtbox_x, cSettings.topBarHeight + rh * 14.5 - (this.offset * cSettings.rowHeight), p.settings.w - 10, p.settings.txtHeight + 10, 0, 2, 1);

			// new column button
			var ny = Math.floor(cSettings.topBarHeight + rh * 2.1) - (this.offset * cSettings.rowHeight);
			if (p.headerBar.columns.length < properties.max_columns) {
				p.settings.newbutton.draw(gr, listBox_button_x, ny);
			}
			// delete user column button
			var dy = Math.floor(cSettings.topBarHeight + rh * 2.1 + g_z5 + p.settings.newbutton.h) - (this.offset * cSettings.rowHeight);
			var idx = p.settings.pages[1].elements[0].selectedId;
			if (p.headerBar.columns[idx].ref.indexOf("Custom") == 0) {
				p.settings.delbutton.draw(gr, listBox_button_x, dy);
			}
			break;
		case 2:
			var listBoxWidth = scale(170);
			var listBox_button_x = listBoxWidth + scale(50);
			// new pattern button
			var ny = Math.floor(cSettings.topBarHeight + rh * 2.1) - (this.offset * cSettings.rowHeight);
			if (p.headerBar.columns.length < properties.max_columns) {
				p.settings.newbuttonPattern.draw(gr, listBox_button_x, ny);
			}
			// delete pattern button
			var dy = Math.floor(cSettings.topBarHeight + rh * 2.1 + g_z5 + p.settings.newbuttonPattern.h) - (this.offset * cSettings.rowHeight);
			var idx = p.settings.pages[2].elements[0].selectedId;
			if (p.list.groupby[idx].ref.indexOf("Custom") == 0) {
				p.settings.delbuttonPattern.draw(gr, listBox_button_x, dy);
			}

			gr.FillRectangle(txtbox_x, cSettings.topBarHeight + rh * 8.5 - (this.offset * cSettings.rowHeight), ww - txtbox_x - 20 - this.scrollbarWidth, cHeaderBar.borderWidth, p.settings.color1);

			gr.WriteTextSimple("Row Height", g_font_12_bold, p.settings.color1, txtbox_x, cSettings.topBarHeight + rh * 8.75 - (this.offset * cSettings.rowHeight), p.settings.w - 10, p.settings.txtHeight + 10, 0, 2, 1);
			gr.WriteTextSimple("Cover Art Status", g_font_12_bold, p.settings.color1, txtbox_x, cSettings.topBarHeight + rh * 10.75 - (this.offset * cSettings.rowHeight), p.settings.w - 10, p.settings.txtHeight + 10, 0, 2, 1);
			break;
		case 3:
			gr.WriteTextSimple("Wallpaper Status", g_font_12_bold, p.settings.color1, txtbox_x, cSettings.topBarHeight + rh * 1.5 - (this.offset * cSettings.rowHeight), p.settings.w - 10, p.settings.txtHeight + 10, 0, 2, 1);
			gr.WriteTextSimple("Wallpaper Image", g_font_12_bold, p.settings.color1, txtbox_x, cSettings.topBarHeight + rh * 3.25 - (this.offset * cSettings.rowHeight), p.settings.w - 10, p.settings.txtHeight + 10, 0, 2, 1);
			gr.WriteTextSimple("Wallpaper Effects", g_font_12_bold, p.settings.color1, txtbox_x, cSettings.topBarHeight + rh * 5 - (this.offset * cSettings.rowHeight), p.settings.w - 10, p.settings.txtHeight + 10, 0, 2, 1);
			break;
		}

		// draw scrollbar
		if (this.scrollbarWidth > 0) {
			this.scrollbar.drawXY(gr, p.settings.x + p.settings.w - cScrollBar.width, p.settings.y + cSettings.topBarHeight + cHeaderBar.height);
		}
	}

	this.newButtonCheck = function (event, x, y) {
		if (p.headerBar.columns.length >= properties.max_columns)
			return;

		var state = p.settings.newbutton.checkstate(event, x, y);
		switch (event) {
		case "lbtn_up":
			if (state == ButtonStates.hover) {
				// action
				var no_user = 1;
				var tmp_array = [];
				// copy columns array to a tmp array in order to sort it
				for (var i = 0; i < p.headerBar.columns.length; i++) {
					tmp_array.push(p.headerBar.columns[i].ref);
				}
				tmp_array.sort();
				// get free number to affect to the new User column to create
				for (var i = 0; i < tmp_array.length; i++) {
					if (tmp_array[i].substr(0, 6) == "Custom") {
						if (tmp_array[i].substr(tmp_array[i].length - 2, 2) == num(no_user, 2)) {
							no_user++;
						}
					}
				}

				p.headerBar.columns.push(new oColumn("Custom " + num(no_user, 2), "", "", 0, "Custom " + num(no_user, 2), 0, ""));
				p.headerBar.totalColumns++;
				var arr = [];
				for (var i = 0; i < p.headerBar.columns.length; i++) {
					arr.push(p.headerBar.columns[i].ref);
				}
				p.settings.pages[1].elements[0].reSet(arr);
				p.headerBar.saveColumns();
				p.settings.pages[1].elements[0].showSelected(p.headerBar.columns.length - 1);
				full_repaint();
			}
			break;
		}
		return state;
	}

	this.delButtonCheck = function (event, x, y) {
		if (p.headerBar.columns.length <= 14)
			return;

		var state = p.settings.delbutton.checkstate(event, x, y);
		switch (event) {
		case "lbtn_up":
			if (state == ButtonStates.hover) {
				// action
				var idx = p.settings.pages[1].elements[0].selectedId;
				var ref = p.headerBar.columns[idx].ref;
				if (ref.substr(0, 6) == "Custom") {
					// if the column is visible, percent are to be adjusted on other visible columns before deletinf it
					if (p.headerBar.columns[idx].percent > 0) {
						// check if it's not the last column visible, otherwise, we coundn't hide it!
						var nbvis = 0;
						for (var k = 0; k < p.headerBar.columns.length; k++) {
							if (p.headerBar.columns[k].percent > 0) {
								nbvis++;
							}
						}
						if (nbvis > 1) {
							var RemovedColumnSize = Math.abs(p.headerBar.columns[idx].percent);
							p.headerBar.columns[idx].percent = 0;
							var totalColsToResizeUp = 0;
							var last_idx = 0;
							for (var k = 0; k < p.headerBar.columns.length; k++) {
								if (k != idx && p.headerBar.columns[k].percent > 0) {
									totalColsToResizeUp++;
									last_idx = k;
								}
							}
							var add_value = Math.floor(RemovedColumnSize / totalColsToResizeUp);
							var reste = RemovedColumnSize - (add_value * totalColsToResizeUp);
							for (var k = 0; k < p.headerBar.columns.length; k++) {
								if (k != idx && p.headerBar.columns[k].percent > 0) {
									p.headerBar.columns[k].percent = Math.abs(p.headerBar.columns[k].percent) + add_value;
									if (reste > 0 && k == last_idx) {
										p.headerBar.columns[k].percent = Math.abs(p.headerBar.columns[k].percent) + reste;
									}
								}
								p.headerBar.columns[k].w = Math.abs(p.headerBar.w * p.headerBar.columns[k].percent / 100000);
							}
						} else {
							// it's the last column visible, delete not possile for now !!!
							return false;
						}
					}
					// ok, NOW we can delete this column, let's do it!
					var tmp_array = p.headerBar.columns.slice(0, p.headerBar.columns.length);
					p.headerBar.columns.splice(0, p.headerBar.columns.length);
					for (var i = 0; i < tmp_array.length; i++) {
						if (i != idx) {
							p.headerBar.columns.push(tmp_array[i]);
						}
					}
					p.headerBar.totalColumns--;
					var arr = [];
					for (var i = 0; i < p.headerBar.columns.length; i++) {
						arr.push(p.headerBar.columns[i].ref);
					}
					p.settings.pages[1].elements[0].reSet(arr);
					p.headerBar.saveColumns();
					var new_idx = (idx == 0 ? 0 : idx - 1);
					p.settings.pages[1].elements[0].showSelected(new_idx);
					full_repaint();
				} else {
					// we could not delete a native column!
					return false;
				}
			}
			break;
		}
		return state;
	}

	this.newButtonPatternCheck = function (event, x, y) {
		if (p.list.groupby.length >= properties.max_patterns)
			return;

		var state = p.settings.newbuttonPattern.checkstate(event, x, y);
		switch (event) {
		case "lbtn_up":
			if (state == ButtonStates.hover) {
				p.list.groupby.push(new oGroupBy("Custom", "Pattern to customise", "", "0", "2", "3", "1", "0", "0", "-", "-", "-", "-"));
				p.list.totalGroupBy++;
				var arr = [];
				for (var i = 0; i < p.list.groupby.length; i++) {
					arr.push(p.list.groupby[i].label);
				}
				p.settings.pages[2].elements[0].reSet(arr);
				p.list.saveGroupBy();
				p.settings.pages[2].elements[0].showSelected(p.list.groupby.length - 1);
				full_repaint();
			}
			break;
		}
		return state;
	}

	this.delButtonPatternCheck = function (event, x, y) {
		if (p.headerBar.columns.length <= 2)
			return;

		var state = p.settings.delbuttonPattern.checkstate(event, x, y);
		switch (event) {
		case "lbtn_up":
			if (state == ButtonStates.hover) {
				// action
				var idx = p.settings.pages[2].elements[0].selectedId;
				var ref = p.list.groupby[idx].ref;
				if (ref.substr(0, 6) == "Custom") {
					var tmp_array = p.list.groupby.slice(0, p.list.groupby.length);
					p.list.groupby.splice(0, p.list.groupby.length);
					for (var i = 0; i < tmp_array.length; i++) {
						if (i != idx) {
							p.list.groupby.push(tmp_array[i]);
						}
					}
					p.list.totalGroupBy--;
					var arr = [];
					for (var i = 0; i < p.list.groupby.length; i++) {
						arr.push(p.list.groupby[i].label);
					}
					p.settings.pages[2].elements[0].reSet(arr);
					p.list.saveGroupBy();
					var new_idx = (idx == 0 ? 0 : idx - 1);
					p.settings.pages[2].elements[0].showSelected(new_idx);

					// reset pattern index after removing the selected one
					if (idx == cGroup.pattern_idx) {
						cGroup.pattern_idx = 0;
						window.SetProperty("JSPLAYLIST.GROUPBY2.INDEX", cGroup.pattern_idx);
						p.list.updateHandleList();
						p.list.setItems(true);
						p.scrollbar.setCursor(p.list.totalRowVisible, p.list.totalRows, p.list.offset);
					}
					full_repaint();
				} else {
					// we could not delete a native "Group By" pattern!
					return false;
				}
			}
			break;
		}
		return state;
	}

	this.on_mouse = function (event, x, y, delta) {
		this.ishover = (x >= this.x && x <= this.x + this.w && y >= this.y && y <= this.y + this.h);
		switch (this.id) {
		case 1:
			var isHoverListBox = this.elements[0].isHoverObject(x, y);
			break;
		case 2:
			var isHoverListBox = this.elements[0].isHoverObject(x, y);
			break;
		default:
			var isHoverListBox = false;
		}

		switch (event) {
		case "lbtn_dblclk":
			this.on_mouse("lbtn_down", x, y);
			break;
		case "lbtn_down":
		case "lbtn_up":
		case "move":
		case "wheel":
			if (this.ishover) {
				if (!isHoverListBox) {
					if (this.scrollbar.visible) {
						this.scrollbar.check(event, x, y, delta);
					}
				}
			}
			break;
		}

		switch (this.id) {
		case 1:
			if (this.delButtonCheck(event, x, y) != ButtonStates.hover) {
				if (this.newButtonCheck(event, x, y) != ButtonStates.hover) {
					for (var i = 0; i < this.elements.length; i++) {
						this.elements[i].on_mouse(event, x, y, delta);
					}
				}
			}
			break;
		case 2:
			if (this.delButtonPatternCheck(event, x, y) != ButtonStates.hover) {
				if (this.newButtonPatternCheck(event, x, y) != ButtonStates.hover) {
					for (var i = 0; i < this.elements.length; i++) {
						this.elements[i].on_mouse(event, x, y, delta);
					}
				}
			}
			break;
		default:
			for (var i = 0; i < this.elements.length; i++) {
				this.elements[i].on_mouse(event, x, y, delta);
			}
		}
	}
}

function oSettings() {
	this.pages = [];
	this.tabButtons = [];
	this.currentPageId = 0;

	this.setButtons = function () {
		this.color1 = setAlpha(g_colour_text, 200);
		this.color2 = g_colour_text;

		var rect_w = "Delete Pattern".calc_width(g_font_12_bold) + 30;
		var rect_h = scale(32);

		// Add a Custom Column
		var newColumn_off = utils.CreateImage(rect_w, rect_h);
		gb = newColumn_off.GetGraphics();
		gb.DrawRectangle(0, 0, rect_w - 1, rect_h - 1, 1, this.color1);
		gb.WriteTextSimple("New Column", g_font_12_bold, this.color2, 0, 0, rect_w, rect_h, 2, 2);
		newColumn_off.ReleaseGraphics();

		var newColumn_ov = utils.CreateImage(rect_w, rect_h);
		gb = newColumn_ov.GetGraphics();
		gb.DrawRectangle(1, 1, rect_w - 2, rect_h - 2, 2, this.color1);
		gb.WriteTextSimple("New Column", g_font_12_bold, this.color2, 0, 0, rect_w, rect_h, 2, 2);
		newColumn_ov.ReleaseGraphics();

		this.newbutton = new button(newColumn_off, newColumn_ov, newColumn_ov);

		// Delete a Custom Column
		var delColumn_off = utils.CreateImage(rect_w, rect_h);
		gb = delColumn_off.GetGraphics();
		gb.DrawRectangle(0, 0, rect_w - 1, rect_h - 1, 1, this.color1);
		gb.WriteTextSimple("Delete Column", g_font_12_bold, this.color2, 0, 0, rect_w, rect_h, 2, 2);
		delColumn_off.ReleaseGraphics();

		var delColumn_ov = utils.CreateImage(rect_w, rect_h);
		gb = delColumn_ov.GetGraphics();
		gb.DrawRectangle(1, 1, rect_w - 2, rect_h - 2, 2, this.color1);
		gb.WriteTextSimple("Delete Column", g_font_12_bold, this.color2, 0, 0, rect_w, rect_h, 2, 2);
		delColumn_ov.ReleaseGraphics();

		this.delbutton = new button(delColumn_off, delColumn_ov, delColumn_ov);

		// Add a Custom "Group By" Pattern
		var newPattern_off = utils.CreateImage(rect_w, rect_h);
		gb = newPattern_off.GetGraphics();
		gb.DrawRectangle(0, 0, rect_w - 1, rect_h - 1, 1, this.color1);
		gb.WriteTextSimple("New Pattern", g_font_12_bold, this.color2, 0, 0, rect_w, rect_h, 2, 2);
		newPattern_off.ReleaseGraphics();

		var newPattern_ov = utils.CreateImage(rect_w, rect_h);
		gb = newPattern_ov.GetGraphics();
		gb.DrawRectangle(1, 1, rect_w - 2, rect_h - 2, 2, this.color1);
		gb.WriteTextSimple("New Pattern", g_font_12_bold, this.color2, 0, 0, rect_w, rect_h, 2, 2);
		newPattern_ov.ReleaseGraphics();

		this.newbuttonPattern = new button(newPattern_off, newPattern_ov, newPattern_ov);

		// Delete a Custom "Group By" Pattern
		var delPattern_off = utils.CreateImage(rect_w, rect_h);
		gb = delPattern_off.GetGraphics();
		gb.DrawRectangle(0, 0, rect_w - 1, rect_h - 1, 1, this.color1);
		gb.WriteTextSimple("Delete Pattern", g_font_12_bold, this.color2, 0, 0, rect_w, rect_h, 2, 2);
		delPattern_off.ReleaseGraphics();

		var delPattern_ov = utils.CreateImage(rect_w, rect_h);
		gb = delPattern_ov.GetGraphics();
		gb.DrawRectangle(1, 1, rect_w - 2, rect_h - 2, 2, this.color1);
		gb.WriteTextSimple("Delete Pattern", g_font_12_bold, this.color2, 0, 0, rect_w, rect_h, 2, 2);
		delPattern_ov.ReleaseGraphics();

		this.delbuttonPattern = new button(delPattern_off, delPattern_ov, delPattern_ov);

		button_zoomSize = scale(25);

		var close_off = utils.CreateImage(75, 75);
		gb = close_off.GetGraphics();
		gb.FillRectangle(18, 36, 39, 6, this.color2);
		gb.DrawLine(18, 36, 33, 21, 3, this.color2);
		gb.DrawLine(21, 36, 36, 21, 3, this.color2);
		gb.DrawLine(18, 39, 33, 54, 3, this.color2);
		gb.DrawLine(21, 39, 36, 54, 3, this.color2);
		close_off.ReleaseGraphics();
		close_off.Resize(button_zoomSize, button_zoomSize)

		var close_ov = utils.CreateImage(75, 75);
		gb = close_ov.GetGraphics();

		gb.FillRectangle(18, 36, 39, 6, this.color1);
		gb.DrawLine(18, 36, 33, 21, 3, this.color1);
		gb.DrawLine(21, 36, 36, 21, 3, this.color1);
		gb.DrawLine(18, 39, 33, 54, 3, this.color1);
		gb.DrawLine(21, 39, 36, 54, 3, this.color1);
		close_ov.ReleaseGraphics();
		close_ov.Resize(button_zoomSize, button_zoomSize)

		this.closebutton = new button(close_off, close_ov, close_ov);

		for (var p = 0; p < this.pages.length; p++) {
			for (var e = 0; e < this.pages[p].elements.length; e++) {
				switch (this.pages[p].elements[e].objType) {
				case "CB":
				case "RB":
					this.pages[p].elements[e].setButtons();
					break;
				}
			}
		}

		this.tab_width = "Appearance".calc_width(g_font_12_bold) + cSettings.tabPaddingWidth;
		this.tab_height = this.txtHeight + scale(10) + cHeaderBar.borderWidth;
		this.tab_img = utils.CreateImage(this.tab_width, this.tab_height);
		this.tabButtons = [];
	}

	this.setSize = function (x, y, w, h) {
		this.x = x;
		this.y = y;
		this.w = w;
		this.h = h;
		this.txtHeight = scale(12);
		this.setButtons();

		if (this.pages.length == 0) {
			this.pages.push(new oPage(0, "p.settings.pages[0]", "General", 7));
			this.pages.push(new oPage(1, "p.settings.pages[1]", "Columns", 16));
			this.pages.push(new oPage(2, "p.settings.pages[2]", "Groups", 23));
			this.pages.push(new oPage(3, "p.settings.pages[3]", "Appearance", 11));
		}

		for (var i = 0; i < this.pages.length; i++) {
			this.pages[i].setSize();
			this.tabButtons.push(new button(this.tab_img, this.tab_img, this.tab_img));
		}
	}

	this.draw = function (gr) {
		var tx = scale(20);
		var ty = cSettings.topBarHeight - 1;

		// draw main background
		gr.FillRectangle(this.x, this.y, this.w, this.h, g_colour_background);

		// draw current page content
		this.pages[this.currentPageId].draw(gr);

		// draw top background
		gr.FillRectangle(this.x, this.y, this.w, (ty + this.tab_height), blendColours(g_colour_background, g_colour_text, 0.05));
		gr.FillRectangle(this.x, this.y + (ty + this.tab_height) - 1, this.w, 2, this.color1);

		// draw close button
		this.closebutton.draw(gr, this.x + 13, this.y + 10);
		// draw Panel Title
		gr.WriteTextSimple("Panel Settings", g_font_20_bold, this.color2, this.x + this.closebutton.w + 20, this.y + 10, this.w - 50, height(g_font_20_bold), 0, 2, 1);

		// draw tabs
		for (var i = 0; i < this.tabButtons.length; i++) {
			var x = tx + (i * this.tab_width);
			this.tabButtons[i].x = x;
			this.tabButtons[i].y = ty;

			if (i == this.currentPageId) {
				gr.DrawRectangle(x, ty, this.tab_width, this.tab_height, 1, this.color1);
				gr.FillRectangle(x + 1, ty + 1, this.tab_width - 2, this.tab_height, g_colour_background);
				gr.WriteTextSimple(this.pages[i].label, g_font_12_bold, this.color2, x, ty, this.tab_width, this.tab_height, 2, 2, 1);
			} else {
				gr.WriteTextSimple(this.pages[i].label, g_font_12_bold, this.color1, x, ty, this.tab_width, this.tab_height, 2, 2, 1);
			}
		}

		//gr.FillRectangle(this.x, this.y + (ty + this.tab_height), this.w - cScrollBar.width, 4, g_colour_background);
		//gr.FillRectangle(this.x, this.y + (ty + this.tab_height) + 4, this.w - cScrollBar.width, g_z10, g_colour_background);
	}

	this.closeButtonCheck = function (event, x, y) {
		var state = this.closebutton.checkstate(event, x, y);
		switch (event) {
		case "lbtn_up":
			if (state == ButtonStates.hover) {
				// action
				cSettings.visible = false;
				this.closebutton.state = ButtonStates.normal;
				resize_panels();
				update_playlist();
				p.playlistManager.refresh();
				full_repaint();
			}
			break;
		}
		return state;
	}

	this.on_mouse = function (event, x, y, delta) {
		var found = false;
		if (this.closeButtonCheck(event, x, y) != ButtonStates.hover) {
			for (var i = 0; i < this.tabButtons.length; i++) {
				var state = this.tabButtons[i].checkstate(event, x, y);
				switch (event) {
				case "lbtn_up":
					if (state == ButtonStates.hover) {
						// action
						found = true;
						this.currentPageId = i;
						this.tabButtons[i].state = ButtonStates.normal;
						full_repaint();
					}
					break;
				}
			}
			if (!found) {
				this.pages[this.currentPageId].on_mouse(event, x, y, delta);
			}
		}
	}
}
