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

var socket = io();

socket
.on('provideLog', function() {
	sendLogChange('provideLog');
})
.on('init', function (data) {
	onInit(data);
})
.on('event', function (data) {
	updateUI(data);
})
.on('last event', function (data) {
	updateUI(data);
})
.on('results', function (data) {
	updateUI(data);
})
.on('error', function(err) {
	handleError(err);
});

function sendLogChange(channel) {
	var logSelect = document.getElementById("logSelect");
	socket.emit(channel || 'changeLog', logSelect.options[logSelect.selectedIndex].value);
}

function onInit(data) {
	if (!data) {
		return;
	}

	initConfigs(data.configs);
	initTable(true);
	createAllCharts();

	updateParams(data);
	loadTable(data);
	reloadCharts(data);

	//Hide first load spinner
	$('.first-load-spinner').hide();
}

function updateUI(data) {
	if (!data) {
		return;
	}

	updateParams(data);
	reloadCharts(data);
	updateRow(data);
}

function updateParams(data) {
	$("#running").text(data.runningCases.toLocaleString());
	$("#completedCases").text(data.completedCases.toLocaleString());
	$("#completedEvents").text(data.completedEvents.toLocaleString());
	$("#averageCaseLength").text(data.averageCaseLength);
	$("#averageDuration").text(timestampToDuration(data.averageRunningTime));
}

function loadTable(data) {
	$('#table').bootstrapTable('load', data.table);
}

function reloadCharts(data) {
	_reloadOutcomeCharts(data);
	_reloadCaseDurationCharts(data);
	_reloadRemainingTimeChart(data);
	_reloadLengthDistributionChart(data);
}

function _reloadOutcomeCharts(data) {
	if (!outcomeCharts) {
		return;
	}

	const outcomes = data.outcomes;
	const names = Object.keys(outcomes);
	for (var i = 0; i < names.length; i++) {
		outcomeCharts[i].predicted.data.datasets[0].data = outcomes[names[i]]['predicted'];
		outcomeCharts[i].completed.data.datasets[0].data = outcomes[names[i]]['completed'];
		outcomeCharts[i].predicted.update();
		outcomeCharts[i].completed.update();
	}
}

function _reloadRemainingTimeChart(data) {
	if (!remainingTimeChart) {
		return;
	}

	remainingTimeChart.data.datasets[0].data = _aggregateBarChartResults(data.remainingTimeCounts, generalDurationConfigs.daysInterval, generalDurationConfigs.barsNumber);
	remainingTimeChart.update();
}

function _reloadCaseDurationCharts(data) {
	if (!caseDurationCharts) {
		return;
	}

	caseDurationCharts.data.datasets[0].data = _aggregateBarChartResults(data.completedCaseDurationCounts, generalDurationConfigs.daysInterval, generalDurationConfigs.barsNumber);
	caseDurationCharts.data.datasets[1].data = _aggregateBarChartResults(data.runningCaseDurationCounts, generalDurationConfigs.daysInterval, generalDurationConfigs.barsNumber);
	caseDurationCharts.update();
}

function _reloadLengthDistributionChart(data) {
	if (!lengthDistributionCharts) {
		return;
	}

	lengthDistributionCharts.data.datasets[0].data = _aggregateBarChartResults(data.lengthDistributionCounts, lengthDistributionConfigs.width, lengthDistributionConfigs.barsNumber);
	lengthDistributionCharts.update();
}

function updateRow(data) {
	var row = data.row[0];
	if (!row) {
		return console.log('Row param is empty.');
	}

	$('#table').bootstrapTable('remove', {field: 'case_id', values: [row.case_id]});
	$('#table').bootstrapTable('prepend', row);
}

function handleError(err) {
	if (!err) {
		return;
	}
	console.log(err);
}


function _aggregateBarChartResults(data, interval, barsNumber) {
	var results = Array(barsNumber).fill(0);
	var left = 0;
	var right = interval;

	for (var i = 0; i < barsNumber - 1; i++) {
		results[i] = data.slice(left, right).reduce(function(acc, val) {
			return acc + val;
		}, 0);

		left = right;
		right += interval;
	}

	// sum up everything else in the last column
	results[barsNumber - 1] = data.slice(left).reduce(function(acc, val) {
		return acc + val;
	}, 0);

	return results;
}
