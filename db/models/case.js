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

const log = require('../../libs/utils/logger')(module),
	mongoose = require('../../libs/mongoose'),
	Schema = mongoose.Schema;

// due to strict mode all fields will be stored even if they do not specified in schema
const caseSchema = new Schema( {
	case_id: { type: String, required: true, unique: true },
	log: {type: String, required: true, index: true },
	finished: { type: Boolean, default: false, index: true },
	start_time: Date,
	last_event_time: Date,
	remaining_time: Number,
	completion_time: Date,
	duration: { type: Number, default: null},
	trace_length: Number,
	current_trace: Array,
	remaining_events_count: Number,
	path_completion: [String],
	slow_probability: Number,
	slow: Boolean,
	rejected_probability: Number,
	rejected: Boolean,
	label: Boolean
}, {strict: false});

caseSchema.statics.countByCondition = function(condition, callback) {
	this.where(condition).count((err, count) => {
		if (err) {
			log.error(`Error during cases count for condition ${condition}: ${err.message}`);
			return callback(err);
		}

		return callback(null, count);
	});
};

caseSchema.statics.fieldAverage = function(field, condition, callback) {
	this.aggregate()
	.match(condition)
	.group({'_id': null, 'average': {'$avg': field}})
	.exec((err, result) => {
		if (err) {
			log.error(`Error during calculating average for ${field}: ${err.message}`);
			return callback(err);
		}

		if (result.length > 0) {
			return callback(null, result[0].average.toFixed(2));
		}

		return callback(null, 0);
	});
};

const caseModel = mongoose.model('Case', caseSchema);

module.exports = caseModel;
