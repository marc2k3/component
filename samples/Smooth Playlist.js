'use strict';

window.DefineScript(
	'Smooth Playlist',
	{
		author : 'Br3tt aka Falstaff',
		features : {
			drag_n_drop : true,
			grab_focus : true
		}
	}
);

include(fb.ComponentPath + 'helpers.js');
include(Paths.smooth + 'common.js');
include(Paths.smooth + 'inputbox.js');
include(Paths.smooth + 'scrollbar.js');
include(Paths.smooth + 'jssp.js');
