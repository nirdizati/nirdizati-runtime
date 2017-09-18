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
	http = require('http'),
	kafka = require('kafka-node');

const log = require('./logger')(module),
	producer = new kafka.Producer(new kafka.Client());

function defineName() {
	return config.get('app.replayer') || 'kafka';
}

function httpSender(event) {
	event = JSON.stringify(event);

	return new Promise((resolve, reject) => {
		const req = http.request(
			config.get(this.logName)['replayer']['request'],
			(res) => {
				res.on('data', (chunk) => {
					log.info(`The following message has been sent: ${event}`);
					return resolve(chunk);
				});
			}
		);

		req.on('error', (err) => {
			log.error(`The following error has occurred: ${err.message} ${err.stack}`);
			return reject(err);
		});

		req.write(event);
		req.end();
	});
}

function kafkaSender(event) {
	event = JSON.stringify(event);

	return new Promise((resolve, reject) => {
		log.info(`Topic events_${this.logName} being sent event: ${event}`);

		producer.send(
			[{ topic: `events_${this.logName}`, messages: [ event ]}],
			(err, data) => {
				if (err) {
					log.error(`Error sending event: ${err.message}`);
					return reject(err);
				}

				log.info(`Topic events_${this.logName} received event: ${JSON.stringify(data)}`);
				return resolve(JSON.stringify(data));
			}
		)
	});
}

module.exports = {
	defineName: defineName,
	httpSender: httpSender,
	kafkaSender: kafkaSender,
	producer: producer
};