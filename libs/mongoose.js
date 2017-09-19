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

const config = require('config'),
	mongoose = require('mongoose')

const log = require('./utils/logger')(module);

mongoose.Promise = global.Promise;
mongoose.connect(config.get('mongoose.uri'), config.get('mongoose.options'));

mongoose.connection.on('connected', () => {
	log.info(`Mongoose connected to '${config.get('mongoose.uri')}'`);
});

mongoose.connection.on('error',function (err) {
	log.error('Mongoose error: ' + err);
});

mongoose.connection.on('disconnected', function () {
	log.warn('Mongoose disconnected');
});

// If the Node process ends, close the Mongoose connection
process.on('SIGINT', function() {
	mongoose.connection.close(function () {
		log.warn('Mongoose connection disconnected through app termination');
		process.exit(0);
	});
});

module.exports = mongoose;
