function verify(form) {
	form = $(form);
	var errors = [];

	if(form.email && (!form.email.value.length || !/^([\w\d\.-_])+@(([\w\d-_])+\.)+([\w\d]{2,4})\s*$/.test(form.email.value)))
		errors.push('You must enter your email address in the form abc@xyz.com');

	if(!form.message.value.length)
		errors.push('You must enter a message for this ticket.');

	if(!$F(form.category).length)
		errors.push('You must choose a topic from the list.');
	
	if(errors.length) {
		alert('The following errors occurred:\n' + errors.collect(function(e) { return ' - '+e }).join('\n'));
	}

	return !errors.length;
}

function do_close(ticket_id) {
	document.ticket_form.close_id.value = ticket_id;
	document.ticket_form.submit();
}
function do_open(ticket_id) {
	document.ticket_form.open_id.value = ticket_id;
	document.ticket_form.submit();
}
function do_delete(ticket_id) {
	if(confirm("Are you sure you wish to permanently delete this ticket?")) {
		document.ticket_form.delete_id.value = ticket_id;
		document.ticket_form.submit();
	}

	return false;
}
