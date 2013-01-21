define([
	'exports',
	'module',
	'./has'
], function (exports, module, has) {
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
		exports.get = function get(id, targetDocument) {
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
		 * @param {(string|Element)} id
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
		 * var n = dom.get("foo");
		 *
		 * @example
		 * // Check if a node exists, and use it
		 * var n = dom.get("bar");
		 * if (n) {
		 *     doStuff();
		 * }
		 *
		 * @example
		 * // Allow string or Node references to be passed to a custom function:
		 * var foo = function(nodeOrId){
		 *     nodeOrId = dom.get(nodeOrId);
		 *     ...
		 * };
		 */
		exports.get = function get(id, targetDocument) {
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
				ancestor = exports.get(ancestor);
				node = exports.get(node);

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
		exports.get(node).style[cssUserSelect] = selectable ? '' : 'none';
	} : function (node, selectable) {
		node = exports.get(node);

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

	exports.insert = function insert(node, position, referenceNode) {
		node = exports.get(node);

		if (!referenceNode) {
			referenceNode = exports.get(position);
			position = 'last';
		}

		var parentNode;
		if (typeof position === 'number') {
			var childNodes = referenceNode.childNodes;
			if (position < 0) {
				position = Math.abs(position);
				if (position >= childNodes.length) {
					position = 0;
				}
				else {
					position = childNodes.length - position;
				}
			}
			parentNode = referenceNode;
			referenceNode = childNodes[position] || null;
			position = 'before';
		}
		else {
			parentNode = referenceNode.parentNode;
		}
		if (position === 'after') {
			parentNode.insertBefore(node, referenceNode.nextSibling);
		}
		else if (position === 'before') {
			parentNode.insertBefore(node, referenceNode);
		}
		else if (position === 'first') {
			referenceNode.insertBefore(node, referenceNode.firstChild);
		}
		else if (position === 'replace') {
			parentNode.replaceChild(node, referenceNode);
		}
		else {
			referenceNode.appendChild(node);
		}

		return node;
	};

	// Support for fromString
	var tagWrap = {
			option: ['select'],
			tbody: ['table'],
			thead: ['table'],
			tfoot: ['table'],
			tr: ['table', 'tbody'],
			td: ['table', 'tbody', 'tr'],
			th: ['table', 'thead', 'tr'],
			legend: ['fieldset'],
			caption: ['table'],
			colgroup: ['table'],
			col: ['table', 'colgroup'],
			li: ['ul']
		},
		reTag = /<\s*([\w\:]+)/,
		masterNodes = {}, masterNum = 0,
		masterName = '__' + module.id.replace(/\//g, '_') + 'ToDomId';

	// generate start/end tag strings to use
	// for the injection for each special tag wrap case.
	for (var param in tagWrap) {
		if (tagWrap.hasOwnProperty(param)) {
			var tw = tagWrap[param];
			tw.pre = param === 'option' ? '<select multiple="multiple">' : '<' + tw.join('><') + '>';
			tw.post = '</' + tw.reverse().join('></') + '>';
			// the last line is destructive: it reverses the array,
			// but we don't care at this point
		}
	}

	/**
	 * Creates an Element or DocumentFragment from an HTML fragment.
	 *
	 * @param {string} string
	 * The string containing the HTML fragment
	 *
	 * @param {Document=} targetDocument
	 * Document to use when creating elements. Defaults to the document global.
	 *
	 * @returns {(Element|DocumentFragment)}
	 * If the fragment is a single node, it is returned. Otherwise, a DocumentFragment is returned.
	 */
	exports.fromString = function fromString(string, targetDocument) {
		// example:
		//		Create a table row:
		//	|	var tr = dojo.toDom('<tr><td>First!</td></tr>');

		targetDocument = targetDocument || document;
		var masterId = targetDocument[masterName];
		if (!masterId) {
			targetDocument[masterName] = masterId = ++masterNum + '';
			masterNodes[masterId] = targetDocument.createElement('div');
		}

		// make sure the frag is a string.
		string += '';

		// find the starting tag, and get node wrapper
		var match = string.match(reTag),
			tag = match ? match[1].toLowerCase() : '',
			master = masterNodes[masterId],
			wrap, i, fc, df;
		if (match && tagWrap[tag]) {
			wrap = tagWrap[tag];
			master.innerHTML = wrap.pre + string + wrap.post;
			for (i = wrap.length; i; --i) {
				master = master.firstChild;
			}
		}
		else {
			master.innerHTML = string;
		}

		// one node shortcut => return the node itself
		if (master.childNodes.length === 1) {
			return master.removeChild(master.firstChild); // DOMNode
		}

		// return multiple nodes as a document fragment
		df = targetDocument.createDocumentFragment();
		while ((fc = master.firstChild)) { // intentional assignment
			df.appendChild(fc);
		}
		return df; // DocumentFragment
	};

	var propertyNames = {
		'class': 'className',
		'for': 'htmlFor',
		tabindex: 'tabIndex',
		readonly: 'readOnly',
		frameborder: 'frameBorder',
		colspan: 'colSpan',
		rowspan: 'rowSpan',
		valuetype: 'valueType'
	};

	exports.setProperty = function setProperty(node, name, value) {
		node = exports.get(node);

		if (typeof name === 'object' && name) {
			var properties = name;
			for (name in properties) {
				exports.setProperty(node, propertyNames[name] || name, properties[name]);
			}
		}
		else {
			if (name === 'innerText') {
				var textNode = node.ownerDocument.createTextNode(value);
				node.appendChild(textNode);
			}
			else {
				node[propertyNames[name] || name] = value;
			}
		}
	};

	exports.getProperty = function getProperty(node, name) {
		node = exports.get(node);

		return node[propertyNames[name] || name];
	};

	/**
	 * Create an element, allowing for optional attribute decoration and placement.
	 *
	 * @param {string} tag
	 * @param {Object=} props
	 * @param {string=} position
	 * @param {(Document|Element|DocumentFragment)=} referenceNode
	 */
	exports.create = function create(tag, props, position, referenceNode) {
		if (!referenceNode) {
			referenceNode = position;
			position = 'last';
		}
		var targetDocument = document;
		if (referenceNode) {
			targetDocument = referenceNode.nodeType === 9 ? referenceNode : referenceNode.ownerDocument;
		}

		var node = targetDocument.createElement(tag);

		// TODO: property/attribute setting
		/*if (props) {
			exports.setProperty(node, props);
		}*/

		if (referenceNode) {
			exports.insert(node, position, referenceNode);
		}

		return node;
	};

	function _empty(node) {
		try {
			node.innerHTML = '';
		}
		catch (e) {} // IE can generate Unknown Error
		if (node.childNodes.length) {
			// DocumentFragments and elements that throw will still
			// have child nodes
			var child;
			while ((child = node.lastChild)) {
				// use _destroy so table elements will be removed in
				// the proper order
				_destroy(child, node);
			}
		}
	}

	function _destroy(node, parent) {
		if (node.firstChild) {
			_empty(node);
		}
		if (parent) {
			parent.removeChild(node);
		}
	}

	/**
	 * Removes all children of an element.
	 *
	 * @param {(Element|string)} node
	 * ID or node reference of the element to empty.
	 */
	exports.empty = function empty(/*DOMNode|String*/ node) {
		 // example:
		 //		Destroy node's children using its ID:
		 //	|	dojo.empty('someId');
		 //
		 // example:
		 //		Destroy all nodes' children in a list by reference:
		 //	|	dojo.query('.someNode').forEach(dojo.empty);

		node = exports.get(node);
		if (!node) {
			return;
		}
		_empty(node);
	};


	/**
	 * Removes a node from its parent, destroying it and all of its children
	 *
	 * @param {(Element|string)} node
	 * ID or node references of the element to be destroyed
	 */
	exports.destroy = function destroy(/*DOMNode|String*/ node) {
		// example:
		//		Destroy a node using its ID:
		//	|	dojo.destroy('someId');
		//
		// example:
		//		Destroy all nodes in a list by reference:
		//	|	dojo.query('.someNode').forEach(dojo.destroy);

		node = exports.get(node);
		if (!node) {
			return;
		}
		_destroy(node, node.parentNode);
	};
});