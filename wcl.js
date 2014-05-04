// WCL Web Component Library
// Version 0.0.1

(function(wcl) {

	wcl.records = [];
	wcl.components = {};
	wcl.utils = {};

	wcl.DataSource = function(params) {
		// just abstract, see implementation below
	}

	wcl.AjaxDataSource = function(params) { // { read, insert, update, delete, find, metadata }
		this.params = params;
		this.request = function(ajaxMethod, params, callback) {
			var err = null, data = null, requestParams = this.params[ajaxMethod];
			if (requestParams) {
				var httpMethod, url;
				if (requestParams.get ) { httpMethod = 'GET';  url = requestParams.get;  }
				if (requestParams.post) { httpMethod = 'POST'; url = requestParams.post; }
				if (httpMethod) { wcl.request(httpMethod, url, params, true, callback); return; }
				else err = new Error("DataSource error: HTTP method is not specified");
			} else err = new Error("DataSource error: AJAX method is not specified");
			callback(err, data);
		}
		this.read   = function(params, callback) { this.request('read',   params, callback); }
		this.insert = function(params, callback) { this.request('insert', params, callback); }
		this.update = function(params, callback) { this.request('update', params, callback); }
		this.delete = function(params, callback) { this.request('delete', params, callback); }
		this.find   = function(params, callback) { this.request('find',   params, callback); }
	}

	wcl.MemoryDataSource = function(params) { // { data:Hash, metadata:Hash }
		this.data = params.data;
		this.metadata = params.metadata;
		this.each = function(params, callback) {
			for (var i = 0; i < this.data.length; i++) {
				var d = this.data[i], match = true;
				for (var key in params) match = match && (d[key] == params[key]);
				if (match) { if (callback(i)) return; }
			}
		}
		this.read = function(params, callback) {
			var data = this.data;
			this.each(params, function(key) { callback(null, data[key]); return true; });
			callback(new Error("Record not found"), null);
		}
		this.insert = function(params, callback) {
			this.data.push(params);
			callback();
		}
		this.update = function(params, callback) {
			var data = this.data;
			this.each(params, function(key) { data[key] = params; return true; });
			callback();
		}
		this.delete = function(params, callback) {
			var data = this.data;
			this.each(params, function(key) { delete data[key]; });
			callback();
		}
		this.find = function(params, callback) {
			var data = this.data, result = [];
			this.each(params, function(key) { result.push(data[key]); });
			callback(null, result);
		}
	}

	wcl.Field = function(params) { // { data:Value, metadata:Hash, record:Record }
		this.data = params.data;
		this.metadata = params.metadata;
		this.record = params.record;
		this.bindings = [];
		this.modified = false;
		this.value = function(value, forceUpdate) {
			if (value != undefined) {
				if ((this.data != value) || forceUpdate) {
					this.data = value;
					this.modified = true;
					if (this.record.updateCount == 0) {
						for (var i = 0; i < this.bindings.length; i++) this.bindings[i].value(value);
					}
				}
			} else return this.data;
		}
	}

	wcl.Record = function(params) {
		// implemented:      Record({ data:Hash, metadata:Hash })
		// not implemented:  Record({ table:Table, source:DataSource })
		//
		this.fields = {};
		this.assign = function(data, metadata, preventUpdateAll) {
			for (var fieldName in data) {
				if (this.fields[fieldName]) this.fields[fieldName].value(data[fieldName]);
				else this.fields[fieldName] = new wcl.Field({
					data:     data[fieldName],
					metadata: metadata ? metadata[fieldName] : null,
					record:   this
				});
			}
			if (!preventUpdateAll) this.updateAll();
		}
		this.each = function(callback) { // callback(fieldName, field)
			for (var fieldName in this.fields) callback(fieldName, this.fields[fieldName]);
		}
		this.toObject = function() {
			var result = {};
			this.each(function(fieldName, field) { result[fieldName] = field.value(); });
			return result;
		}
		this.toString = function() {
			return JSON.stringify(this.toObject());
		}
		this.updateCount = 0;
		this.beginUpdate = function() {
			this.updateCount++;
		}
		this.endUpdate = function() {
			this.updateCount--;
			if (this.updateCount <= 0) {
				this.updateCount = 0;
				this.updateAll();
			}
		}
		this.updateAll = function() {
			this.each(function(fieldName, field) { field.value(field.data, true); });
		}
		if (params.data) this.assign(params.data, params.metadata, true);
	}

	wcl.Table = function(params) { // Table({ source:DataSource, data:Hash, metadata:Hash })
		this.memory = new wcl.MemoryDataSource({ data:params.data || [] });
		this.metadata = params.metadata;
		this.source = params.source;
		this.toString = function() {
			return JSON.stringify(this.memory.data);
		}
		this.query = function(params, callback) {
			var memory = this.memory;
			this.source.find(params, function(err, data) {
				memory.data = data;
				callback();
			});
		}
	}

	// Nonvisual or visual component
	//
	wcl.components.Component = function(obj) {
	}

	// Visual component
	wcl.components.Control = function(obj) {
		wcl.components.Component(obj);
		obj.wcl.field = obj.wcl.record.fields[obj.wcl.dataWcl.field];
		obj.wcl.field.bindings.push(obj);
	}

	wcl.components.Iterator = function(obj) {
		wcl.components.Control(obj);
		//
	}

	wcl.components.Label = function(obj) {
		wcl.components.Control(obj);
		obj.innerHTML = '<span>'+obj.wcl.field.data+'</span>';
		obj.value = function(value) {
			if (value == undefined) return obj.textContent;
			else if (obj.textContent != value) obj.textContent = value;
		}
	}
	
	wcl.components.Edit = function(obj) {
		wcl.components.Control(obj);
		obj.innerHTML = '<input type="text" name="email">';
		var edit = obj.children[0];
		edit.value = obj.wcl.field.data;
		edit.addEventListener('keyup', function(e) {
			obj.wcl.field.value(this.value);
		}, false);
		obj.value = function(value) {
			var edit = this.children[0];
			if (value == undefined) return edit.value;
			else if (edit.value != value) edit.value = value;
		}
	}

	wcl.components.Button = function(obj) {
		wcl.components.Control(obj);
		obj.innerHTML = '<a href="" onclick=""></a>';
		var edit = obj.children[0];
		edit.value = obj.wcl.field.data;
		edit.addEventListener('click', function(e) {
			console.log('button clicked');
		}, false);
	}

	wcl.bind = function(params) { // { record:Record, container:element }
		params.container.wcl = { record: params.record };
		var elements = params.container.getElementsByTagName('div');
		for (var i = 0; i < elements.length; i++) {
			var element = elements[i],
				dataWcl = element.getAttribute('data-wcl');
			if (dataWcl) {
				element.wcl = { dataWcl: wcl.parse(dataWcl), record: params.record };
				if (element.wcl.dataWcl.control) {
					var component = wcl.components[element.wcl.dataWcl.control]
					component(element);
				}
			}
		}
	}

	wcl.parse = function(json) {
		var result;
		eval('result = new Object('+json+')');
		return result;
	}

	wcl.htmlEscape = function(content) {
		return content.replace(/[&<>"'\/]/g, function(char) { return (
			{ "&":"&amp;","<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[char]
		)});
	}

	wcl.template = function(tpl, data, escapeHtml) {
		return tpl.replace(/@([\-\.0-9a-zA-Z]+)@/g, function(s, key) {
			return escapeHtml ? wcl.htmlEscape(data[key]) : data[key];
		});
	}

	wcl.templateHtml = function(tpl, data) {
		return wcl.template(tpl, data, true);
	}

	wcl.request = function(method, url, params, parseResponse, callback) {
		var req = new XMLHttpRequest(), data = [], value = '';
		req.open(method, url, true);
		for (var key in params) {
			if (!params.hasOwnProperty(key)) continue;
			value = params[key];
			if (typeof(value) != 'string') value = JSON.stringify(value);
			data.push(encodeURIComponent(key)+'='+encodeURIComponent(value));
		}
		data = data.join('&');
		req.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
		req.setRequestHeader("Content-length", data.length);
		req.setRequestHeader("Connection", "close");
		req.onreadystatechange = function() {
			if (req.readyState == 4) {
				var err = null, res = req.responseText;
				if (req.status == 0 || req.status == 200) {
					if (parseResponse) {
						try { res = JSON.parse(res); }
						catch(e) { err = new Error("JSON parse code: "+e); }
					}
				} else err = new Error("HTTP error code: "+req.status);
				callback(err, res);
			}
		}
		try { req.send(data); }
		catch(e) { }
	}

	wcl.get = function(url, params, callback) {
		wcl.request("GET", url, params, true, callback);
	}

	wcl.post = function(url, params, callback) {
		wcl.request("POST", url, params, true, callback);
	}

} (global.wcl = global.wcl || {}));