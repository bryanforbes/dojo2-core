define([
	'module',
	'exports',
	'./sniff',
	'../dom'
], function (module, exports, has, dom) {
	// module:
	//		dojo/dom-construct
	// summary:
	//		This module defines the core dojo DOM construction API.

	// TODOC: summary not showing up in output, see https://github.com/csnover/js-doc-parse/issues/42

	// support stuff for toDom()
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
	 * @param {string} fragment
	 * The HTML fragment
	 *
	 * @param {Document=} targetDocument
	 * Document to use when creating elements. Defaults to the document global.
	 *
	 * @returns {(Element|DocumentFragment)}
	 * If the fragment is a single node, it is returned. Otherwise, a DocumentFragment is returned.
	 */
	exports.toDom = function toDom(fragment, targetDocument) {
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
		fragment += '';

		// find the starting tag, and get node wrapper
		var match = fragment.match(reTag),
			tag = match ? match[1].toLowerCase() : '',
			master = masterNodes[masterId],
			wrap, i, fc, df;
		if (match && tagWrap[tag]) {
			wrap = tagWrap[tag];
			master.innerHTML = wrap.pre + fragment + wrap.post;
			for (i = wrap.length; i; --i) {
				master = master.firstChild;
			}
		}
		else {
			master.innerHTML = fragment;
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

	/**
	 * Insert a node into the DOM at the specified index of the parent node.
	 *
	 * @param {(Node|string)} node
	 * ID or node reference to insert as a child
	 *
	 * @param {number} position
	 * Index to insert node into parent
	 *
	 * @param {(Node|string)} parentNode
	 * ID or node reference to insert child into
	 *
	 * @returns {Node}
	 * The first argument resolved to an Element
	 */
	exports.insertAtIndex = function insertAtIndex(node, index, parentNode) {
		node = dom.byId(node);
		parentNode = dom.byId(parentNode);

		var childNodes = parentNode.childNodes;
		if (index < 0) {
			index = Math.abs(index);
			if (index >= childNodes.length) {
				index = 0;
			} else {
				index = childNodes.length - index;
			}
		}
		if (childNodes.length && index < childNodes.length) {
			parentNode.insertBefore(node, childNodes[index < 0 ? 0 : index]);
		} else {
			parentNode.appendChild(node);
		}

		return node;
	};

	/**
	 * Insert a node into the DOM before another node.
	 *
	 * @param {(Node|string)} node
	 * ID or node reference to insert
	 *
	 * @param {(Node|string)} referenceNode
	 * ID or node reference to insert the node before
	 *
	 * @returns {Node}
	 * The first argument resolved to an Element
	 */
	exports.insertBefore = function insertBefore(node, referenceNode) {
		node = dom.byId(node);
		referenceNode = dom.byId(referenceNode);

		var parent = referenceNode.parentNode;

		parent.insertBefore(node, referenceNode);

		return node;
	};

	/**
	 * Insert a node into the DOM after another node.
	 *
	 * @param {(Node|string)} node
	 * ID or node reference to insert
	 *
	 * @param {(Node|string)} referenceNode
	 * ID or node reference to insert the node after
	 *
	 * @returns {Node}
	 * The first argument resolved to an Element
	 */
	exports.insertAfter = function insertAfter(node, referenceNode) {
		node = dom.byId(node);
		referenceNode = dom.byId(referenceNode);

		var parent = referenceNode.parentNode;

		if (parent.lastChild !== referenceNode) {
			parent.insertBefore(node, referenceNode.nextSibling);
		} else {
			parent.appendChild(node);
		}

		return node;
	};

	/**
	 * Insert a node into the DOM as the first child of a parent.
	 *
	 * @param {(Node|string)} node
	 * ID or node reference to insert
	 *
	 * @param {(Node|string)} parentNode
	 * ID or node reference to insert the node as the first child
	 *
	 * @returns {Node}
	 * The first argument resolved to an Element
	 */
	exports.insertFirst = function insertFirst(node, parentNode) {
		node = dom.byId(node);
		parentNode = dom.byId(parentNode);

		if (parentNode.firstChild) {
			parentNode.insertBefore(node, parentNode.firstChild);
		} else {
			parentNode.appendChild(node);
		}

		return node;
	};

	/**
	 * Insert a node into the DOM as the last child of a parent.
	 *
	 * @param {(Node|string)} node
	 * ID or node reference to insert
	 *
	 * @param {(Node|string)} parentNode
	 * ID or node reference to insert the node as the last child
	 *
	 * @returns {Node}
	 * The first argument resolved to an Element
	 */
	exports.insertLast = function insertLast(node, parentNode) {
		node = dom.byId(node);
		parentNode = dom.byId(parentNode);

		parentNode.appendChild(node);

		return node;
	};

	/**
	 * Replace a node in the DOM with another.
	 *
	 * @param {(Node|string)} node
	 * ID or node reference to insert
	 *
	 * @param {(Node|string)} referenceNode
	 * ID or node reference to remove
	 *
	 * @returns {Node}
	 * The first argument resolved to an Element
	 */
	exports.replace = function replace(node, referenceNode) {
		node = dom.byId(node);
		referenceNode = dom.byId(referenceNode);

		var parent = referenceNode.parentNode;

		parent.replaceChild(node, referenceNode);

		return node;
	};

	/**
	 * Replace all children of a node with one node.
	 *
	 * @param {(Node|string)} node
	 * ID or node reference to insert
	 *
	 * @param {(Node|string)} parentNode
	 * ID or node reference to have its children removed and node inserted into
	 *
	 * @returns {Node}
	 * The first argument resolved to an Element
	 */
	exports.replaceAll = function replaceAll(node, parentNode) {
		node = dom.byId(node);
		parentNode = dom.byId(parentNode);

		exports.empty(parentNode);
		parentNode.appendChild(node);

		return node;
	};

	/**
	 * Create an element, allowing for optional attribute decoration.
	 *
	 * @param {string} tag
	 * @param {Object=} attrs
	 * @param {Document=} targetDocument
	 */
	exports.create = function (tag, props, targetDocument) {
		targetDocument = targetDocument || document;

		var node = targetDocument.createElement(tag);

		if (props) {
			// TODO: figure out property setting
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
		 //		Destroy node's children byId:
		 //	|	dojo.empty('someId');
		 //
		 // example:
		 //		Destroy all nodes' children in a list by reference:
		 //	|	dojo.query('.someNode').forEach(dojo.empty);

		node = dom.byId(node);
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
		//		Destroy a node byId:
		//	|	dojo.destroy('someId');
		//
		// example:
		//		Destroy all nodes in a list by reference:
		//	|	dojo.query('.someNode').forEach(dojo.destroy);

		node = dom.byId(node);
		if (!node) {
			return;
		}
		_destroy(node, node.parentNode);
	};
});