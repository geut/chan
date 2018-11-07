'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var remark = _interopDefault(require('remark'));
var removePosition = _interopDefault(require('unist-util-remove-position'));
var fs = _interopDefault(require('fs'));
var path = _interopDefault(require('path'));
var querystring = _interopDefault(require('querystring'));
var url = _interopDefault(require('url'));
var punycode = _interopDefault(require('punycode'));

function read(pathname) {
  try {
    return fs.readFileSync(pathname, 'utf8');
  } catch (e) {
    if (e.code === 'ENOENT') {
      return null;
    }

    throw e;
  }
}
function write(pathname, contents) {
  fs.writeFileSync(pathname, contents);
}

const LINE = '\n';
const BREAK = LINE + LINE;
const GAP = BREAK + LINE;
const EMPTY = '';
function emptySpaces (processor) {
  const Compiler = processor.Compiler;

  Compiler.prototype.block = function (node) {
    let self = this;
    let values = [];
    let children = node.children;
    let length = children.length;
    let index = -1;
    let child;
    let prev;

    while (++index < length) {
      child = children[index];

      if (prev) {
        /*
         * Duplicate nodes, such as a list
         * directly following another list,
         * often need multiple new lines.
         *
         * Additionally, code blocks following a list
         * might easily be mistaken for a paragraph
         * in the list itself.
         */
        if (child.type === prev.type && prev.type === 'list') {
          values.push(prev.ordered === child.ordered ? GAP : BREAK);
        } else if (prev.type === 'list' && child.type === 'code' && !child.lang) {
          values.push(GAP);
        } else if (prev.type === 'heading') {
          if (child.type === 'heading' && prev.depth === 2 && child.depth === 2) {
            values.push(BREAK);
          } else {
            values.push(LINE);
          }
        } else if (child.type === 'definition') {
          if (prev.type !== 'definition') {
            values.push(BREAK);
          } else {
            values.push(LINE);
          }
        } else {
          values.push(BREAK);
        }
      }

      values.push(self.visit(child, node));
      prev = child;
    }

    return values.join(EMPTY);
  };
}

function now() {
  const date = new Date();
  return [date.getFullYear(), '-', ('0' + (date.getMonth() + 1)).slice(-2), '-', ('0' + date.getDate()).slice(-2)].join('');
}

function createCommonjsModule(fn, module) {
	return module = { exports: {} }, fn(module, module.exports), module.exports;
}

var ini = createCommonjsModule(function (module, exports) {
exports.parse = exports.decode = decode;

exports.stringify = exports.encode = encode;

exports.safe = safe;
exports.unsafe = unsafe;

var eol = typeof process !== 'undefined' &&
  process.platform === 'win32' ? '\r\n' : '\n';

function encode (obj, opt) {
  var children = [];
  var out = '';

  if (typeof opt === 'string') {
    opt = {
      section: opt,
      whitespace: false
    };
  } else {
    opt = opt || {};
    opt.whitespace = opt.whitespace === true;
  }

  var separator = opt.whitespace ? ' = ' : '=';

  Object.keys(obj).forEach(function (k, _, __) {
    var val = obj[k];
    if (val && Array.isArray(val)) {
      val.forEach(function (item) {
        out += safe(k + '[]') + separator + safe(item) + '\n';
      });
    } else if (val && typeof val === 'object') {
      children.push(k);
    } else {
      out += safe(k) + separator + safe(val) + eol;
    }
  });

  if (opt.section && out.length) {
    out = '[' + safe(opt.section) + ']' + eol + out;
  }

  children.forEach(function (k, _, __) {
    var nk = dotSplit(k).join('\\.');
    var section = (opt.section ? opt.section + '.' : '') + nk;
    var child = encode(obj[k], {
      section: section,
      whitespace: opt.whitespace
    });
    if (out.length && child.length) {
      out += eol;
    }
    out += child;
  });

  return out
}

function dotSplit (str) {
  return str.replace(/\1/g, '\u0002LITERAL\\1LITERAL\u0002')
    .replace(/\\\./g, '\u0001')
    .split(/\./).map(function (part) {
      return part.replace(/\1/g, '\\.')
      .replace(/\2LITERAL\\1LITERAL\2/g, '\u0001')
    })
}

function decode (str) {
  var out = {};
  var p = out;
  var section = null;
  //          section     |key      = value
  var re = /^\[([^\]]*)\]$|^([^=]+)(=(.*))?$/i;
  var lines = str.split(/[\r\n]+/g);

  lines.forEach(function (line, _, __) {
    if (!line || line.match(/^\s*[;#]/)) return
    var match = line.match(re);
    if (!match) return
    if (match[1] !== undefined) {
      section = unsafe(match[1]);
      p = out[section] = out[section] || {};
      return
    }
    var key = unsafe(match[2]);
    var value = match[3] ? unsafe(match[4]) : true;
    switch (value) {
      case 'true':
      case 'false':
      case 'null': value = JSON.parse(value);
    }

    // Convert keys with '[]' suffix to an array
    if (key.length > 2 && key.slice(-2) === '[]') {
      key = key.substring(0, key.length - 2);
      if (!p[key]) {
        p[key] = [];
      } else if (!Array.isArray(p[key])) {
        p[key] = [p[key]];
      }
    }

    // safeguard against resetting a previously defined
    // array by accidentally forgetting the brackets
    if (Array.isArray(p[key])) {
      p[key].push(value);
    } else {
      p[key] = value;
    }
  });

  // {a:{y:1},"a.b":{x:2}} --> {a:{y:1,b:{x:2}}}
  // use a filter to return the keys that have to be deleted.
  Object.keys(out).filter(function (k, _, __) {
    if (!out[k] ||
      typeof out[k] !== 'object' ||
      Array.isArray(out[k])) {
      return false
    }
    // see if the parent section is also an object.
    // if so, add it to that, and mark this one for deletion
    var parts = dotSplit(k);
    var p = out;
    var l = parts.pop();
    var nl = l.replace(/\\\./g, '.');
    parts.forEach(function (part, _, __) {
      if (!p[part] || typeof p[part] !== 'object') p[part] = {};
      p = p[part];
    });
    if (p === out && nl === l) {
      return false
    }
    p[nl] = out[k];
    return true
  }).forEach(function (del, _, __) {
    delete out[del];
  });

  return out
}

function isQuoted (val) {
  return (val.charAt(0) === '"' && val.slice(-1) === '"') ||
    (val.charAt(0) === "'" && val.slice(-1) === "'")
}

function safe (val) {
  return (typeof val !== 'string' ||
    val.match(/[=\r\n]/) ||
    val.match(/^\[/) ||
    (val.length > 1 &&
     isQuoted(val)) ||
    val !== val.trim())
      ? JSON.stringify(val)
      : val.replace(/;/g, '\\;').replace(/#/g, '\\#')
}

function unsafe (val, doUnesc) {
  val = (val || '').trim();
  if (isQuoted(val)) {
    // remove the single quotes before calling JSON.parse
    if (val.charAt(0) === "'") {
      val = val.substr(1, val.length - 2);
    }
    try { val = JSON.parse(val); } catch (_) {}
  } else {
    // walk the val to find the first not-escaped ; character
    var esc = false;
    var unesc = '';
    for (var i = 0, l = val.length; i < l; i++) {
      var c = val.charAt(i);
      if (esc) {
        if ('\\;#'.indexOf(c) !== -1) {
          unesc += c;
        } else {
          unesc += '\\' + c;
        }
        esc = false;
      } else if (';#'.indexOf(c) !== -1) {
        break
      } else if (c === '\\') {
        esc = true;
      } else {
        unesc += c;
      }
    }
    if (esc) {
      unesc += '\\';
    }
    return unesc.trim()
  }
  return val
}
});
var ini_1 = ini.parse;
var ini_2 = ini.decode;
var ini_3 = ini.stringify;
var ini_4 = ini.encode;
var ini_5 = ini.safe;
var ini_6 = ini.unsafe;

var gitconfiglocal = function(dir,options,cb){
  if (typeof options === 'function') {
    cb = options;
    options = {};
  }
  findGit(dir,options,function(config) {
    if(!config) return cb(new Error('no gitconfig to be found at '+dir))
    fs.readFile(config,function(err,data){
      if(err) return cb(err);
      try{
       var formatted = format(ini.parse(data.toString()));
      } catch (e){
       return cb(e);
      }
      cb(false,formatted);
    });
  });
};

function format(data){
  var out = {};
  Object.keys(data).forEach(function(k){
    if(k.indexOf('"')> -1) {
      var parts = k.split('"');
      var parentKey = parts.shift().trim();
      var childKey = parts.shift().trim();
      if(!out[parentKey]) out[parentKey] = {};
      out[parentKey][childKey] = data[k];
    } else {
      out[k] = data[k];
    }
  });
  return out;
}

function findGit(dir,options,cb){
  var folder = path.resolve(dir, options.gitDir || process.env.GIT_DIR || '.git', 'config');
  fs.exists(folder,function(exists) {
    if(exists) return cb(folder);
    if(dir === path.resolve(dir, '..')) return cb(false);
    findGit(path.resolve(dir, '..'), options, cb);
  });
}

var pify_1 = createCommonjsModule(function (module) {

var processFn = function (fn, P, opts) {
	return function () {
		var that = this;
		var args = new Array(arguments.length);

		for (var i = 0; i < arguments.length; i++) {
			args[i] = arguments[i];
		}

		return new P(function (resolve, reject) {
			args.push(function (err, result) {
				if (err) {
					reject(err);
				} else if (opts.multiArgs) {
					var results = new Array(arguments.length - 1);

					for (var i = 1; i < arguments.length; i++) {
						results[i - 1] = arguments[i];
					}

					resolve(results);
				} else {
					resolve(result);
				}
			});

			fn.apply(that, args);
		});
	};
};

var pify = module.exports = function (obj, P, opts) {
	if (typeof P !== 'function') {
		opts = P;
		P = Promise;
	}

	opts = opts || {};
	opts.exclude = opts.exclude || [/.+Sync$/];

	var filter = function (key) {
		var match = function (pattern) {
			return typeof pattern === 'string' ? key === pattern : pattern.test(key);
		};

		return opts.include ? opts.include.some(match) : !opts.exclude.some(match);
	};

	var ret = typeof obj === 'function' ? function () {
		if (opts.excludeMain) {
			return obj.apply(this, arguments);
		}

		return processFn(obj, P, opts).apply(this, arguments);
	} : {};

	return Object.keys(obj).reduce(function (ret, key) {
		var x = obj[key];

		ret[key] = typeof x === 'function' && filter(key) ? processFn(x, P, opts) : x;

		return ret;
	}, ret);
};

pify.all = pify;
});

/**
 * protocols
 * Returns the protocols of an input url.
 *
 * @name protocols
 * @function
 * @param {String} input The input url.
 * @param {Boolean|Number} first If `true`, the first protocol will be returned. If number, it will represent the zero-based index of the protocols array.
 * @return {Array|String} The array of protocols or the specified protocol.
 */
var lib = function protocols(input, first) {

    if (first === true) {
        first = 0;
    }

    var index = input.indexOf("://"),
        splits = input.substring(0, index).split("+").filter(Boolean);

    if (typeof first === "number") {
        return splits[first];
    }

    return splits;
};

// Dependencies


/**
 * isSsh
 * Checks if an input value is a ssh url or not.
 *
 * @name isSsh
 * @function
 * @param {String|Array} input The input url or an array of protocols.
 * @return {Boolean} `true` if the input is a ssh url, `false` otherwise.
 */
function isSsh(input) {

    if (Array.isArray(input)) {
        return input.indexOf("ssh") !== -1 || input.indexOf("rsync") !== -1;
    }

    if (typeof input !== "string") {
        return false;
    }

    var prots = lib(input);
    input = input.substring(input.indexOf("://") + 3);
    if (isSsh(prots)) {
        return true;
    }

    // TODO This probably could be improved :)
    return input.indexOf("@") < input.indexOf(":");
}

var lib$1 = isSsh;

// Dependencies


/**
 * parsePath
 * Parses the input url.
 *
 * @name parsePath
 * @function
 * @param {String} url The input url.
 * @return {Object} An object containing the following fields:
 *
 *  - `protocols` (Array): An array with the url protocols (usually it has one element).
 *  - `protocol` (String): The first protocol, `"ssh"` (if the url is a ssh url) or `"file"`.
 *  - `port` (null|Number): The domain port.
 *  - `resource` (String): The url domain (including subdomains).
 *  - `user` (String): The authentication user (usually for ssh urls).
 *  - `pathname` (String): The url pathname.
 *  - `hash` (String): The url hash.
 *  - `search` (String): The url querystring value.
 *  - `href` (String): The input url.
 *  - `query` (Object): The url querystring, parsed as object.
 */
function parsePath(url$$1) {
    url$$1 = (url$$1 || "").trim();
    var output = {
        protocols: lib(url$$1),
        protocol: null,
        port: null,
        resource: "",
        user: "",
        pathname: "",
        hash: "",
        search: "",
        href: url$$1,
        query: Object.create(null)
    },
        protocolIndex = url$$1.indexOf("://"),
        splits = null,
        parts = null;

    if (url$$1.startsWith(".")) {
        if (url$$1.startsWith("./")) {
            url$$1 = url$$1.substring(2);
        }
        output.pathname = url$$1;
        output.protocol = "file";
    }

    output.protocol = output.protocol || output.protocols[0] || (lib$1(url$$1) ? "ssh" : url$$1.charAt(1) === "/" ? (url$$1 = url$$1.substring(2)) && "" : "file");

    if (protocolIndex !== -1) {
        url$$1 = url$$1.substring(protocolIndex + 3);
    }

    parts = url$$1.split("/");
    if (output.protocol !== "file") {
        output.resource = parts.shift();
    }

    // user@domain
    splits = output.resource.split("@");
    if (splits.length === 2) {
        output.user = splits[0];
        output.resource = splits[1];
    }

    // domain.com:port
    splits = output.resource.split(":");
    if (splits.length === 2) {
        output.resource = splits[0];
        output.port = Number(splits[1]);
        if (isNaN(output.port)) {
            output.port = null;
            parts.unshift(splits[1]);
        }
    }

    // Remove empty elements
    parts = parts.filter(Boolean);

    // Stringify the pathname
    output.pathname = output.pathname || (output.protocol !== "file" || output.href[0] === "/" ? "/" : "") + parts.join("/");

    // #some-hash
    splits = output.pathname.split("#");
    if (splits.length === 2) {
        output.pathname = splits[0];
        output.hash = splits[1];
    }

    // ?foo=bar
    splits = output.pathname.split("?");
    if (splits.length === 2) {
        output.pathname = splits[0];
        output.search = splits[1];
    }

    output.query = querystring.parse(output.search);
    return output;
}

var lib$2 = parsePath;

var strictUriEncode = function (str) {
	return encodeURIComponent(str).replace(/[!'()*]/g, function (c) {
		return '%' + c.charCodeAt(0).toString(16).toUpperCase();
	});
};

/*
object-assign
(c) Sindre Sorhus
@license MIT
*/
/* eslint-disable no-unused-vars */
var getOwnPropertySymbols = Object.getOwnPropertySymbols;
var hasOwnProperty = Object.prototype.hasOwnProperty;
var propIsEnumerable = Object.prototype.propertyIsEnumerable;

function toObject(val) {
	if (val === null || val === undefined) {
		throw new TypeError('Object.assign cannot be called with null or undefined');
	}

	return Object(val);
}

function shouldUseNative() {
	try {
		if (!Object.assign) {
			return false;
		}

		// Detect buggy property enumeration order in older V8 versions.

		// https://bugs.chromium.org/p/v8/issues/detail?id=4118
		var test1 = new String('abc');  // eslint-disable-line no-new-wrappers
		test1[5] = 'de';
		if (Object.getOwnPropertyNames(test1)[0] === '5') {
			return false;
		}

		// https://bugs.chromium.org/p/v8/issues/detail?id=3056
		var test2 = {};
		for (var i = 0; i < 10; i++) {
			test2['_' + String.fromCharCode(i)] = i;
		}
		var order2 = Object.getOwnPropertyNames(test2).map(function (n) {
			return test2[n];
		});
		if (order2.join('') !== '0123456789') {
			return false;
		}

		// https://bugs.chromium.org/p/v8/issues/detail?id=3056
		var test3 = {};
		'abcdefghijklmnopqrst'.split('').forEach(function (letter) {
			test3[letter] = letter;
		});
		if (Object.keys(Object.assign({}, test3)).join('') !==
				'abcdefghijklmnopqrst') {
			return false;
		}

		return true;
	} catch (err) {
		// We don't expect any of the above to throw, but better to be safe.
		return false;
	}
}

var objectAssign = shouldUseNative() ? Object.assign : function (target, source) {
	var from;
	var to = toObject(target);
	var symbols;

	for (var s = 1; s < arguments.length; s++) {
		from = Object(arguments[s]);

		for (var key in from) {
			if (hasOwnProperty.call(from, key)) {
				to[key] = from[key];
			}
		}

		if (getOwnPropertySymbols) {
			symbols = getOwnPropertySymbols(from);
			for (var i = 0; i < symbols.length; i++) {
				if (propIsEnumerable.call(from, symbols[i])) {
					to[symbols[i]] = from[symbols[i]];
				}
			}
		}
	}

	return to;
};

function encoderForArrayFormat(opts) {
	switch (opts.arrayFormat) {
		case 'index':
			return function (key, value, index) {
				return value === null ? [
					encode(key, opts),
					'[',
					index,
					']'
				].join('') : [
					encode(key, opts),
					'[',
					encode(index, opts),
					']=',
					encode(value, opts)
				].join('');
			};

		case 'bracket':
			return function (key, value) {
				return value === null ? encode(key, opts) : [
					encode(key, opts),
					'[]=',
					encode(value, opts)
				].join('');
			};

		default:
			return function (key, value) {
				return value === null ? encode(key, opts) : [
					encode(key, opts),
					'=',
					encode(value, opts)
				].join('');
			};
	}
}

function parserForArrayFormat(opts) {
	var result;

	switch (opts.arrayFormat) {
		case 'index':
			return function (key, value, accumulator) {
				result = /\[(\d*)\]$/.exec(key);

				key = key.replace(/\[\d*\]$/, '');

				if (!result) {
					accumulator[key] = value;
					return;
				}

				if (accumulator[key] === undefined) {
					accumulator[key] = {};
				}

				accumulator[key][result[1]] = value;
			};

		case 'bracket':
			return function (key, value, accumulator) {
				result = /(\[\])$/.exec(key);
				key = key.replace(/\[\]$/, '');

				if (!result) {
					accumulator[key] = value;
					return;
				} else if (accumulator[key] === undefined) {
					accumulator[key] = [value];
					return;
				}

				accumulator[key] = [].concat(accumulator[key], value);
			};

		default:
			return function (key, value, accumulator) {
				if (accumulator[key] === undefined) {
					accumulator[key] = value;
					return;
				}

				accumulator[key] = [].concat(accumulator[key], value);
			};
	}
}

function encode(value, opts) {
	if (opts.encode) {
		return opts.strict ? strictUriEncode(value) : encodeURIComponent(value);
	}

	return value;
}

function keysSorter(input) {
	if (Array.isArray(input)) {
		return input.sort();
	} else if (typeof input === 'object') {
		return keysSorter(Object.keys(input)).sort(function (a, b) {
			return Number(a) - Number(b);
		}).map(function (key) {
			return input[key];
		});
	}

	return input;
}

var extract = function (str) {
	return str.split('?')[1] || '';
};

var parse = function (str, opts) {
	opts = objectAssign({arrayFormat: 'none'}, opts);

	var formatter = parserForArrayFormat(opts);

	// Create an object with no prototype
	// https://github.com/sindresorhus/query-string/issues/47
	var ret = Object.create(null);

	if (typeof str !== 'string') {
		return ret;
	}

	str = str.trim().replace(/^(\?|#|&)/, '');

	if (!str) {
		return ret;
	}

	str.split('&').forEach(function (param) {
		var parts = param.replace(/\+/g, ' ').split('=');
		// Firefox (pre 40) decodes `%3D` to `=`
		// https://github.com/sindresorhus/query-string/pull/37
		var key = parts.shift();
		var val = parts.length > 0 ? parts.join('=') : undefined;

		// missing `=` should be `null`:
		// http://w3.org/TR/2012/WD-url-20120524/#collect-url-parameters
		val = val === undefined ? null : decodeURIComponent(val);

		formatter(decodeURIComponent(key), val, ret);
	});

	return Object.keys(ret).sort().reduce(function (result, key) {
		var val = ret[key];
		if (Boolean(val) && typeof val === 'object' && !Array.isArray(val)) {
			// Sort object keys, not values
			result[key] = keysSorter(val);
		} else {
			result[key] = val;
		}

		return result;
	}, Object.create(null));
};

var stringify = function (obj, opts) {
	var defaults = {
		encode: true,
		strict: true,
		arrayFormat: 'none'
	};

	opts = objectAssign(defaults, opts);

	var formatter = encoderForArrayFormat(opts);

	return obj ? Object.keys(obj).sort().map(function (key) {
		var val = obj[key];

		if (val === undefined) {
			return '';
		}

		if (val === null) {
			return encode(key, opts);
		}

		if (Array.isArray(val)) {
			var result = [];

			val.slice().forEach(function (val2) {
				if (val2 === undefined) {
					return;
				}

				result.push(formatter(key, val2, result.length));
			});

			return result.join('&');
		}

		return encode(key, opts) + '=' + encode(val, opts);
	}).filter(function (x) {
		return x.length > 0;
	}).join('&') : '';
};

var queryString = {
	extract: extract,
	parse: parse,
	stringify: stringify
};

var prependHttp = function (url$$1) {
	if (typeof url$$1 !== 'string') {
		throw new TypeError('Expected a string, got ' + typeof url$$1);
	}

	url$$1 = url$$1.trim();

	if (/^\.*\/|^(?!localhost)\w+:/.test(url$$1)) {
		return url$$1;
	}

	return url$$1.replace(/^(?!(?:\w+:)?\/\/)/, 'http://');
};

var toString = Object.prototype.toString;

var isPlainObj = function (x) {
	var prototype;
	return toString.call(x) === '[object Object]' && (prototype = Object.getPrototypeOf(x), prototype === null || prototype === Object.getPrototypeOf({}));
};

var sortKeys = function (obj, opts) {
	if (!isPlainObj(obj)) {
		throw new TypeError('Expected a plain object');
	}

	opts = opts || {};

	// DEPRECATED
	if (typeof opts === 'function') {
		opts = {compare: opts};
	}

	var deep = opts.deep;
	var seenInput = [];
	var seenOutput = [];

	var sortKeys = function (x) {
		var seenIndex = seenInput.indexOf(x);

		if (seenIndex !== -1) {
			return seenOutput[seenIndex];
		}

		var ret = {};
		var keys = Object.keys(x).sort(opts.compare);

		seenInput.push(x);
		seenOutput.push(ret);

		for (var i = 0; i < keys.length; i++) {
			var key = keys[i];
			var val = x[key];

			ret[key] = deep && isPlainObj(val) ? sortKeys(val) : val;
		}

		return ret;
	};

	return sortKeys(obj);
};

var DEFAULT_PORTS = {
	'http:': 80,
	'https:': 443,
	'ftp:': 21
};

// protocols that always contain a `//`` bit
var slashedProtocol = {
	'http': true,
	'https': true,
	'ftp': true,
	'gopher': true,
	'file': true,
	'http:': true,
	'https:': true,
	'ftp:': true,
	'gopher:': true,
	'file:': true
};

function testParameter(name, filters) {
	return filters.some(function (filter) {
		return filter instanceof RegExp ? filter.test(name) : filter === name;
	});
}

var normalizeUrl = function (str, opts) {
	opts = objectAssign({
		normalizeProtocol: true,
		normalizeHttps: false,
		stripFragment: true,
		stripWWW: true,
		removeQueryParameters: [/^utm_\w+/i],
		removeTrailingSlash: true,
		removeDirectoryIndex: false
	}, opts);

	if (typeof str !== 'string') {
		throw new TypeError('Expected a string');
	}

	var hasRelativeProtocol = str.indexOf('//') === 0;

	// prepend protocol
	str = prependHttp(str.trim()).replace(/^\/\//, 'http://');

	var urlObj = url.parse(str);

	if (opts.normalizeHttps && urlObj.protocol === 'https:') {
		urlObj.protocol = 'http:';
	}

	if (!urlObj.hostname && !urlObj.pathname) {
		throw new Error('Invalid URL');
	}

	// prevent these from being used by `url.format`
	delete urlObj.host;
	delete urlObj.query;

	// remove fragment
	if (opts.stripFragment) {
		delete urlObj.hash;
	}

	// remove default port
	var port = DEFAULT_PORTS[urlObj.protocol];
	if (Number(urlObj.port) === port) {
		delete urlObj.port;
	}

	// remove duplicate slashes
	if (urlObj.pathname) {
		urlObj.pathname = urlObj.pathname.replace(/\/{2,}/g, '/');
	}

	// decode URI octets
	if (urlObj.pathname) {
		urlObj.pathname = decodeURI(urlObj.pathname);
	}

	// remove directory index
	if (opts.removeDirectoryIndex === true) {
		opts.removeDirectoryIndex = [/^index\.[a-z]+$/];
	}

	if (Array.isArray(opts.removeDirectoryIndex) && opts.removeDirectoryIndex.length) {
		var pathComponents = urlObj.pathname.split('/');
		var lastComponent = pathComponents[pathComponents.length - 1];

		if (testParameter(lastComponent, opts.removeDirectoryIndex)) {
			pathComponents = pathComponents.slice(0, pathComponents.length - 1);
			urlObj.pathname = pathComponents.slice(1).join('/') + '/';
		}
	}

	// resolve relative paths, but only for slashed protocols
	if (slashedProtocol[urlObj.protocol]) {
		var domain = urlObj.protocol + '//' + urlObj.hostname;
		var relative = url.resolve(domain, urlObj.pathname);
		urlObj.pathname = relative.replace(domain, '');
	}

	if (urlObj.hostname) {
		// IDN to Unicode
		urlObj.hostname = punycode.toUnicode(urlObj.hostname).toLowerCase();

		// remove trailing dot
		urlObj.hostname = urlObj.hostname.replace(/\.$/, '');

		// remove `www.`
		if (opts.stripWWW) {
			urlObj.hostname = urlObj.hostname.replace(/^www\./, '');
		}
	}

	// remove URL with empty query string
	if (urlObj.search === '?') {
		delete urlObj.search;
	}

	var queryParameters = queryString.parse(urlObj.search);

	// remove query unwanted parameters
	if (Array.isArray(opts.removeQueryParameters)) {
		for (var key in queryParameters) {
			if (testParameter(key, opts.removeQueryParameters)) {
				delete queryParameters[key];
			}
		}
	}

	// sort query parameters
	urlObj.search = queryString.stringify(sortKeys(queryParameters));

	// decode query parameters
	urlObj.search = decodeURIComponent(urlObj.search);

	// take advantage of many of the Node `url` normalizations
	str = url.format(urlObj);

	// remove ending `/`
	if (opts.removeTrailingSlash || urlObj.pathname === '/') {
		str = str.replace(/\/$/, '');
	}

	// restore relative protocol, if applicable
	if (hasRelativeProtocol && !opts.normalizeProtocol) {
		str = str.replace(/^http:\/\//, '//');
	}

	return str;
};

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };



/**
 * parseUrl
 * Parses the input url.
 *
 * **Note**: This *throws* if invalid urls are provided.
 *
 * @name parseUrl
 * @function
 * @param {String} url The input url.
 * @param {Boolean|Object} normalize Wheter to normalize the url or not.
 *                         Default is `true`. If `false`, the url will
 *                         not be normalized. If an object, it will be the
 *                         options object sent to [`normalize-url`](https://github.com/sindresorhus/normalize-url).
 *
 * @return {Object} An object containing the following fields:
 *
 *  - `protocols` (Array): An array with the url protocols (usually it has one element).
 *  - `protocol` (String): The first protocol, `"ssh"` (if the url is a ssh url) or `"file"`.
 *  - `port` (null|Number): The domain port.
 *  - `resource` (String): The url domain (including subdomains).
 *  - `user` (String): The authentication user (usually for ssh urls).
 *  - `pathname` (String): The url pathname.
 *  - `hash` (String): The url hash.
 *  - `search` (String): The url querystring value.
 *  - `href` (String): The input url.
 *  - `query` (Object): The url querystring, parsed as object.
 */
function parseUrl(url$$1) {
    var normalize = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;

    if (normalize) {
        if ((typeof normalize === "undefined" ? "undefined" : _typeof(normalize)) !== "object") {
            normalize = {
                stripFragment: false
            };
        }
        url$$1 = normalizeUrl(url$$1, normalize);
    }
    var parsed = lib$2(url$$1);
    if (parsed.protocol === "file") {
        throw new Error("You provided a local path.");
    }
    return parsed;
}

var lib$3 = parseUrl;

// Dependencies



/**
 * gitUp
 * Parses the input url.
 *
 * @name gitUp
 * @function
 * @param {String} input The input url.
 * @return {Object} An object containing the following fields:
 *
 *  - `protocols` (Array): An array with the url protocols (usually it has one element).
 *  - `port` (null|Number): The domain port.
 *  - `resource` (String): The url domain (including subdomains).
 *  - `user` (String): The authentication user (usually for ssh urls).
 *  - `pathname` (String): The url pathname.
 *  - `hash` (String): The url hash.
 *  - `search` (String): The url querystring value.
 *  - `href` (String): The input url.
 *  - `protocol` (String): The git url protocol.
 *  - `token` (String): The oauth token (could appear in the https urls).
 */
function gitUp(input) {
    var output = lib$3(input);
    output.token = "";

    var splits = output.user.split(":");
    if (splits.length === 2) {
        if (splits[1] === "x-oauth-basic") {
            output.token = splits[0];
        } else if (splits[0] === "x-token-auth") {
            output.token = splits[1];
        }
    }

    if (lib$1(output.protocols) || lib$1(input)) {
        output.protocol = "ssh";
    } else if (output.protocols.length) {
        output.protocol = output.protocols[0];
    } else {
        output.protocol = "file";
    }

    return output;
}

var lib$4 = gitUp;

/**
 * gitUrlParse
 * Parses a Git url.
 *
 * @name gitUrlParse
 * @function
 * @param {String} url The Git url to parse.
 * @return {GitUrl} The `GitUrl` object containing:
 *
 *  - `protocols` (Array): An array with the url protocols (usually it has one element).
 *  - `port` (null|Number): The domain port.
 *  - `resource` (String): The url domain (including subdomains).
 *  - `user` (String): The authentication user (usually for ssh urls).
 *  - `pathname` (String): The url pathname.
 *  - `hash` (String): The url hash.
 *  - `search` (String): The url querystring value.
 *  - `href` (String): The input url.
 *  - `protocol` (String): The git url protocol.
 *  - `token` (String): The oauth token (could appear in the https urls).
 *  - `source` (String): The Git provider (e.g. `"github.com"`).
 *  - `owner` (String): The repository owner.
 *  - `name` (String): The repository name.
 *  - `full_name` (String): The owner and name values in the `owner/name` format.
 *  - `toString` (Function): A function to stringify the parsed url into another url type.
 *  - `organization` (String): The organization the owner belongs to. This is CloudForge specific.
 *
 */
function gitUrlParse(url$$1) {

    if (typeof url$$1 !== "string") {
        throw new Error("The url must be a string.");
    }

    var urlInfo = lib$4(url$$1),
        sourceParts = urlInfo.resource.split("."),
        splits = null;

    urlInfo.toString = function (type) {
        return gitUrlParse.stringify(this, type);
    };

    urlInfo.source = sourceParts.length > 2 ? sourceParts.slice(-2).join(".") : urlInfo.source = urlInfo.resource;

    urlInfo.name = urlInfo.pathname.substring(1).replace(/\.git$/, "");
    urlInfo.owner = urlInfo.user;
    urlInfo.organization = urlInfo.owner;

    switch (urlInfo.source) {
        case "cloudforge.com":
            urlInfo.owner = urlInfo.user;
            urlInfo.organization = sourceParts[0];
            break;
        default:
            splits = urlInfo.name.split("/");
            if (splits.length === 2) {
                urlInfo.owner = splits[0];
                urlInfo.name = splits[1];
            }
            break;
    }

    urlInfo.full_name = urlInfo.owner;
    if (urlInfo.name) {
        urlInfo.full_name && (urlInfo.full_name += "/");
        urlInfo.full_name += urlInfo.name;
    }

    return urlInfo;
}

/**
 * stringify
 * Stringifies a `GitUrl` object.
 *
 * @name stringify
 * @function
 * @param {GitUrl} obj The parsed Git url object.
 * @param {String} type The type of the stringified url (default `obj.protocol`).
 * @return {String} The stringified url.
 */
gitUrlParse.stringify = function (obj, type) {
    type = type || (obj.protocols && obj.protocols.length ? obj.protocols.join('+') : obj.protocol);
    var port = obj.port ? ":" + obj.port : '';
    var user = obj.user || 'git';
    switch (type) {
        case "ssh":
            if (port) return "ssh://" + user + "@" + obj.resource + port + "/" + obj.full_name + ".git";else return user + "@" + obj.resource + ":" + obj.full_name + ".git";
        case "git+ssh":
        case "ssh+git":
        case "ftp":
        case "ftps":
            return type + "://" + user + "@" + obj.resource + port + "/" + obj.full_name + ".git";
        case "http":
        case "https":
            var token = "";
            if (obj.token) {
                token = buildToken(obj);
            }
            return type + "://" + token + obj.resource + port + "/" + obj.full_name;
        default:
            return obj.href;
    }
};

/*!
 * buildToken
 * Builds OAuth token prefix (helper function)
 *
 * @name buildToken
 * @function
 * @param {GitUrl} obj The parsed Git url object.
 * @return {String} token prefix
 */
function buildToken(obj) {
    switch (obj.source) {
        case "bitbucket.org":
            return "x-token-auth:" + obj.token + "@";
        default:
            return obj.token + "@";
    }
}

var lib$5 = gitUrlParse;

function defineGITCompare(url$$1) {
  let parseUrl = lib$5(url$$1);
  return `${parseUrl.toString('https')}/compare/<from>...<to>`;
}
function gitUrlCompare(gitCompare) {
  let request;

  if (gitCompare) {
    request = Promise.resolve({
      fromUser: true,
      url: gitCompare
    });
  } else {
    request = pify_1(gitconfiglocal)(process.cwd()).then(config => {
      const url$$1 = config.remote && config.remote.origin && config.remote.origin.url;
      return {
        fromUser: false,
        url: url$$1
      };
    });
  }

  return request.then(urlObj => {
    if (urlObj.fromUser) {
      return urlObj.url;
    }

    return defineGITCompare(urlObj.url);
  });
}

const MARKERS = {
  INITIAL: 0,
  UNRELEASED: 3
};
const STAGES = {
  RELEASE: 0,
  DEFINITION: 1
};
const LINE$1 = '\n';
const BREAK$1 = LINE$1 + LINE$1;
const TPL = {
  UNRELEASED: '## [Unreleased]',
  H3: '### <text>',
  H4: '#### <text>',
  VERSION: '## [<version>] - <date>',
  LI: '- <text>',
  LI1: '  - <text>',
  DEFINITION: '[<version>]: <git-compare>'
};
const REGEX_GET_VERSION = /##\s\[?([0-9\.]*)\]?\s-/g;
const REGEX_GROUP = /\[([^\]]+)\]\s/g;

function processRelease(release, node, elem, stringify, m) {
  if (elem.type === 'heading') {
    node = {};
    node.text = stringify(elem.children[0]);
    node.children = [];
    release.children.push(node);
  } else {
    const mLI = m('- ');

    for (let li of elem.children) {
      mLI.children[0] = li;
      const text = stringify(mLI).slice(2);
      const group = REGEX_GROUP.exec(text);
      node.children.push({
        text: text.replace(REGEX_GROUP, ''),
        group: group ? group[1] : undefined
      });
    }
  }

  release.len++;
  return node;
}

function decode(parser) {
  const children = parser.root.children;
  const stringify = parser.stringify;
  const m = parser.createMDAST;
  const that = {
    releases: [{
      text: TPL.UNRELEASED,
      start: MARKERS.UNRELEASED,
      len: 1,
      children: []
    }],
    definitions: {
      children: []
    }
  };
  let node;
  let pos = MARKERS.UNRELEASED;
  let currentStage = STAGES.RELEASE;

  for (let elem of children.slice(MARKERS.UNRELEASED + 1)) {
    if (elem.type === 'heading' && elem.depth === 2) {
      const release = {
        text: stringify(elem),
        start: pos,
        len: 1,
        children: []
      };
      that.releases.push(release);
      pos++;
      continue;
    } else if (elem.type === 'definition') {
      currentStage = STAGES.DEFINITION;
    }

    if (currentStage === STAGES.RELEASE) {
      node = processRelease(that.releases[that.releases.length - 1], node, elem, stringify, m);
    } else {
      if (that.definitions.start === undefined) {
        that.definitions.start = pos;
      }

      that.definitions.children.push({
        text: stringify(elem)
      });
    }

    pos++;
  }

  return that;
}

function textFromLI(li) {
  return li.text.split('\n').map((line, i) => {
    line = line.trim();

    if (line.length > 0 && i > 0) {
      return '  ' + line;
    }

    return line;
  }).join('\n');
}

function groupFromLI(li) {
  if (!li.group) return '';
  return `[${li.group}] `;
}

function groupChanges(changes = []) {
  const groups = {};

  for (const {
    text: type,
    children
  } of changes) {
    for (const {
      text,
      group = ''
    } of children) {
      if (!groups[type]) groups[type] = {};
      if (!groups[type][group]) groups[type][group] = [];
      groups[type][group].push(textFromLI({
        text
      }));
    }
  }

  const tpl = Object.keys(groups).map(type => {
    let result = TPL.H3.replace('<text>', type) + LINE$1; // #### Added

    result += Object.keys(groups[type]).sort().map(group => {
      const haveGroup = !!group;
      let typeTpl = haveGroup ? TPL.LI.replace('<text>', group) + LINE$1 : ''; // ### group OR ### Core

      typeTpl += groups[type][group].map(text => {
        return (haveGroup ? TPL.LI1 : TPL.LI).replace('<text>', text);
      }).join(LINE$1);
      return typeTpl;
    }).join(LINE$1);
    return result;
  }).join(BREAK$1);
  return tpl;
}

function compileRelease(release = 0, children, m, version = null, group = false) {
  let tpl;

  if (group) {
    tpl = groupChanges(this.releases[release].children);
  } else {
    tpl = this.releases[release].children.map(node => {
      return TPL.H3.replace('<text>', node.text) + LINE$1 + node.children.reduce((result, li) => {
        return result + LINE$1 + TPL.LI.replace('<text>', groupFromLI(li) + textFromLI(li));
      }, '');
    }).join(BREAK$1);
  }

  if (version) {
    let tplVersion = TPL.VERSION.replace('<version>', version).replace('<date>', now());

    if (this.releases.length === 1) {
      tplVersion = tplVersion.replace(/(\[|\])/g, '');
    } else if (this.releases[release].children.length === 0) {
      tplVersion += ' [YANKED]';
    }

    tpl = TPL.UNRELEASED + LINE$1 + tplVersion + LINE$1 + tpl;
  } else {
    tpl = this.releases[release].text + LINE$1 + tpl;
  }

  const len = this.releases[release].len;
  const tplParsed = m(tpl);
  this.releases[release].len = tplParsed.length;
  children.splice(this.releases[release].start, len, ...tplParsed);
  let left = this.releases[release];

  if (this.releases.length > 1) {
    this.releases.slice(release + 1).forEach(r => {
      r.start = left.start + left.len;
      left = r;
    });
  }

  this.definitions.start = left.start + left.len;
  return tpl;
}

function findHeaderOrCreate(type) {
  let node;

  for (let value of this.releases[0].children) {
    if (value.text.toLowerCase().trim() === type.toLowerCase().trim()) {
      node = value;
      break;
    }
  }

  if (!node) {
    const text = type.toLowerCase().trim();
    node = {
      text: text[0].toUpperCase() + text.substr(1, text.length),
      children: []
    };
    this.releases[0].children.push(node);
    this.releases[0].children.sort((a, b) => a.text.localeCompare(b.text));
  }

  return node;
}

function addDefinition(version = 'unreleased', gitCompare = null) {
  const that = this;
  return gitUrlCompare(gitCompare).then(url$$1 => {
    let def = TPL.DEFINITION.replace('<git-compare>', url$$1);

    if (that.definitions.children.length > 0) {
      const oldNode = that.definitions.children[0];
      oldNode.text = oldNode.text.replace('HEAD', `v${version}`).replace('unreleased', version);
    }

    that.definitions.children.splice(0, 0, {
      text: def.replace('<version>', 'unreleased').replace('<from>', `v${version}`).replace('<to>', 'HEAD')
    });
    return Promise.resolve();
  });
}

function compileDefinitions(children, m) {
  const tpl = this.definitions.children.map(node => {
    return node.text;
  }).join(LINE$1);
  const tplParsed = m(tpl, true);
  const end = children.length - this.definitions.start;
  children.splice(this.definitions.start, end, ...tplParsed);
}

function mtree(parser) {
  const gitCompare = parser.gitCompare;
  const that = Object.assign({}, decode(parser));

  that.compileRelease = function (release) {
    return compileRelease.call(this, release, parser.root.children, parser.createMDAST);
  };

  that.compileUnreleased = function () {
    return that.compileRelease(0);
  };

  that.version = function (version, options) {
    compileRelease.call(this, 0, parser.root.children, parser.createMDAST, version, options.group);
    return that.addDefinition(version, gitCompare);
  };

  that.insert = function (type, value, options) {
    const node = findHeaderOrCreate.call(this, type);
    node.children.push({
      text: value,
      group: options.group
    });
    that.compileUnreleased();
    return Promise.resolve();
  };

  that.addDefinition = function (version) {
    return addDefinition.call(that, version, gitCompare).then(() => {
      return compileDefinitions.call(that, parser.root.children, parser.createMDAST);
    });
  };

  that.findRelease = function (version) {
    let node;

    for (let value of this.releases) {
      const release = REGEX_GET_VERSION.exec(value.text.toLowerCase().trim());

      if (release && release[1] && release[1] === version.toLowerCase().trim()) {
        node = value;
        break;
      }
    }

    return node;
  };

  that.TPL = TPL;
  return that;
}

const SEPARATORS = {
  added: 'Added',
  changed: 'Changed',
  fixed: 'Fixed',
  security: 'Security',
  deprecated: 'Deprecated',
  removed: 'Removed'
};
const remarkInstance = remark().use(emptySpaces);
function parser(dir = process.cwd()) {
  let _mtree;

  const pathname = path.resolve(dir, 'CHANGELOG.md');
  const contents = read(pathname);
  return {
    remark: remarkInstance,
    gitCompare: null,
    SEPARATORS,
    root: removePosition(remarkInstance.parse(contents), true),

    createMDAST(value, forceArray = false) {
      const result = removePosition(remarkInstance.parse(value), true);

      if (result.children.length === 1 && !forceArray) {
        return result.children[0];
      }

      return result.children;
    },

    exists() {
      return contents !== null;
    },

    write(content = this.stringify()) {
      return write(pathname, content);
    },

    stringify(root = this.root) {
      return remarkInstance.stringify(root, {
        listItemIndent: '1'
      });
    },

    getMTREE() {
      if (_mtree) {
        return _mtree;
      }

      _mtree = mtree(this);
      return _mtree;
    },

    change(type, value, options) {
      return this.getMTREE().insert(type, value, options);
    },

    release(version, options) {
      return this.getMTREE().version(version, options);
    },

    findRelease(version) {
      return this.getMTREE().findRelease(version);
    }

  };
}

module.exports = parser;
