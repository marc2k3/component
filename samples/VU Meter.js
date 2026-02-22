'use strict';

window.DefineScript('VU Meter', {author:'Case + marc2003'});
include(fb.ComponentPath + 'helpers.js');
includeJS('vu_meter.js');

// Original version, resize to show/hide labels, horizontal only

const timer_interval = 1000 / 60; // in ms (default: 60 fps update rate)
const rms_window = 50 / 1000; // in seconds (default: 50 ms)
const peak_hold = 20; // in frames
const peak_fall_mul = 0.99;
const peak_bar_width = 1; // in pixels
const minDB = -60; // minimum dB on the meter (meter range)
const maxDB = 5; // maximum dB on the meter (meter range)

init();
