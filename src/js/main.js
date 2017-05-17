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

$(document).ready(function() {
	initTable(false);

	//tabs interactive
	$('.ttab').on('click', function() {
	  $('.ttabs-head .ttab').removeClass('active-btn');
	  $(this).addClass('active-btn');
	  var tabIndex = $('.ttabs-head .ttab').index(this);
	  $(".ttabs-body .ttabs-content").removeClass('active-content');
	  $(".ttabs-body .ttabs-content").eq(tabIndex).addClass('active-content');
    });

	// alert('Log uploading by user is currently disabled. You can switch between the two event streams currently being replayed');
});

$(window).on('resize', function() {
	if (window.matchMedia('(min-width: 350px) and (max-width: 480px)').matches ||
		window.matchMedia('(max-width: 350px)').matches) {
		tableState.setCurrentState('mobile');
	} else {
		tableState.setCurrentState('desktop');
	}
});
