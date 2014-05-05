// File: global.js
// Should be loaded first

if (typeof(window) != 'undefined') window.global = window;
global.isBrowser = !!global.window;
global.isServer = !isBrowser;

Function.prototype.override = function(fn) {
	var superFunction = this;
	return function() {
		this.inherited = superFunction;
		return fn.apply(this, arguments);
	}
}

if (isBrowser) {

	global.html = document.documentElement || document.getElementsByTagName('html')[0];
	global.head = document.head || document.getElementsByTagName('head')[0];

	global.scripts = {};

	global.require = function(scripts, callback) {
		var counter=0,
			scriptLoaded = function() {
				counter++;
				this.script.loaded = true;
				global.scripts[script.namespace] = this.script;
				if (counter == scripts.length && callback) callback();
			},
			scriptError = function() {
				counter++;
				delete this.script;
				head.removeChild(this);
				if (counter == scripts.length && callback) callback();
			}
		for (var i=0; i<scripts.length; ++i) {
			var path = scripts[i],
				file = path.replace(/^.*[\\\/]/, ''),
				namespace = file.replace(/\.[^/.]+$/, "");
			if (!global.scripts[namespace]) {
				var script = {"namespace":namespace,"file":file,"url":path,"element":null,"loaded":false};
				script.element = document.createElement('script');
				script.element.script = script;
				addEvent(script.element, 'load', scriptLoaded);
				addEvent(script.element, 'error', scriptError);
				script.element.src = path;
				head.appendChild(script.element);
			}
		}
	}

	global.free = function(scripts, callback) {
		for (var i=0; i<scripts.length; ++i) {
			var namespace = scripts[i],
				script = global.scripts[namespace];
			if (script) {
				head.removeChild(script.element);
				if (global[namespace]) delete global[namespace];
				delete global.scripts[namespace];
			}
		}
		if (callback) callback();
	}

	global.addEvent = function(element, event, fn) {
		if (element.addEventListener) {
			return element.addEventListener(event, fn, false);
		} else if (element.attachEvent) {
			callback = function() { fn.call(element) }
			return element.attachEvent('on'+event, callback);
		} else return false;
	}

	global.removeEvent = function(element, event, fn) {
		if (element.removeEventListener) {
			return element.removeEventListener(event, fn, false);
		} else if (element.detachEvent) { 
			return element.detachEvent('on'+event, fn);
		} else return false;
	}

}