var $window 		= $(window);
var lastWindowWidth = $window.width();

$( document ).ready(function() {
	$('#displayWidth').text('Width: ' + $window.width());
	$window.on('load', function(){
		// Check to see if the window with is 463. This matches 480 with Chrome.
		// If it is hide the form and show the plus icon
		if($(window).width() <= 480){
			$('.jt_jobsearch_content').hide();
			$('.filtered-job-alert').hide();
			$('.fa-plus').show();
		}
	})
	$window.on('resize', function(){
		$('#displayWidth').text('Width: ' + $window.width());
		var windowWidth = $window.width();
		var searchIsVisible = $('.jt_jobsearch_content').is(':visible');
		
		/* Have to use this check for mobile browsers. With Chrome it sends a resize event due to the header showing while scrolling up the page */
		if (lastWindowWidth !== windowWidth) {
			// Check to see if the window with is 463. This matches 480 with Chrome.
			// If it is hide the form and show the plus icon
			if(windowWidth > 480){
				$('.jt_jobsearch_content').show();
				$('.filtered-job-alert').show();
				$('.fa-plus').hide();
				$('.fa-minus').hide();
			} else {
				$('.jt_jobsearch_content').hide();
				$('.filtered-job-alert').hide();
				$('.fa-plus').show();
				$('.fa-minus').hide();	
			}
			lastWindowWidth = $window.width();
		}
	});
	$('.refine').on('click', function(){
		//Check to see if the screen size is under 480. If not the Refine Your search should not be clickable.
		if($(window).width() <= 480){
			$('.jt_jobsearch_content').slideToggle( "slow" );
			$('.filtered-job-alert').slideToggle( "slow" );
			$('.fa-plus').toggle();
			$('.fa-minus').toggle();
		}
	})
});