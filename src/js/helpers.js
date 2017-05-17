/*
Copyright (c) 2016-2017 The Nirdizati Project.
This file is part of "Nirdizati".

"Nirdizati" is free software; you can redistribute it and/or modify
it under the terms of the GNU Lesser General Public License as
published by the Free Software Foundation; either version 3 of the
License, or (at your option) any later version.

"Nirdizati" is distributed in the hope that it will be useful, but
WITHOUT ANY WARRANTY; without even the implied warranty
of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
See the GNU Lesser General Public License for more details.

You should have received a copy of the GNU Lesser General Public
License along with this program.
If not, see <http://www.gnu.org/licenses/lgpl.html>.
*/

'use strict';

const MILLISEC_IN_MINUTE = 60 * 1000;
const MILLISEC_IN_HOUR = 60 * MILLISEC_IN_MINUTE;
const MILLISEC_IN_DAY = 24 * MILLISEC_IN_HOUR;

function timestampToDuration(millisec) {
	if (!millisec && millisec !== 0) {
		return '';
	}

	const days = Math.floor(millisec / MILLISEC_IN_DAY);
	const hours = Math.floor((millisec % MILLISEC_IN_DAY) / MILLISEC_IN_HOUR);
	const min = Math.floor((millisec % MILLISEC_IN_HOUR) / MILLISEC_IN_MINUTE);
	const seconds = Math.floor(millisec % MILLISEC_IN_MINUTE / 1000);

	var durationString = '';
	if (days > 0) {
		durationString = days + 'd ';
	}

	durationString += hours + 'h ' + min + 'm ';

	if (days == 0) {
		durationString += seconds + 's';
	}

	return durationString;
}
