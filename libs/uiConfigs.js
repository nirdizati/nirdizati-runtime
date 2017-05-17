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

const config = require('config');

const commonColumns = [{
	field: 'case_id',
	title: 'case ID',
	valign: 'middle',
	sortable: true
}, {
	field: 'finished',
	title: 'Completed',
	formatter: 'toStringFormatter',
	valign: 'middle',
	sortable: true
}, {
	field: 'trace_length',
	title: 'Events elapsed',
	valign: 'middle',
	sortable: true
},{
	field: 'current_trace',
	title: 'Occurred events',
	formatter: 'arrayFormatter',
	sortable: true,
	halign: 'center',
	valign: 'middle',
	align: 'left'
}, {
	field: 'start_time',
	title: 'Start time',
	formatter: 'timestampFormatter',
	valign: 'middle',
	sortable: true
}, {
	field: 'last_event_time',
	title: 'Latest event time',
	formatter: 'timestampFormatter',
	valign: 'middle',
	sortable: true
}, {
	field: 'completion_time',
	title: 'Predicted/Actual completion time',
	formatter: 'timestampFormatter',
	valign: 'middle',
	sortable: true
}, {
	field: 'duration',
	title: 'Predicted/Actual duration',
	formatter: 'timestampToDuration',
	valign: 'middle',
	sortable: true
}];

const speedColumns = [{
	field: 'slow_probability',
	title: 'Probability to be slow',
	valign: 'middle',
	sortable: true
}, {
	field: 'slow',
	title: 'Slow',
	formatter: 'toStringFormatter',
	cellStyle: 'cellStyle',
	valign: 'middle',
	sortable: true
}];

const outcomeColumns = [{
	field: 'rejected_probability',
	title: 'Probability to be rejected',
	valign: 'middle',
	sortable: true
}, {
	field: 'rejected',
	title: 'Rejected',
	formatter: 'toStringFormatter',
	cellStyle: 'cellStyle',
	valign: 'middle',
	sortable: true
}];

const bpi_17_columns = commonColumns.concat(speedColumns).concat(outcomeColumns);
const bpi_12_columns = commonColumns.concat(speedColumns);

function _getOutcomeConfigs(logName) {
	const outcomesConfig = config.get(logName)['methods']['outcomes'];
	const uiConfigs = [];

	Object.keys(outcomesConfig).forEach(function(name) {
		const outcome = outcomesConfig[name];
		uiConfigs.push({
			name: outcome['ui']['name'],
			labels: outcome['ui']['labels'],
			historical: outcome['ui']['historical']
		});
	});
	
	return uiConfigs;
}

module.exports = {
	bpi_17: {
		columns: bpi_17_columns,
		outcomes: _getOutcomeConfigs('bpi_17'),
		ui: config.get('bpi_17')['ui']
	},

	bpi_12: {
		columns: bpi_12_columns,
		outcomes: _getOutcomeConfigs('bpi_12'),
		ui: config.get('bpi_12')['ui']
	}
};