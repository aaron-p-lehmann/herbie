
function FindDesc(desc) {
	var el, hadterm=0;

	if (!desc.match(':$')) { // We should first try to find labels ending with a :
		desc += ':';
	} else 
		hadterm = 1;

	el = $('label:contains(' +desc+')');
	if (el.length) { 
		el = el.first();
		return $('#'+el.attr("for"));  // return the element the label is for
	}

	desc = desc.slice(0,-1);  // remove the traling :

	el = $('label:contains(' +desc+')');
	if (el.length) { 
		el = el.first();
		return $('#'+el.attr("for"));  // return the element the label is for
	}

	if (hadterm) desc += ':';

	el = $('button:contains(' +desc+')');  // look for buttons that contain that text.
	if (el.length) 
		return el.first();

//	if (desc.match('^#')) {
	// as a last ditch effort see if it's a path
		try {
			el = $( desc );
		} catch(e) {
			el = [];
		}
		if (el.length===1) return el;
//	}


}

// This function takes a human readable potientially multi-lined script and turns it into a structured array.
function ParseScript(script) {
	var lines = script.split('\n');
	var cmdtree = [];

	for (i = 0; i < lines.length; i++) {  // Go thru each line.

		var cmd = { line: i, code: [], src: lines[i] };  // setup cmd structure

		var stmt = lines[i].match(/\w+|'[^']+'|"[^"]+"|\{\{(.*?)\}\}|\*|:/g);   // break the line into words, "quoted" or 'quoted' tokens, and {{tags}}
		if (stmt)
			if (stmt[0].charAt(0)!=='*') { 					//  We support bulleted lists of field/value pair.  If this is not one, then we process it differently.
				for (j = 0; j < stmt.length; j++) {
					var z = stmt[j].charAt(0);
					if (z == '{' || z == '"' || z == "'" ) {
						cmd.code.push(stmt[j]);
					} else {
						var candidate = stmt[j].toLowerCase();
						switch (candidate) {
							// verbs
							case 'click':
								cmd.code.push(candidate);
								cmd.code.push('in');
								break;
							case 'type':
							case 'capture':
							case 'test':
							case 'open':
							case 'wait':
							case 'switch':
							case 'navigate':

							// nouns
							case 'button':
							case 'close':
							case 'autocomplete':
							case 'ok':
							case 'save':
								cmd.code.push(candidate);
								break;
							case 'on':
							case 'in':
							case 'into':
								if ((cmd.code.length)  && (cmd.code[ cmd.code.length - 1 ] == 'in'))
									; // do nothing
								else
									cmd.code.push('in');
								break;
						}
					}
				}
			} else {  // this is a field value pair.  ie:  * Field: value
				cmd.code.push('type');
				stmt = lines[i].match(/\*[^:]+|:.+/g);
				cmd.code.push(stmt[1].slice(1).trim());
				cmd.code.push('in');
				cmd.code.push(stmt[0].slice(1).trim());
			}
		cmdtree.push(cmd);
	}
	return cmdtree;
}

function ExecuteScript( /* cmdtree, options, callback */) {
  var cmdtree = arguments[0], options = { line: 0, delay: 100, cmdtree:cmdtree } , callback, tag;

	if (arguments.length == 2) { // only two arguments supplied
		if (Object.prototype.toString.call(arguments[1]) == "[object Function]") {
			callback = arguments[1]; // if is a function, set as 'callback'
		} else {
			options = arguments[1]; // if not a function, set as 'options'
		}
	} else if (arguments.length == 3) { // three arguments supplied
		options = arguments[1];
		callback = arguments[2];
	}

	var i=options.line;

	if (i<cmdtree.length) {
		if (callback) callback(false, options);
	} else {
		if (callback) callback(true, options);
		return;
	}

	var inclause = $.inArray("in", cmdtree[i].code);
	if (inclause!=-1) {
		var tagname = cmdtree[i].code[inclause+1];
		if (tagname.charAt(0)==='"'||tagname.charAt(0)==="'")
			tagname = tagname.slice(1,-1);

		tag = FindDesc( tagname );
		if (!tag) if (callback) callback(false, options, "Cannot find tag named: '" + tagname + "'");
	}

	switch (cmdtree[i].code[0]) {
		case 'type':

			var seq = cmdtree[i].code[1];
			if (seq.charAt(0)==='"'||seq.charAt(0)==="'")
				seq = seq.slice(1,-1);

			if (tag) tag.fadeOut(100)
						.fadeIn(100)
						.fadeOut(100)
						.fadeIn(100)
						.simulate("key-sequence", {sequence: seq, delay: options.delay, callback: 
								function () { 
									options.line++; // ok, setting the options to the next line here.
									ExecuteScript(cmdtree,options,callback); 
								}
							});
			return;
		case 'click':
			if (tag) tag.fadeOut(100)
						.fadeIn(100)
						.fadeOut(100)
						.fadeIn(100)
						.simulate("click");
			return setTimeout(function () {
					options.line++; // ok, setting the options to the next line here.
					ExecuteScript(cmdtree,options,callback);
				}, options.delay);

		default:
			return setTimeout(function () {
					options.line++; // ok, setting the options to the next line here.
					ExecuteScript(cmdtree,options,callback);
				}, options.delay);

	}
}
