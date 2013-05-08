define([
	'exports'
], function (lang) {
	// module:
	//		dojo/lang

	var slice = Array.prototype.slice;

	function getDottedProperty(object, parts, create) {
		var key,
			i = 0;

		while (object && (key = parts[i++])) {
			object = key in object ? object[key] : (create ? object[key] = {} : undefined);
		}

		return object;
	}

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
	function mixinOne(destination, source, copyFunction) {
		for (var name in source) {
			var sourceValue = source[name];
			if (name in destination && destination[name] === sourceValue) {
				// skip properties that destination already has
				continue;
			}
			destination[name] = copyFunction ? copyFunction(sourceValue) : sourceValue;
		}

		return destination;
	}

	mixinOne(lang, {
		/**
		 * Adds all properties of one or more sources to destination
		 *
		 * @param {Object} destination
		 * The object to which to add all properties
		 * @param {...Object} var_args
		 * One or more objects from which to copy all properties
		 * @returns {Object}
		 */
		mixin: function (destination) {
			if (!destination) {
				destination = {};
			}
			for (var i = 1; i < arguments.length; i++) {
				lang.mixinOne(destination, arguments[i]);
			}
			return destination;
		},

		mixinOne: mixinOne,

		delegate: function (dest, src) {
			// TODO: Eliminate this dependency
			dest = Object.create(dest);
			lang.mixinOne(dest, src);
			return dest;
		},

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
		setProperty: function (object, propertyName, value) {
			var parts = propertyName.split('.'),
				part = parts.pop(),
				property = getDottedProperty(object, parts, true);

			if (property && part) {
				property[part] = value;
				return value;
			}
		},

		/**
		 * Get a property from a dot-separated string such as "A.B.C"
		 *
		 * @param {Object} object
		 * Object to use as the root of the "path"
		 * @param {string} property
		 * Path to a property in the form "A.B.C"
		 * @returns {?}
		 */
		getProperty: function (object, propertyName, create) {
			return getDottedProperty(object, propertyName.split('.'), create); // Object
		},

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
		bind: function (context, method) {
			var extra = slice.call(arguments, 2);
			if (typeof method === 'string') {
				// late binding
				return function () {
					return context[method].apply(context, extra.concat(slice.call(arguments)));
				};
			}
			return method.bind.apply(method, [context].concat(extra));
		},

		/**
		 * @param {function()} func
		 * Function
		 *
		 * @param {...?} var_args
		 * Arguments to apply to the passed function
		 *
		 * @returns {function()}
		 */
		partial: function (func) {
			var extra = slice.call(arguments, 1);
			return function () {
				return func.apply(this, extra.concat(slice.call(arguments)));
			};
		},

		/**
		 * Performs a deep clone of objects and their children.
		 * Supports Array, RegExp, Date, Node (DOM), Object, and objects with constructors.
		 * Does not clone functions. Does not correctly handle cyclic structures.
		 */
		clone: function (object) {
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

				lang.mixinOne(returnValue, object, lang.clone);
			}

			return returnValue;
		}
	});
});