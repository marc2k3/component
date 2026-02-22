'use strict';

window.DefineScript('Menu Button', {author:'marc2003'});
include(fb.ComponentPath + 'helpers.js');
includeJS('lodash.min.js');
includeJS('common.js');

const colours = {
	buttons : RGB(255, 255, 255),
	background : RGB(196, 30, 35)
};

let buttons = new Buttons();
let bs = Scale(24);

buttons.buttons.menu = new Button(0, 0, bs, bs, { char : chars.menu, colour : colours.buttons }, null, function () { Menu(0, bs); }, 'Menu');

function on_mouse_lbtn_up(x, y, mask) {
	buttons.lbtn_up(x, y, mask);
}

function on_mouse_leave() {
	buttons.leave();
}

function on_mouse_move(x, y) {
	buttons.move(x, y);
}

function on_mouse_rbtn_up(x, y) {
	return Help(x, y);
}

function on_paint(gr) {
	gr.Clear(colours.background);
	buttons.paint(gr);
}
