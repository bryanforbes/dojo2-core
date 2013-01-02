define([
	'exports'
], function (exports) {
	// module:
	//		dojo/lang

	var ObjectPrototype = Object.prototype,
		ownProperty = ObjectPrototype.hasOwnProperty,
		slice = Array.prototype.slice;

	/**
	 * Adds all properties of source to destination. Properties inherited from
	 * Object.prototype and properties that are exactly the same are skipped.
	 *
	 * @param {Object} destination
	 * The object to which to add all properties
	 * @param {Object} source
	 * The object from which to copy all properties
	 * @param {function(): ?=} copyFunction
	 * An optional function to call to perform the copy
	 * @returns {Object}
	 */
	exports._mixin = function _mixin(destination, source, copyFunction) {
		for (var key in source) {
			var value = source[key];
			if (key in ObjectPrototype && ObjectPrototype[key] === value) {
				// skip properties on Object.prototype
				continue;
			}
			if (key in destination && destination[key] === value) {
				// skip properties that destination already has
				continue;
			}
			destination[key] = copyFunction ? copyFunction(value) : value;
		}

		return destination;
	};

	/**
	 * Adds all properties of one or more sources to destination
	 *
	 * @param {Object} destination
	 * The object to which to add all properties
	 * @param {...Object} var_args
	 * One or more objects from which to copy all properties
	 * @returns {Object}
	 */
	exports.mixin = function mixin(destination) {
		// example:
		//		make a shallow copy of an object
		//	|	var copy = lang.mixin({}, source);
		// example:
		//		many class constructors often take an object which specifies
		//		values to be configured on the object. In this case, it is
		//		often simplest to call `lang.mixin` on the `this` object:
		//	|	declare("acme.Base", null, {
		//	|		constructor: function(properties){
		//	|			// property configuration:
		//	|			lang.mixin(this, properties);
		//	|
		//	|			console.log(this.quip);
		//	|			//	...
		//	|		},
		//	|		quip: "I wasn't born yesterday, you know - I've seen movies.",
		//	|		// ...
		//	|	});
		//	|
		//	|	// create an instance of the class and configure it
		//	|	var b = new acme.Base({quip: "That's what it does!" });
		// example:
		//		copy in properties from multiple objects
		//	|	var flattened = lang.mixin(
		//	|		{
		//	|			name: "Frylock",
		//	|			braces: true
		//	|		},
		//	|		{
		//	|			name: "Carl Brutanananadilewski"
		//	|		}
		//	|	);
		//	|
		//	|	// will print "Carl Brutanananadilewski"
		//	|	console.log(flattened.name);
		//	|	// will print "true"
		//	|	console.log(flattened.braces);
		for (var i = 1, l = arguments.length; i < l; i++) {
			exports._mixin(destination, arguments[i]);
		}
		return destination;
	};

	/**
	 * Performs a deep clone of objects and their children.
	 * Supports Array, RegExp, Date, Node (DOM), Object, and objects with constructors.
	 * Does not clone functions. Does not correctly handle cyclic structures.
	 */
	exports.clone = function (object) {
		var returnValue;

		if (!object || typeof object !== 'object') {
			returnValue = object;
		}
		else if (object.nodeType && 'cloneNode' in object) {
			returnValue = object.cloneNode(true);
		}
		else if (object instanceof Date || object instanceof RegExp) {
			returnValue = new object.constructor(object);
		}
		else {
			if (Array.isArray(object)) {
				returnValue = [];
			}
			else {
				returnValue = object.constructor ? new object.constructor() : {};
			}

			exports._mixin(returnValue, object, exports.clone);
		}

		return returnValue;
	};

	function getDottedProperty(object, parts, create) {
		var key,
			i = 0;

		while (object && (key = parts[i++])) {
			object = key in object ? object[key] : (create ? object[key] = {} : undefined);
		}

		return object;
	}

	/**
	 * Sets a property from a dot-separated string, such as "A.B.C"
	 *
	 * @param {Object} object
	 * Object to use as the root of the "path"
	 * @param {string} property
	 * Path to a property in the form "A.B.C"
	 * @param {?} value
	 * Value to place at the path
	 * @returns {?}
	 */
	exports.setProperty = function setProperty(object, property, value) {
		// example:
		//		set the value of `foo.bar.baz`, regardless of whether
		//		intermediate objects already exist:
		//	| lang.setObject("foo.bar.baz", value);
		// example:
		//		without `lang.setObject`, we often see code like this:
		//	| // ensure that intermediate objects are available
		//	| if(!obj["parent"]){ obj.parent = {}; }
		//	| if(!obj.parent["child"]){ obj.parent.child = {}; }
		//	| // now we can safely set the property
		//	| obj.parent.child.prop = "some value";
		//		whereas with `lang.setObject`, we can shorten that to:
		//	| lang.setObject("parent.child.prop", "some value", obj);
		if (!object) {
			return;
		}

		var parts = property.split('.'),
			part = parts.pop();
		object = getDottedProperty(object, parts, true);

		return object && part ? object[part] = value : undefined;
	};

	/**
	 * Get a property from a dot-separated string such as "A.B.C"
	 *
	 * @param {Object} object
	 * Object to use as the root of the "path"
	 * @param {string} property
	 * Path to a property in the form "A.B.C"
	 * @returns {?}
	 */
	exports.getProperty = function getProperty(object, property) {
		if (!object) {
			return;
		}
		return getDottedProperty(object, property.split('.'));
	};

	/**
	 * For every enumerable property in an object, invoke a callback.
	 *
	 * @param {Object} object
	 * The object to iterate over
	 * @param {function(?, string, Object)} callback
	 * The function to be invoked for each property
	 * @param {Object=} thisObject
	 * An object to be used as `this` when `callback` is invoked
	 */
	exports.forIn = function forIn(object, callback, thisObject) {
		for (var key in object) {
			callback.call(thisObject, object[key], key, object);
		}
	};

	/**
	 * For every own enumerable property in an object, invoke a callback.
	 *
	 * @param {Object} object
	 * The object to iterate over
	 * @param {function(?, string, Object)} callback
	 * The function to be invoked for each property
	 * @param {Object=} thisObject
	 * An object to be used as `this` when `callback` is invoked
	 */
	exports.forOwn = function forOwn(object, callback, thisObject) {
		for (var key in object) {
			if (ownProperty.call(object, key)) {
				callback.call(thisObject, object[key], key, object);
			}
		}
	};

	/**
	 * Return a function bound to a specific context (this). Supports late binding.
	 *
	 * @param {Object} object
	 * The object to which to bind the context. May be null except for late binding.
	 * @param {(function()|string)} method
	 * A function or method name to bind a context to. If a string is passed, the look-up
	 * will not happen until the bound function is invoked (late-binding).
	 * @param {...?} var_args
	 * Arguments to pass to the bound function.
	 * @returns {function()}
	 */
	exports.bind = function bind(object, method) {
		var args = slice.call(arguments, 2);
		if (typeof method === 'string') {
			return function boundMethod() {
				return object[method].apply(object, args.concat(slice.call(arguments)));
			};
		}
		return method.bind.apply(method, [object].concat(args));
	};

	/**
	 * @param {function()} func
	 * Function
	 *
	 * @param {...?} var_args
	 * Arguments to apply to the passed function
	 *
	 * @returns {function()}
	 */
	exports.partial = function partial(func) {
		var args = slice.call(arguments, 1);
		return function () {
			return func.apply(this, args.concat(slice.call(arguments)));
		};
	};
});