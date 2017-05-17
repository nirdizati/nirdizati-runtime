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

function TableState(initialState) {
	this.tableStates = ['mobile', 'desktop'];
	this.currentState = (this.isState(initialState)) ? initialState : null;
	this.makeState();
}

TableState.prototype.isState = function(state) {
	return this.tableStates.indexOf(state) !== -1;
};

TableState.prototype.setCurrentState = function(state) {
	if (!this.isState(state) || this.currentState == state) {
		return;
	}

	this.currentState = state;
	this.makeState();
};

TableState.prototype.makeState = function() {
	if(!this.currentState) return;
	if(this.currentState == 'mobile') {
		if(!$('#table').bootstrapTable('getOptions').cardView) {
			$('#table').bootstrapTable('toggleView');
		}
		$('.bootstrap-table .fixed-table-toolbar').hide();
	}
	if(this.currentState =='desktop') {
		if($('#table').bootstrapTable('getOptions').cardView) {
			$('#table').bootstrapTable('toggleView');
		}

		$('.bootstrap-table .fixed-table-toolbar').show();
		var height =$('.bootstrap-table .fixed-table-toolbar .search').outerHeight();
		$('.ttabs-content .fixed-table-toolbar').animate({'height':height}, 50);
	}
};

function rowStyle(row) {
	if (row.finished === true) {
		return {
			classes: 'success'
		}
	}

	return {
		classes: 'active'
	}
}

function cellStyle(value) {
	if (value === true) {
		return {
			classes: 'danger'
		};
	}

	return {};
}

function toStringFormatter(value) {
	if (value === null || value === undefined) {
		return '-';
	}
	return value.toString();
}

function arrayFormatter(value) {
	return value.join('; \n');
}

function timestampFormatter(value) {
	if (!value) {
		return;
	}

	return moment(new Date(value)).format('MMM DD YYYY HH:mm:ss');
}

var tableState = null;

function initTable(refresh) {
	if (refresh) {
		$('#table').bootstrapTable('refreshOptions', tableConfig);
	} else {
		$('#table').bootstrapTable(tableConfig);
	}

	// hide it because might not be interested for end-user
	$('#table').bootstrapTable('hideColumn', 'current_trace');

	if (window.matchMedia('(min-width: 350px) and (max-width: 480px)').matches ||
		window.matchMedia('(max-width: 350px)').matches) {
		tableState = new TableState('mobile');
	} else {
		tableState = new TableState('desktop');
	}
}