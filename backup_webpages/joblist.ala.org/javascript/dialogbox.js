/******************************************************************************
 * The fabled Dialog Box
 *
 * 2007-2009 Aaron Bieber, JobTarget
 *
 * Don't steal.
 *
 * INSTRUCTIONS
 *
 * The Dialog Box object allows you to display and retrieve responses from
 * prepackaged forms or webpage snippets (relatively) easily. Display a dialog
 * box, post the results to a script, update messages within it, all with this
 * handy class.
 *
 * var my_dialog = new DialogBox('/path/to/an/html/template.html', {
 *     margin: 100,
 *     populate: '/path/to/populate/script',
 *     save: '/path/to/save/handler/script',
 *     scroll: true,
 *     onSaveSuccess: function() {},
 *     onSaveFailure: function() {},
 *     title: 'Dialog Title'
 * });
 *
 * Optionally, a width and height may be provided instead of "margin." The
 * margin option will size the dialog box so that each edge is the given number
 * of pixels from the window's edge.
 *****************************************************************************/

var DialogBox = Class.create();
DialogBox.prototype = {
	initialize: function() {
		this.template = arguments[0] || '';
		this.options = {
			margin: 100,
			width: null,
			height: null,
			maxheight: null,
			populate: null,
			save: null,
			scroll: true,
			onSaveSuccess: function() {},
			onSaveFailure: function() {},
			onLoadSuccess: function() {},
			onLoadFailure: function() {},
			title: null,
			lazyload: false,
			parameters: {},
			scriptaculous: false,
			showButton: true,
			buttonText: 'Save',
			cancelLinkText: 'Cancel'
		}
		Object.extend(this.options, arguments[1] || {});
		this.loadParameters = {};

		/*** Configure any changes in defaults. */
		if(this.options.width || this.options.height) this.options.margin = null;

		/*** Create the dialog box. */
		this.uid = this.generateId();
		if(!this.dialog) {
			this.dialog = new Element('div', { id: 'dialog_box_'+this.uid, 'class':'dialog_box_base' });
			this.dialog.setStyle({ overflow: ((this.options.scroll)?'scroll':'hidden'), display: 'none' });
			this.inner = new Element('div', { id: 'dialog_box_inner_'+this.uid });

			if(this.options.title) {
				this.title = new Element('h2', { id: 'dialog_box_title_'+this.uid }).update(this.options.title);
				this.inner.insert({ bottom: this.title });
			}
			if(this.options.for_evaluation)
				this.messages = new Element('div', { id: 'dialog_box_evaluate_messages_'+this.uid, 'class': 'dialog_box_evaluate_messages_base' }).setStyle({ display: 'none', padding: '10px' });
			else 
				this.messages = new Element('div', { id: 'dialog_box_messages_'+this.uid, 'class': 'dialog_box_messages_base' }).setStyle({ display: 'none', padding: '10px' });
			this.inner.insert({ bottom: this.messages });
			this.form = new Element('form', { id: 'dialog_box_form_'+this.uid, action: '' });
			this.content = new Element('div', { id: 'dialog_box_content_'+this.uid });
			this.form.insert({ bottom: this.content });
			this.loading_throbber = new Element('div').setStyle({ textAlign: 'center', padding: '10px 0', display: 'none' });
			this.loading_throbber.insert({ top: new Element('img', { src: '/images/loading.gif', alt: 'Please wait...' }) });
			this.inner.insert({ bottom: this.loading_throbber });
			this.inner.insert({ bottom: this.form });
			this.button_bar = new Element('div', { id: 'dialog_box_button_bar_'+this.uid });
			this.button_bar.insert({ bottom: '<a href="##" id="dialog_box_cancel_'+this.uid+'">'+this.options.cancelLinkText+'</a>' });
			if(this.options.showButton) {
				this.button_bar.insert({ bottom: '&nbsp;or&nbsp;' });
				this.button_bar.insert({ bottom: '<button class="jt_cte_short_button" id="dialog_box_save_'+this.uid+'"><span>'+this.options.buttonText+'</span></button>' });
			}
			this.button_bar.insert({ bottom: '<span style="display:none;" id="dialog_box_throbber_'+this.uid+'">&nbsp;<img src="/images/waiting.gif" alt="Please wait..." /></span>' });
			this.inner.insert({ bottom: this.button_bar });

			this.button_bar_close = new Element('div', { id: 'dialog_box_button_bar_close_'+this.uid }).setStyle({ display: 'none' });
			this.close_button = new Element('button', { 'class': 'jt_cte_short_button' });
			this.close_button.insert({ top: new Element('span').update('Close') });
			this.button_bar_close.insert({ bottom: this.close_button });
			this.dialog.insert({ bottom: this.button_bar_close });

			this.dialog.insert({ top: this.inner });

			$(document.body).insert({ bottom: this.dialog });
			Event.observe('dialog_box_cancel_'+this.uid, 'click', this.hide.bind(this));
			if(this.options.showButton) Event.observe('dialog_box_save_'+this.uid, 'click', this.save.bind(this));
			Event.observe(this.close_button, 'click', this.hide.bind(this));
			//Event.observe('dialog_box_form_'+this.uid, 'submit', function() { Event.stop(arguments[0]); return false; });
		}
		this.throbber = $('dialog_box_throbber_'+this.uid);

		if(!this.options.margin) {
			if(this.options.width) this.dialog.setStyle({ width: this.options.width+'px' });
			if(this.options.height) this.dialog.setStyle({ height: this.options.height+'px' });
		}

		/*** Create the overlay object. */
		if(!$('dialog_box_overlay_'+this.uid)) {
			var ol = new Element('div', { id: 'dialog_box_overlay_'+this.uid, 'class':'dialog_box_overlay_base' }).setStyle({ display: 'none', opacity: 0.8 });
			$(document.body).insert({ bottom: ol });
		}
		this.overlay = $('dialog_box_overlay_'+this.uid);

		if(!$('dialog_box_waiting_overlay_'+this.uid)) {
			var ol = new Element('div', { id: 'dialog_box_waiting_overlay_'+this.uid, 'class':'dialog_box_waiting_overlay' }).setStyle({ display: 'none', opacity: 0.8 });
			$(document.body).insert({ bottom: ol });
		}
		this.waiting_overlay = $('dialog_box_waiting_overlay_'+this.uid);

		if(!$('dialog_box_waiting_throbber_'+this.uid)) {
			var ol = new Element('div', { id: 'dialog_box_waiting_throbber_'+this.uid, 'class':'dialog_box_waiting_throbber' }).setStyle({ display: 'none' });
			var img = new Element('img', { src: '/images/loading.gif', alt: '' });
			ol.insert({ bottom: img });
			$(document.body).insert({ bottom: ol });
		}
		this.waiting_throbber = $('dialog_box_waiting_throbber_'+this.uid);

		if(!this.options.lazyload) this.load();
	},

	setTitle: function(title) {
		this.title.innerHTML = title;
	},

	generateId: function() {
		var chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz";
		var randomstring = '';
		for (var i=0; i<4; i++) {
			var rnum = Math.floor(Math.random() * chars.length);
			randomstring += chars.substring(rnum,rnum+1);
		}
		return randomstring;
	},

	handleKeystroke: function(e) {
		var keyCode = e.keyCode || 0;
		if(keyCode == 13) {
			/* Catch "return" key presses and submit the form. */
			Event.stop(e);
			this.save();
		}
	},

	showLoading: function() {
		this.positionLoading();
		this.posLoadRef = this.positionLoading.bind(this);
		Event.observe(window, 'resize', this.posLoadRef);
		Event.observe(window, 'scroll', this.posLoadRef);
		this.waiting_overlay.show();
		this.waiting_throbber.show();
	},

	hideLoading: function() {
		this.waiting_overlay.hide();
		this.waiting_throbber.hide();
		Event.stopObserving(window, 'resize', this.posLoadRef);
		Event.stopObserving(window, 'scroll', this.posLoadRef);
	},

	positionLoading: function() {
		Element.clonePosition(this.waiting_overlay, this.dialog);
		Position.Center(this.waiting_throbber);
	},

	show: function() {
		var populate = arguments[0] || null;
		this.form.reset();
		this.messages.hide();
		this.place();
		this.overlay.show();
		this.dialog.show();
		this.populate(populate);

		this.placeRef = this.place.bind(this);
		this.handleKeystrokeRef = this.handleKeystroke.bind(this);
		Event.observe(window, 'scroll', this.placeRef);
		Event.observe(window, 'resize', this.placeRef);
		Event.observe(document, 'keydown', this.handleKeystrokeRef);

		this.setFocus(this.content.childNodes);
	},

	hide: function() {
		var evt = arguments[0] || null;
		if(evt) Event.stop(evt);

		this.overlay.hide();
		this.dialog.hide();
		Event.stopObserving(window, 'scroll', this.placeRef);
		Event.stopObserving(window, 'resize', this.placeRef);
		Event.stopObserving(document, 'keydown', this.handleKeystrokeRef);
	},

	feedback: function(message) {
		this.messages.innerHTML = message;
		this.messages.show();
		
		
		if(this.options.for_evaluation){
			this.button_bar.hide();
			this.button_bar_close.show();
		}
			
		if(this.options.scriptaculous) new Effect.Highlight(this.messages, { duration: 2 });
	},

	place: function() {
		var vpd = document.viewport.getDimensions();
		this.overlay.style.width = vpd.width + 'px';
		this.overlay.style.height = vpd.height + 'px';
		var so = document.viewport.getScrollOffsets();
		this.overlay.style.left = so[0] + 'px';
		this.overlay.style.top = so[1] + 'px';

		if(this.options.margin) {
			this.dialog.style.width = (vpd.width - (this.options.margin * 2)) + 'px';
			this.dialog.style.height = (vpd.height - (this.options.margin * 2)) + 'px';
		}
		else if(this.options.maxheight && this.dialog.getHeight() > this.options.maxheight)
			this.dialog.setStyle({ height: this.options.maxheight+'px' });
		else if(this.dialog.getHeight() > (vpd.height-30))
			this.dialog.setStyle({ height: (vpd.height-30)+'px' });

		Position.Center(this.dialog);
	},

	populate: function() {
		var populate = arguments[0] || this.populate;
		if(populate) {
			if($H(populate).keys().include('src')) {
				this.showLoading();
				var parms = {
					method: 'get'
				}
				if($H(populate).keys().include('method')) parms.method = populate.method;
				if($H(populate).keys().include('parameters')) parms.parameters = populate.parameters;
				new Ajax.Request(populate.src, {
					method: parms.method,
					parameters: parms.parameters,
					onSuccess: function(transport) {
						this.hideLoading();
						var json = transport.response.responseJSON || null;
						if(json && json.status && !!json.status && json.data) this.do_populate(json.data);
					}.bind(this),
					onFailure: function() {

					}
				});
			} else {
				this.do_populate(populate);
			}
		}
	},

	do_populate: function() {
		var populate = arguments[0] || this.populate;
		if(populate) {
			for(key in populate) {
				if($(key)) {
					if($(key).tagName.match(/input/i)) {
						if($(key).type.match(/checkbox/i)) $(key).checked = !!populate[key];
						else if ($(key).type.match(/radio/i))	$(key).checked=!!populate[key];	
						else $(key).value = populate[key];
					} else {
						if($(key).tagName.match(/select/i)) {
							var opt = $(key).childElements().find(function(o) { return o.value == populate[key] });
							if(opt) opt.selected = true;
						} else $(key).innerHTML = populate[key];
					}
				}
			}
		}
	},

	load: function() {
		if(this.options.lazyload) {
			this.content.update('');
			this.button_bar.hide();
			this.button_bar_close.hide();
			this.show();
			if(!this.options.margin && !this.options.height)
				this.dialog.setStyle({ height: '100px' });
			this.loading_throbber.show();
		}
		this.loadParameters = Object.extend(
			this.options.parameters,
			arguments[0] || {});
		var options = arguments[1] || {};

		new Ajax.Request(this.template, {
			method: 'get',
			parameters: this.loadParameters,
			onSuccess: function(transport, json, opt) {
				var ret;
				if(ret = transport.response.responseJSON) {
					if(!ret.status) {
						this.loading_throbber.hide();
						this.form.hide();
						this.button_bar_close.show();
						if(!this.options.margin && !this.options.height)
							this.dialog.setStyle({ height: null });

						if(ret.data == 'login')
							this.feedback('Your login session has timed out. Please refresh the page, log into your account, and try again.<br/><br/><a href="#" onclick="location.reload(true);return false;">Reload the page now</a>');
						else this.feedback(ret.messages.join(', '));
					}
					return;
				}
				this.content.update(transport.response.responseText);
				this.form.show();
				this.onLoadSuccess();
			}.bind(this),
			onFailure: this.onLoadFailure.bind(this)
		});

		//new Ajax.Updater(this.content, this.template, {
		//	method: 'get',
		//	parameters: this.loadParameters,
		//	onSuccess: this.onLoadSuccess.bind(this),
		//	onFailure: this.onLoadFailure.bind(this)
		//});
	},

	onLoadSuccess: function() {
		if(this.options.lazyload) {
			this.loading_throbber.hide();
			this.button_bar.show();
			if(!this.options.margin && !this.options.height)
				this.dialog.setStyle({ height: null });
		}

		this.dialog.focus();
	},

	onLoadFailure: function() {
	},

	setFocus: function(nodes) {
		for(node in nodes) {
			if(nodes[node].className && nodes[node].className.match(/dialog_focus/)) {
				nodes[node].focus();
				return false;
			} else {
				if(nodes[node].childNodes && nodes[node].childNodes.length) {
					this.setFocus(nodes[node].childNodes);
				}
			}
		}
	},

	save: function() {
		this.messages.hide();
		if(this.options.save && this.options.save.src) {
			var method = this.options.save.method || 'post';
			var parameters = this.options.save.parameters || {};
			Object.extend(parameters, this.form.serialize(true));
			var qs;
			if(this.options.saveWithLoadParams)
				qs = '?' + $H(this.loadParameters).toQueryString();
			else qs = '';
			this.throbber.show();
			new Ajax.Request(this.options.save.src + qs, {
				method: method,
				parameters: parameters,
				onSuccess: function(transport) {
					this.throbber.hide();
					var json = transport.response.responseJSON || null;
					if(json && json.status && !!json.status) {
						this.hide();
						this.form.reset();
						this.options.onSaveSuccess(transport);
					} else {
						if(json.messages && json.messages.length) {
							this.feedback(json.messages.join(', '));
						} else {
							this.feedback('There was an error saving this information. Please try again.');
						}
					}
				}.bind(this),
				onFailure: function() {
					this.throbber.hide();
					this.options.onSaveFailure.call();
				}.bind(this)
			});
		}
	}
}



/* *** Added these (nonetheless deprecated) functions that we have
 * 	   from the JT versions of prototype.js
 */
Position.getWindowSize = function(w) {
	w = w ? w : window;
	var width = w.innerWidth || (w.document.documentElement.clientWidth || w.document.body.clientWidth);
	var height = w.innerHeight || (w.document.documentElement.clientHeight || w.document.body.clientHeight);
	return { width: width, height: height };
}

/* *** This one, also. */
Position.Center = function(element) {
	var options = Object.extend({
		update: false
	}, arguments[1] || {});

	element = $(element)

	if(!element._centered){
		Element.setStyle(element, { position: 'absolute'});
		if(options.zIndex) Element.setStyle(element, { zIndex: options.zIndex });
		element._centered = true;
	}

	var dims = Element.getDimensions(element);

	//Position.prepare();
	var winSize = Position.getWindowSize();
	var winWidth = winSize.width;
	var winHeight = winSize.height;

	var so = document.viewport.getScrollOffsets();

	var offLeft = (so[0] + Math.floor((winWidth-dims.width)/2));
	var offTop = (so[1] + Math.floor((winHeight-dims.height)/2));
	element.style.top = ((offTop != null && offTop > 0) ? offTop : '0')+ 'px';
	element.style.left = ((offLeft != null && offLeft > 0) ? offLeft :'0') + 'px';

	if (options.update) {
		Event.observe(window, 'resize', function(evt) { Position.Center(element); }, false);
		Event.observe(window, 'scroll', function(evt) { Position.Center(element); }, false);
	}
}


/*--------------------------------------------------------------------------*/

var Ajax = {
  getTransport: function() {
    return Try.these(
      function() {return new XMLHttpRequest()},
      function() {return new ActiveXObject('Msxml2.XMLHTTP')},
      function() {return new ActiveXObject('Microsoft.XMLHTTP')}
    ) || false;
  },

  activeRequestCount: 0
};

Ajax.Responders = {
  responders: [],

  _each: function(iterator) {
    this.responders._each(iterator);
  },

  register: function(responder) {
    if (!this.include(responder))
      this.responders.push(responder);
  },

  unregister: function(responder) {
    this.responders = this.responders.without(responder);
  },

  dispatch: function(callback, request, transport, json) {
    this.each(function(responder) {
      if (Object.isFunction(responder[callback])) {
        try {
          responder[callback].apply(responder, [request, transport, json]);
        } catch (e) { }
      }
    });
  }
};

Object.extend(Ajax.Responders, Enumerable);

Ajax.Responders.register({
  onCreate:   function() { Ajax.activeRequestCount++ },
  onComplete: function() { Ajax.activeRequestCount-- }
});
Ajax.Base = Class.create({
  initialize: function(options) {
    this.options = {
      method:       'post',
      asynchronous: true,
      contentType:  'application/x-www-form-urlencoded',
      encoding:     'UTF-8',
      parameters:   '',
      evalJSON:     true,
      evalJS:       true
    };
    Object.extend(this.options, options || { });

    this.options.method = this.options.method.toLowerCase();

    if (Object.isString(this.options.parameters))
      this.options.parameters = this.options.parameters.toQueryParams();
    else if (Object.isHash(this.options.parameters))
      this.options.parameters = this.options.parameters.toObject();
  }
});
Ajax.Request = Class.create(Ajax.Base, {
  _complete: false,

  initialize: function($super, url, options) {
    $super(options);
    this.transport = Ajax.getTransport();
    this.request(url);
  },

  request: function(url) {
    this.url = url;
    this.method = this.options.method;
    var params = Object.clone(this.options.parameters);

    if (!['get', 'post'].include(this.method)) {
      params['_method'] = this.method;
      this.method = 'post';
    }

    this.parameters = params;

    if (params = Object.toQueryString(params)) {
      if (this.method == 'get')
        this.url += (this.url.include('?') ? '&' : '?') + params;
      else if (/Konqueror|Safari|KHTML/.test(navigator.userAgent))
        params += '&_=';
    }

    try {
      var response = new Ajax.Response(this);
      if (this.options.onCreate) this.options.onCreate(response);
      Ajax.Responders.dispatch('onCreate', this, response);

      this.transport.open(this.method.toUpperCase(), this.url,
        this.options.asynchronous);

      if (this.options.asynchronous) this.respondToReadyState.bind(this).defer(1);

      this.transport.onreadystatechange = this.onStateChange.bind(this);
      this.setRequestHeaders();

      this.body = this.method == 'post' ? (this.options.postBody || params) : null;
      this.transport.send(this.body);

      /* Force Firefox to handle ready state 4 for synchronous requests */
      if (!this.options.asynchronous && this.transport.overrideMimeType)
        this.onStateChange();

    }
    catch (e) {
      this.dispatchException(e);
    }
  },

  onStateChange: function() {
    var readyState = this.transport.readyState;
    if (readyState > 1 && !((readyState == 4) && this._complete))
      this.respondToReadyState(this.transport.readyState);
  },

  setRequestHeaders: function() {
    var headers = {
      'X-Requested-With': 'XMLHttpRequest',
      'X-Prototype-Version': Prototype.Version,
      'Accept': 'text/javascript, text/html, application/xml, text/xml, */*'
    };

    if (this.method == 'post') {
      headers['Content-type'] = this.options.contentType +
        (this.options.encoding ? '; charset=' + this.options.encoding : '');

      /* Force "Connection: close" for older Mozilla browsers to work
       * around a bug where XMLHttpRequest sends an incorrect
       * Content-length header. See Mozilla Bugzilla #246651.
       */
      if (this.transport.overrideMimeType &&
          (navigator.userAgent.match(/Gecko\/(\d{4})/) || [0,2005])[1] < 2005)
            headers['Connection'] = 'close';
    }

    if (typeof this.options.requestHeaders == 'object') {
      var extras = this.options.requestHeaders;

      if (Object.isFunction(extras.push))
        for (var i = 0, length = extras.length; i < length; i += 2)
          headers[extras[i]] = extras[i+1];
      else
        $H(extras).each(function(pair) { headers[pair.key] = pair.value });
    }

    for (var name in headers)
      this.transport.setRequestHeader(name, headers[name]);
  },

  success: function() {
    var status = this.getStatus();
    return !status || (status >= 200 && status < 300);
  },

  getStatus: function() {
    try {
      return this.transport.status || 0;
    } catch (e) { return 0 }
  },

  respondToReadyState: function(readyState) {
    var state = Ajax.Request.Events[readyState], response = new Ajax.Response(this);

    if (state == 'Complete') {
      try {
        this._complete = true;
		/* ***	Customization:
		 *	-	Trim leading and trailing whitespace from responseText. This
		 *		makes dealing with CF returns much easier because they
		 *		typically have a lot of whitespace in them.
		 *	-	Include the responseXML property in the transport object
		 *		returned to the success or failure functions.
		 *	-	Include the options used to call this function when calling
		 *		the success/failure function.
		 *	-	Mangle the parameters sent to the success/failure functions
		 *		for reverse-compatibility. Previously:
		 *			(response, response.headerJSON)
		 */
		var myTransport = {
			response: response,
			responseText: response.responseText.replace(/^\s+/g, '').replace(/\s+$/g, ''),
			responseXML: response.responseXML
		};
        (this.options['on' + response.status]
         || this.options['on' + (this.success() ? 'Success' : 'Failure')]
         || Prototype.emptyFunction)(myTransport, response.headerJSON || response.responseJSON, this.options);
      } catch (e) {
        this.dispatchException(e);
      }

      var contentType = response.getHeader('Content-type');
      if (this.options.evalJS == 'force'
          || (this.options.evalJS && this.isSameOrigin() && contentType
          && contentType.match(/^\s*(text|application)\/(x-)?(java|ecma)script(;.*)?\s*$/i)))
        this.evalResponse();
    }

    try {
      (this.options['on' + state] || Prototype.emptyFunction)(response, response.headerJSON);
      Ajax.Responders.dispatch('on' + state, this, response, response.headerJSON);
    } catch (e) {
      this.dispatchException(e);
    }

    if (state == 'Complete') {
      this.transport.onreadystatechange = Prototype.emptyFunction;
    }
  },

  isSameOrigin: function() {
    var m = this.url.match(/^\s*https?:\/\/[^\/]*/);
    return !m || (m[0] == '#{protocol}//#{domain}#{port}'.interpolate({
      protocol: location.protocol,
      domain: document.domain,
      port: location.port ? ':' + location.port : ''
    }));
  },

  getHeader: function(name) {
    try {
      return this.transport.getResponseHeader(name) || null;
    } catch (e) { return null; }
  },

  evalResponse: function() {
    try {
      return eval((this.transport.responseText || '').unfilterJSON());
    } catch (e) {
      this.dispatchException(e);
    }
  },

  dispatchException: function(exception) {
    (this.options.onException || Prototype.emptyFunction)(this, exception);
    Ajax.Responders.dispatch('onException', this, exception);
  }
});

Ajax.Request.Events =
  ['Uninitialized', 'Loading', 'Loaded', 'Interactive', 'Complete'];


Ajax.Response = Class.create({
  initialize: function(request){
    this.request = request;
    var transport  = this.transport  = request.transport,
        readyState = this.readyState = transport.readyState;

    if((readyState > 2 && !Prototype.Browser.IE) || readyState == 4) {
      this.status       = this.getStatus();
      this.statusText   = this.getStatusText();
      this.responseText = String.interpret(transport.responseText);
      this.headerJSON   = this._getHeaderJSON();
    }

    if(readyState == 4) {
      var xml = transport.responseXML;
      this.responseXML  = Object.isUndefined(xml) ? null : xml;
      this.responseJSON = this._getResponseJSON();
    }
  },

  status:      0,

  statusText: '',

  getStatus: Ajax.Request.prototype.getStatus,

  getStatusText: function() {
    try {
      return this.transport.statusText || '';
    } catch (e) { return '' }
  },

  getHeader: Ajax.Request.prototype.getHeader,

  getAllHeaders: function() {
    try {
      return this.getAllResponseHeaders();
    } catch (e) { return null }
  },

  getResponseHeader: function(name) {
    return this.transport.getResponseHeader(name);
  },

  getAllResponseHeaders: function() {
    return this.transport.getAllResponseHeaders();
  },

  _getHeaderJSON: function() {
    var json = this.getHeader('X-JSON');
    if (!json) return null;
    json = decodeURIComponent(escape(json));
    try {
      return json.evalJSON(this.request.options.sanitizeJSON ||
        !this.request.isSameOrigin());
    } catch (e) {
      this.request.dispatchException(e);
    }
  },

  _getResponseJSON: function() {
    var options = this.request.options;
    if (!options.evalJSON || (options.evalJSON != 'force' &&
      !(this.getHeader('Content-type') || '').include('application/json')) ||
        this.responseText.blank())
          return null;
    try {
      return this.responseText.evalJSON(options.sanitizeJSON ||
        !this.request.isSameOrigin());
    } catch (e) {
      this.request.dispatchException(e);
    }
  }
});

Ajax.Updater = Class.create(Ajax.Request, {
  initialize: function($super, container, url, options) {
    this.container = {
      success: (container.success || container),
      failure: (container.failure || (container.success ? null : container))
    };

    options = Object.clone(options);
    var onComplete = options.onComplete;
    options.onComplete = (function(response, json) {
      this.updateContent(response.responseText);
      if (Object.isFunction(onComplete)) onComplete(response, json);
    }).bind(this);

    $super(url, options);
  },

  updateContent: function(responseText) {
    var receiver = this.container[this.success() ? 'success' : 'failure'],
        options = this.options;

    if (!options.evalScripts) responseText = responseText.stripScripts();

    if (receiver = $(receiver)) {
      if (options.insertion) {
        if (Object.isString(options.insertion)) {
          var insertion = { }; insertion[options.insertion] = responseText;
          receiver.insert(insertion);
        }
        else options.insertion(receiver, responseText);
      }
      else receiver.update(responseText);
    }
  }
});

Ajax.PeriodicalUpdater = Class.create(Ajax.Base, {
  initialize: function($super, container, url, options) {
    $super(options);
    this.onComplete = this.options.onComplete;

    this.frequency = (this.options.frequency || 2);
    this.decay = (this.options.decay || 1);

    this.updater = { };
    this.container = container;
    this.url = url;

    this.start();
  },

  start: function() {
    this.options.onComplete = this.updateComplete.bind(this);
    this.onTimerEvent();
  },

  stop: function() {
    this.updater.options.onComplete = undefined;
    clearTimeout(this.timer);
    (this.onComplete || Prototype.emptyFunction).apply(this, arguments);
  },

  updateComplete: function(response) {
    if (this.options.decay) {
      this.decay = (response.responseText == this.lastText ?
        this.decay * this.options.decay : 1);

      this.lastText = response.responseText;
    }
    this.timer = this.onTimerEvent.bind(this).delay(this.decay * this.frequency);
  },

  onTimerEvent: function() {
    this.updater = new Ajax.Updater(this.container, this.url, this.options);
  }
});



function $(element) {
  if (arguments.length > 1) {
    for (var i = 0, elements = [], length = arguments.length; i < length; i++)
      elements.push($(arguments[i]));
    return elements;
  }
  if (Object.isString(element))
    element = document.getElementById(element);
  return Element.extend(element);
}

if (Prototype.BrowserFeatures.XPath) {
  document._getElementsByXPath = function(expression, parentElement) {
    var results = [];
    var query = document.evaluate(expression, $(parentElement) || document,
      null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
    for (var i = 0, length = query.snapshotLength; i < length; i++)
      results.push(Element.extend(query.snapshotItem(i)));
    return results;
  };
}
