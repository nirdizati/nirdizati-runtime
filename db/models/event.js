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

const config = require('config'),
	log = require('../../libs/utils/logger')(module),
	queue = require('../../libs/queue'),
	mongoose = require('../../libs/mongoose'),
	Schema = mongoose.Schema;

// due to strict mode all fields will be stored even if they do not specified in schema
const eventSchema = new Schema({
	case_id: { type: String, required: true },
	activity_name: { type: String, required: true },
	event_nr: { type: Number, required: true },
	last: { type: Boolean, required: true },
	time: { type: Date, required: true },
	log: {type: String, required: true, index: true }
}, {strict: false});

eventSchema.post('save', (eventMessage) => {
	const logName = eventMessage['log'];
	const payload = {
		event: eventMessage,
		prefix: []
	};

	if (eventMessage['last'] === true) {
		return queue.sendMessage(payload, config.get('redis.jobQueue'));
	}

	const caseIdField = config.get(logName)['caseIdField'];
	eventModel
	.find({ [caseIdField]: eventMessage[caseIdField] })
	.sort('event_nr')
	.exec((err, prefix) => {
		if (err) {
			return log.error(`Error during retrieving prefix: ${err.message}`);
		}

		payload.prefix = prefix;
		queue.sendMessage(payload, config.get('redis.jobQueue'));
	});
});

eventSchema.statics.countByCondition = function(condition, callback) {
	this.where(condition).count((err, count) => {
		if (err) {
			log.error(`Error during events count for condition ${condition}: ${err.message}`);
			return callback(err);
		}

		return callback(err, count);
	});
};

const eventModel = mongoose.model('Event', eventSchema);

module.exports = eventModel;
