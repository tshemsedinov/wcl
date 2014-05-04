﻿// WCL Web Component Library
// Version 0.0.3

(function(wcl) {

	wcl.records = [];
	wcl.components = {};
	wcl.utils = {};

	wcl.AjaxAPI = function(methods) { // params: { method: { get/post:url }, ... }
		var api = {};
		api.request = function(apiMethod, params, callback) {
			var err = null, requestParams = this.methods[apiMethod];
			if (requestParams) {
				var httpMethod, url;
				if (requestParams.get ) { httpMethod = 'GET';  url = requestParams.get;  }
				if (requestParams.post) { httpMethod = 'POST'; url = requestParams.post; }
				if (httpMethod) {
					wcl.request(httpMethod, url, params, true, callback);
					return;
				} else err = new Error("DataSource error: HTTP method is not specified");
			} else err = new Error("DataSource error: AJAX method is not specified");
			callback(err, null);
		}
		api.init = function(methods) {
			api.methods = methods;
			for (var method in api.methods) {
				if (method == 'introspect') api[method] = function(params, callback) {
					api.request(method, params, function(err, data) {
						api.init(methods);
						callback(err, data);
					});
				}; else api[method] = function(params, callback) {
					api.request(method, params, callback);
				}
			}
		}
		api.init(methods);
		return api;
	}

	wcl.DataSource = function(methods) {
		// just abstract, see implementation below
		// should be implemented methods:
		//   read(query, callback)   return one record as object, callback(err, obj)
		//   insert(obj, callback)   insert one record, callback(err) on done
		//   update(obj, callback)   update one record, callback(err) on done
		//   delete(query, callback) delete multiple records, callback(err) on done
		// may be implemented methods:
		//   introspect(params, callback) populates DataSource.methods with introspection metadata returning from server
		//   metadata(params, callback)   populates DataSource.metadata with metadata from server
		//   find(query, callback)        return multiple records as Array, callback(err, Array)
	}

	wcl.AjaxDataSource = function(methods) {
		var ds = wcl.AjaxAPI(methods);
		ds.read = function(query, callback) {
			ds.request('read', query, function(err, data) {
				// TODO: autocreate Record
				//   callback(err, wcl.Record({ data:data }));
				//
				callback(err, data);
			});
		}
		return ds;
	}

	wcl.MemoryDataSource = function(params) { // { data:Hash, metadata:Hash }
		var ds = {};
		ds.data = params.data;
		ds.metadata = params.metadata;
		ds.each = function(params, callback) {
			for (var i = 0; i < ds.data.length; i++) {
				var d = ds.data[i], match = true;
				for (var key in params) match = match && (d[key] == params[key]);
				if (match) { if (callback(i)) return; }
			}
		}
		ds.read = function(params, callback) {
			var data = ds.data;
			ds.each(params, function(key) { callback(null, data[key]); return true; });
			callback(new Error("Record not found"), null);
		}
		ds.insert = function(params, callback) {
			ds.data.push(params);
			callback();
		}
		ds.update = function(params, callback) {
			var data = ds.data;
			ds.each(params, function(key) { data[key] = params; return true; });
			callback();
		}
		ds.delete = function(params, callback) {
			var data = ds.data;
			ds.each(params, function(key) { delete data[key]; });
			callback();
		}
		ds.find = function(params, callback) {
			var data = ds.data, result = [];
			ds.each(params, function(key) { result.push(data[key]); });
			callback(null, result);
		}
		return ds;
	}
	
	wcl.Field = function(params) { // { data:Value, metadata:Hash, record:Record }
		var field = {};
		field.data = params.data;
		field.metadata = params.metadata;
		field.record = params.record;
		field.bindings = [];
		field.modified = false;
		field.value = function(value, forceUpdate) {
			if (value != undefined) {
				if ((field.data != value) || forceUpdate) {
					field.data = value;
					field.modified = true;
					if (field.record.updateCount == 0) {
						for (var i = 0; i < field.bindings.length; i++) field.bindings[i].value(value);
					}
				}
			} else return field.data;
		}
		return field;
	}

	wcl.Record = function(params) {
		// implemented params: { data:Hash, metadata:Hash }
		// not implemented:    { table:Table, source:DataSource }
		//
		var record = {};
		record.fields = {};
		record.assign = function(data, metadata, preventUpdateAll) {
			for (var fieldName in data) {
				if (record.fields[fieldName]) record.fields[fieldName].value(data[fieldName]);
				else record.fields[fieldName] = wcl.Field({
					data:     data[fieldName],
					metadata: metadata ? metadata[fieldName] : null,
					record:   record
				});
			}
			if (!preventUpdateAll) record.updateAll();
		}
		record.each = function(callback) { // callback(fieldName, field)
			for (var fieldName in record.fields) callback(fieldName, record.fields[fieldName]);
		}
		record.toObject = function() {
			var result = {};
			record.each(function(fieldName, field) { result[fieldName] = field.value(); });
			return result;
		}
		record.toString = function() {
			return JSON.stringify(record.toObject());
		}
		record.updateCount = 0;
		record.beginUpdate = function() {
			record.updateCount++;
		}
		record.endUpdate = function() {
			record.updateCount--;
			if (record.updateCount <= 0) {
				record.updateCount = 0;
				record.updateAll();
			}
		}
		record.updateAll = function() {
			record.each(function(fieldName, field) { field.value(field.data, true); });
		}
		if (params.data) record.assign(params.data, params.metadata, true);
		return record;
	}

	wcl.Table = function(params) { // Table({ source:DataSource, data:Hash, metadata:Hash })
		var table = {};
		table.memory = wcl.MemoryDataSource({ data:params.data || [] });
		table.metadata = params.metadata;
		table.source = params.source;
		table.toString = function() {
			return JSON.stringify(table.memory.data);
		}
		table.query = function(params, callback) {
			var memory = table.memory;
			table.source.find(params, function(err, data) {
				memory.data = data;
				callback();
			});
		}
		return table;
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

	// TODO: autobind on load
	//
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