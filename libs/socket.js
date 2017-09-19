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

const  appRoot = require('app-root-path');

const log = require(appRoot + '/libs/utils/logger')(module),
	db = require(appRoot + '/db'),
	uiConfigs = require('./uiConfigs');

module.exports = function(server) {
	const io = require('socket.io')(server);

	io.on('connection', function(socket) {
		log.info(`Client has been connected.`);

		socket.emit('provideLog');

		socket.on('provideLog', function(logName) {
			onInit(socket, logName);

			socket.on('changeLog', function(logName) {
				onInit(socket, logName);
			});
		});


		socket.on('disconnect', function() {
			log.info(`Client has been disconnected.`);
		});
	});

	return io;
};

function onInit(socket, logName) {
	const oldLog = socket.logName;

	// change channel for communication, as different logs use different channels
	if (oldLog) {
		socket.leave(oldLog);
	}

	socket.logName = logName;
	socket.join(logName);

	if (oldLog) {
		log.info(`Client left ${oldLog} room and joined ${logName} room.`);
	} else {
		log.info(`Client joined ${logName} room.`);
	}

	db.getSystemState({ event: {log: socket.logName} }, true, (err, info) => {
		if (err) {
			return;
		}

		info.configs = uiConfigs[socket.logName];
		socket.emit('init', info);
	});
}
