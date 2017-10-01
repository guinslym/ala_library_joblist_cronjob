function showMoreOptions(fields) {
	var fields = $$('.relocation_options');

	for(i = 0; i < fields.length; i ++) {
		if($(fields[i]).style.display == 'none') {
			$(fields[i]).show();
		}
	}
}

function hideMoreOptions() {
	var fields = $$('.relocation_options');

	for(i = 0; i < fields.length; i ++) {
		if($(fields[i]).style.display == '') {
			$(fields[i]).hide();
			$(fields[i]).down('td').down().value = '';
		}
	}
}

// }}}