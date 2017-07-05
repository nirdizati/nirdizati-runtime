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
	RSMQWorker = require('rsmq-worker'),
	log = require('../utils/log')(module),
	db = require('../../db'),
	Case = require('../../db/models/case'),
	kafka = require('kafka-node'),
        producer = new kafka.Producer(new kafka.Client());


const options = {
	autostart: true,
	timeout: 0,
	interval: [ 0 ],
	alwaysLogErrors: true,
	redisPrefix: config.get('redis.connection.ns')
};

const jobWorker = new RSMQWorker(config.get('redis.jobQueue'), options);

module.exports = function(io) {
	log.info(`Job worker connecting to message queue...`);

	jobWorker.on('ready', () => {
		log.info(`Job worker is ready for consuming...`);
	});

	jobWorker.on('message', (message, next) => {
		_onMessage(message, io, next);
	});
};

function _onMessage(message, io, next) {
	const payload = JSON.parse(message);
	const logName = payload.event['log'];

	if (payload.event.last === true) {
		log.info(`Message for last case event: ${message}`);
		db.getSystemState(payload, updateClient('last event', io, logName));

		return next();
	}

	db.getSystemState(payload, updateClient('event', io, logName));

	const caseIdField = config.get(logName)['caseIdField'];
	Case.findOne({ case_id: payload.event[caseIdField], log: logName }, (err, doc) => {
		if (err) {
			log.error(`Error during finding case on message in job queue: ${err.message}`);
			return next();
		}

		if (!doc) {
			log.warn(`There is no case in db with id ${payload.event[caseIdField]} in onMessage function of job worker.`);
			return next();
		}
		// skip calculations if we already have newer events from the case
		if (payload.event.event_nr < doc.trace_length) {
			log.warn(`Skip calculations as event is out of date`);
			return next();
		}

		log.info(`Starting calculation for next message: ${message}`);
		producer.send([{ topic: logName, messages: [ JSON.stringify(payload.prefix) ]}], function(err, data) {
                        log.info(`Forwarded from redis to kafka topic ${logName}`);
                        if (err) {
                                log.error(`Error sending event: ${err.message}`);
                        }
                        log.info(`Producer sent event: ${JSON.stringify(data)}`); });

		return next();
	});
}

function updateClient(channel, io, logName) {
	return function(err, info) {
		if (err) {
			return io.to(logName).emit('error', err);
		}
		io.to(logName).emit(channel, info);
	}
}


