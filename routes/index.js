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
	ensureLoggedIn = require('connect-ensure-login').ensureLoggedIn,
	LocalStrategy = require('passport-local').Strategy,
	path = require('path'),
	passport = require('passport'),
	session = require("express-session"),
	router = require('express').Router();

// just for testing
const guest = {
	email: 'guest@nirdizati.com',
	password: 'nirdizati',
	id: 1
};

// Configure the local strategy for use by Passport.
passport.use(new LocalStrategy(
	{usernameField: 'email'},
	(email, password, done) => {
		// let's check credentials for hardcoded user
		if (guest.email !== email || guest.password !== password) {
			return done(null, false);
		}

		return done(null, guest)
	})
);

// Configure Passport authenticated session persistence
//
// In order to restore authentication state across HTTP requests, Passport needs
// to serialize users into and deserialize users out of the session.
passport.serializeUser((user, cb) => cb(null, user.id));
passport.deserializeUser(
	(id, cb) => {
		// TODO implement logic to find user in db by id and return it via cb

		if (id !== guest.id) {
			return cb(new Error(`User has invalid session data.`))
		}

		cb(null, guest);
	}
);

// Configure session middlewares
router.use(session(config.get('app.session')));
router.use(passport.initialize());
router.use(passport.session());

// Configure application routes
router.get('/login',
	(req, res) => {
		res.sendFile(path.join(__dirname, '..', 'views', 'login.html'));
	}
);

router.post('/login',
	passport.authenticate('local', { successReturnToOrRedirect: '/dashboard', failureRedirect: '/login' })
);

router.get('/',
	(req, res) => {
		res.redirect('/dashboard');
	}
);

router.get('/dashboard',
	ensureLoggedIn(),
	(req, res) => {
		res.sendFile(path.join(__dirname, '..', 'views', 'index.html'));
	}
);

module.exports = router;
