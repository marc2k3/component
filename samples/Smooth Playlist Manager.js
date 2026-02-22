'use strict';

window.DefineScript(
	'Smooth Playlist Manager',
	{
		author : 'Br3tt aka Falstaff',
		features : {
			drag_n_drop : true,
			grab_focus : true
		}
	}
);

include(fb.ComponentPath + 'helpers.txt');
include(Paths.smooth + 'common.js');
include(Paths.smooth + 'inputbox.js');
include(Paths.smooth + 'scrollbar.js');
include(Paths.smooth + 'jsspm.js');
