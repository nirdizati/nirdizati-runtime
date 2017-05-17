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

// OUTCOME (pie charts) configs
var outcomeConfigs = [];
const pieChartColors = ['rgba(191, 63, 63, 0.8)', 'rgba(63, 191, 63, 0.8)', 'blue', 'yellow'];

function _getPieChartConfig(data, labels) {
	return {
		type: 'pie',
		data: {
			datasets: [{
				data: data,
				backgroundColor: pieChartColors
			}],
			labels: labels
		},
		options: {
			responsive: true
		}
	};
}

// Bar chart configs
const barChartOptions = {
	responsive: true,
	scales: {
		display: true,
			yAxes: [{
			ticks: {
				beginAtZero: true
			}
		}]
	}
};

var generalDurationConfigs = {};

var caseDurationConfigs = {
	type: "bar",
	data: {
		labels: [],
		datasets: [{
			label: 'Actual case duration (over completed)',
			backgroundColor: Array(20).fill('rgba(63, 191, 63, 0.8)'),
			data: []
		},	{
			label: 'Predicted case duration (over running)',
			backgroundColor: Array(20).fill('rgba(54, 162, 235, 0.5)'),
			data: []
		}]
	},
	options: barChartOptions
};

var remainingTimeConfigs = {
	type: "bar",
	data: {
		labels: [],
		datasets: [{
			label: 'Remaining time distribution',
			backgroundColor: Array(20).fill('rgba(54, 162, 235, 0.5)'),
			data: []
		}]
	},
	options: barChartOptions
};

var lengthDistributionConfigs = {
	type: "bar",
	data: {
		labels: [],
		datasets: [
			{
				label: "Case length distribution (over completed)",
				backgroundColor: Array(20).fill('rgba(63, 191, 63, 0.8)'),
				data: []
			}
		]
	},
	options: barChartOptions,
	width: 1,
	barsNumber: 9
};

// Table configs
var tableConfig = {
	showToggle: 'true',
	showColumns: 'true',
	showExport: 'true',
	showPaginationSwitch: 'true',
	idField: 'case_id',
	search: 'true',
	striped: 'true',
	pagination: 'true',
	pageSize: 5,
	paginationLoop: true,
	pageList: [5, 10, 25, 50, 100, 200],
	buttonsAlign: 'right',
	searchAlign: 'left',
	rowStyle: 'rowStyle',
	columns: []
};

function initConfigs(configs) {
	if (!configs) {
		console.log('Configs from server are empty');
	}

	if (configs.columns) {
		tableConfig.columns = configs.columns;
	}

	if (configs.ui) {
		generalDurationConfigs.daysInterval = configs.ui.daysInterval;
		generalDurationConfigs.barsNumber = configs.ui.barsCountForTimeIntervals;
		lengthDistributionConfigs.width = configs.ui.barsWidthForLength;
		lengthDistributionConfigs.barsNumber = configs.ui.barsCountInLengthDistribution;

		const durationLabels = _generateBarChartsLabels(generalDurationConfigs.daysInterval, generalDurationConfigs.barsNumber, 'Day');
		remainingTimeConfigs.data.labels = durationLabels;
		caseDurationConfigs.data.labels = durationLabels;

		lengthDistributionConfigs.data.labels = _generateBarChartsLabels(lengthDistributionConfigs.width, lengthDistributionConfigs.barsNumber, null);
	}

	if (configs.outcomes) {
		outcomeConfigs = [];
		const outcomes = configs.outcomes;
		for (var i = 0; i < outcomes.length; i++) {
			const labels = outcomes[i]['labels'];
			outcomeConfigs[i] = {
				name: outcomes[i]['name'],
				predicted: _getPieChartConfig([0, 0], labels),
				completed: _getPieChartConfig([0, 0], labels),
				historical: _getPieChartConfig(outcomes[i]['historical'], labels)
			};
		}
	}
}

function _generateBarChartsLabels(interval, barsNumber, unit) {
	if (unit) {
		unit += interval === 1 ? '' : 's';
	}

	var left = 0;
	var right = left + interval;
	var labels = [];
	for (var i = 0; i < barsNumber - 1; i++) {
		labels.push(left.toString() + '-' + right.toString() + (unit ? ' ' + unit : ''));
		left = right;
		right += interval;
	}

	labels.push('>' + left.toString() + (unit ? ' ' + unit : ''));
	return labels;
}
