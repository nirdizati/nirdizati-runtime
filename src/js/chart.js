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

var outcomeCharts = null;
var remainingTimeChart = null;
var caseDurationCharts = null;
var lengthDistributionCharts = null;

function createAllCharts() {
	Chart.defaults.global.defaultFontSize = 16;

	outcomeCharts = _createOutcomeCharts();

	if (!caseDurationCharts) {
		caseDurationCharts = _createBarChart('caseDurationCharts');
	} else {
		caseDurationCharts.update();
	}

	if (!remainingTimeChart) {
		remainingTimeChart = _createBarChart('remainingTimeChart');
	} else {
		remainingTimeChart.update();
	}

	if (!lengthDistributionCharts) {
		lengthDistributionCharts = _createBarChart('lengthDistributionChart');
	} else {
		lengthDistributionCharts.update();
	}
}

function _createOutcomeCharts() {
	var charts = [];
	document.getElementById('TabOutcomes').innerHTML = '';

	for (var i = 0; i < outcomeConfigs.length; i++) {
		var chartsContainer = document.querySelector('#TabOutcomes');
		var row = document.createElement('div'),
			title = document.createElement('div'),
			titlePredicted = document.createElement('div'),
			titleCompleted = document.createElement('div'),
			titleHistorical = document.createElement('div'),
			col1 = document.createElement('div'),
			col2 = document.createElement('div'),
			col3 = document.createElement('div'),
			canvas1 = document.createElement('canvas'),
			canvas2 = document.createElement('canvas'),
			canvas3 = document.createElement('canvas');

		row.className = 'row';
		title.className = 'outcomeTitle';
		title.innerHTML = outcomeConfigs[i].name;
		titlePredicted.className = 'outcomeTitleType';
		titlePredicted.innerHTML = 'Running';
		titleCompleted.className = 'outcomeTitleType';
		titleCompleted.innerHTML = 'Completed';
		titleHistorical.className = 'outcomeTitleType';
		titleHistorical.innerHTML = 'Historical';

		col1.className = 'col-xxs-12 col-xs-4';
		col2.className = 'col-xxs-12 col-xs-4';
		col3.className = 'col-xxs-12 col-xs-4';

		canvas1.setAttribute('id', 'chart-predicted-' + i);
		canvas2.setAttribute('id', 'chart-completed-' + i);
		canvas3.setAttribute('id', 'chart-historical-' + i);

		col1.appendChild(titlePredicted);
		col1.appendChild(canvas1);
		col2.appendChild(titleCompleted);
		col2.appendChild(canvas2);
		col3.appendChild(titleHistorical);
		col3.appendChild(canvas3);

		row.appendChild(title);
		row.appendChild(col1);
		row.appendChild(col2);
		row.appendChild(col3);
		chartsContainer.appendChild(row);

		charts.push({
			predicted: new Chart(canvas1.getContext("2d"), outcomeConfigs[i].predicted),
			completed: new Chart(canvas2.getContext("2d"), outcomeConfigs[i].completed),
			historical: new Chart(canvas3.getContext("2d"), outcomeConfigs[i].historical)
		});
	}

	return charts;
}

function _createBarChart(id) {
	const ctx = document.getElementById(id).getContext("2d");
	switch(id) {
		case 'remainingTimeChart':
			return new Chart(ctx, remainingTimeConfigs);
		case 'caseDurationCharts':
			return new Chart(ctx, caseDurationConfigs);
		case 'lengthDistributionChart':
			return new Chart(ctx, lengthDistributionConfigs);
	}
}
