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

const log = require('./log')(module),
	mongoose = require('../mongoose'),
	async = require('async');

module.exports = function () {
	mongoose.connection.on('open', () => {
		const db = mongoose.connection.db;

		db.dropDatabase((err) => {
			if (err) {
				log.error(`Error during dropping database: ${err.message}`);
			} else {
				log.info(`Database cleaning has been succeeded!`);
			}
			// as we drop db using native driver, some of indices might not be created
			async.each(Object.keys(mongoose.models), function(modelName, callback) {
				mongoose.models[modelName].ensureIndexes(callback);
			}, () => {});
		});
	});
};
