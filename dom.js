define(['exports', './has'], function (exports, has) {
	// module:
	//		dojo/dom

	// FIXME: need to add unit tests for all the semi-public methods

	has.add('bug-getelementbyid', function (global, document) {
		var id = '__test_' + (+new Date()),
			root = document.head || document.documentElement,
			element,
			buggy;

		element = document.createElement('input');
		element.name = id;

		try {
			root.insertBefore(element, root.firstChild);
			buggy = document.getElementById(id) === element;
		} catch (e) {}
		finally {
			root.removeChild(element);
		}

		if (!buggy) {
			element = document.createElement('div');
			element.id = id;
			try {
				root.insertBefore(element, root.firstChild);
				buggy = document.getElementById(id.toUpperCase()) === element;
			} catch (e) {}
			finally {
				root.removeChild(element);
			}
		}

		return buggy;
	});

	// =============================
	// DOM Functions
	// =============================

	if (has('bug-getelementbyid')) {
		exports.byId = function byId(id, targetDocument) {
			if (typeof id !== 'string') {
				return id;
			}
			var doc = targetDocument || document,
				element = id && doc.getElementById(id);

			// attributes.id.value is better than just id in case the
			// user has a name=id inside a form
			if (element && (element.attributes.id.value === id || element.id === id)) {
				return element;
			}
			else {
				var elements = doc.all[id];
				if (!elements || elements.nodeName) {
					elements = [elements];
				}
				// if more than 1, choose first with the correct id
				var i = 0;
				while ((element = elements[i++])) {
					if ((element.attributes && element.attributes.id && element.attributes.id.value === id) ||
						element.id === id) {
						return element;
					}
				}
			}
		};
	}
	else {
		/**
		 * Retrieves a DOM node corresponding to `id`.
		 *
		 * @param {(string|Node)} id
		 * The string ID to match an HTML ID against or a reference to a DOM node. If `id`
		 * is a Node, it is immediately returned.
		 *
		 * @param {Document=} targetDocument
		 * Document to search in. Defaults to the `document` global.
		 *
		 * @returns {?Element}
		 *
		 * @example
		 * // Look up a node by ID:
		 * var n = dom.byId("foo");
		 *
		 * @example
		 * // Check if a node exists, and use it
		 * var n = dom.byId("bar");
		 * if (n) {
		 *     doStuff();
		 * }
		 *
		 * @example
		 * // Allow string or Node references to be passed to a custom function:
		 * var foo = function(nodeOrId){
		 *     nodeOrId = dom.byId(nodeOrId);
		 *     ...
		 * };
		 */
		exports.byId = function byId(id, targetDocument) {
			if (typeof id !== 'string') {
				return id;
			}
			return (targetDocument || document).getElementById(id);
		};
	}

	has.add('bug-contains', function (global, document, element) {
		var buggy,
			element2 = document.createElement('div');

		if (typeof element.contains !== 'function') {
			buggy = element.contains(element2);
		}
		return buggy;
	});
	
	/**
	 * Determines if an ancestor contains another node.
	 *
	 * @param {string,node} ancestor
	 * The ancestor to check
	 *
	 * @param {string,node} node
	 * The node that might be a child of the ancestor
	 *
	 * @returns {boolean}
	 **/
	exports.contains = has('bug-contains') ?
		function contains(ancestor, node) {
			try {
				ancestor = exports.byId(ancestor);
				node = exports.byId(node);

				do {
					if (node === ancestor) {
						return true;
					}
				} while ((node = node.parentNode));
			}catch (e) {}
			return false;
		} :
		function contains(ancestor, node) {
			return ancestor.contains(node);
		};

	// TODO: do we need setSelectable in the base?

	// Add feature test for user-select CSS property
	// (currently known to work in all but IE < 10 and Opera)
	has.add('css-user-select', function (global, doc, element) {
		// Avoid exception when dom.js is loaded in non-browser environments
		if (!element) {
			return false;
		}
		
		var style = element.style;
		var prefixes = ['Khtml', 'O', 'ms', 'Moz', 'Webkit'],
			i = prefixes.length,
			name = 'userSelect';

		// Iterate prefixes from most to least likely
		do {
			if (typeof style[name] !== 'undefined') {
				// Supported; return property name
				return name;
			}
		} while (i-- && (name = prefixes[i] + 'UserSelect'));

		// Not supported if we didn't return before now
		return false;
	});

	/*=====
	dom.setSelectable = function(node, selectable){
		// summary:
		//		Enable or disable selection on a node
		// node: DOMNode|String
		//		id or reference to node
		// selectable: Boolean
		//		state to put the node in. false indicates unselectable, true
		//		allows selection.
		// example:
		//		Make the node id="bar" unselectable
		//	|	dojo.setSelectable("bar");
		// example:
		//		Make the node id="bar" selectable
		//	|	dojo.setSelectable("bar", true);
	};
	=====*/

	var cssUserSelect = has('css-user-select');
	exports.setSelectable = cssUserSelect ? function (node, selectable) {
		// css-user-select returns a (possibly vendor-prefixed) CSS property name
		exports.byId(node).style[cssUserSelect] = selectable ? '' : 'none';
	} : function (node, selectable) {
		node = exports.byId(node);

		// (IE < 10 / Opera) Fall back to setting/removing the
		// unselectable attribute on the element and all its children
		var nodes = node.getElementsByTagName('*'),
			i = nodes.length;

		if (selectable) {
			node.removeAttribute('unselectable');
			while (i--) {
				nodes[i].removeAttribute('unselectable');
			}
		}
		else {
			node.setAttribute('unselectable', 'on');
			while (i--) {
				nodes[i].setAttribute('unselectable', 'on');
			}
		}
	};
});
