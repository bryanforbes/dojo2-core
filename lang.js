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
			if (typeof object !== 'object') {
				return undefined;
			}
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
	function _mixIn(destination, source, copyFunction) {
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

	_mixIn(lang, {
		/**
		 * Adds all properties of one or more sources to destination
		 *
		 * @param {Object} destination
		 * The object to which to add all properties
		 * @param {...Object} var_args
		 * One or more objects from which to copy all properties
		 * @returns {Object}
		 */
		mixIn: function (destination) {
			if (!destination) {
				destination = {};
			}
			for (var i = 1; i < arguments.length; i++) {
				_mixIn(destination, arguments[i]);
			}
			return destination;
		},

		/**
		 * Creates a new object with its prototype set to the first object
		 *
		 * @param {Object} object
		 * The object which will be set to the resulting object's prototype
		 * @param {Object} properties
		 * An object from which properties should be copied onto the resulting object
		 * @returns {Object}
		 */
		delegate: function (object, properties) {
			object = Object.create(object);
			_mixIn(object, properties);
			return object;
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
		 * Return a function that will be called with the passed arguments as its first arguments
		 *
		 * @param {function()} func
		 * Function
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
			else if (object instanceof Date) {
				returnValue = new object.constructor(object.getTime());
			}
			else if (object instanceof RegExp) {
				returnValue = new object.constructor(object);
			}
			else {
				if (Array.isArray(object)) {
					returnValue = [];
				}
				else {
					returnValue = object.constructor ? new object.constructor() : {};
				}

				_mixIn(returnValue, object, lang.clone);
			}

			return returnValue;
		},

		/**
		 * Does a deep copy of properties from one object to another. Object references
		 * are traversed rather than copied.
		 *
		 * @param {Object} target
		 * The object to which properties will be copied
		 * @param {Object} source
		 * The object from which properties will be copied
		 * @returns {Object}
		 */
		deepMixIn: function (target, source) {
			if (source && typeof source === 'object') {
				if (Array.isArray(source)) {
					target.length = source.length;
				}
				for (var name in source) {
					var targetValue = target[name],
						sourceValue = source[name];

					if (targetValue !== sourceValue) {
						if (sourceValue && typeof sourceValue === 'object') {
							if (!targetValue || typeof targetValue !== 'object') {
								target[name] = targetValue = {};
							}
							lang.deepMixIn(targetValue, sourceValue);
						}
						else {
							target[name] = sourceValue;
						}
					}
				}
			}
			return target;
		},

		/**
		 * Performs a deep delegation of an object. Object references are
		 * delegated and assigned to the new object. Properties can also
		 * be deeply copied onto the resulting object.
		 *
		 * @param {Object} origin
		 * The object to which the resulting object's prototype will be set
		 * @param {Object} properties
		 * The object from which properties will be copied onto the resulting object
		 * @returns {Object}
		 */
		deepDelegate: function (origin, properties) {
			var destination = lang.delegate(origin);
			properties = properties || null;

			for (var name in origin) {
				var value = origin[name];

				if (value && typeof value === 'object') {
					destination[name] = lang.deepDelegate(value);
				}
			}
			return lang.deepMixIn(destination, properties);
		}
	});
});