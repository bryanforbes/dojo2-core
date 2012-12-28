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

	function _insertBefore(/*DomNode*/ node, /*DomNode*/ ref) {
		var parent = ref.parentNode;
		if (parent) {
			parent.insertBefore(node, ref);
		}
	}

	function _insertAfter(/*DomNode*/ node, /*DomNode*/ ref) {
		// summary:
		//		Try to insert node after ref
		var parent = ref.parentNode;
		if (parent) {
			if (parent.lastChild === ref) {
				parent.appendChild(node);
			}
			else {
				parent.insertBefore(node, ref.nextSibling);
			}
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
	 * Attempt to insert node into the DOM, choosing from various positioning options.
	 *
	 * @param {(Node|string)} node
	 * ID or node reference to place relative to refNode
	 *
	 * @param {(Node|string)} refNode
	 * ID or node reference to use as basis for placement
	 *
	 * @param {(string|number)=} position
	 * String noting the position of node relative to refNode or a
	 * number indicating the location in the childNodes collection of refNode.
	 * Accepted string values are "before", "after", "replace", "only", "first",
	 * and "last". Default is "last".
	 *
	 * @returns {Node}
	 * The first argument resolved to a DOM node.
	 */
	exports.place = function place(node, refNode, position) {
		// example:
		//		Place a node by string id as the last child of another node by string id:
		//	|	dojo.place("someNode", "anotherNode");
		// example:
		//		Place a node by string id before another node by string id
		//	|	dojo.place("someNode", "anotherNode", "before");
		// example:
		//		Create a Node, and place it in the body element (last child):
		//	|	dojo.place("<div></div>", dojo.body());
		// example:
		//		Put a new LI as the first child of a list by id:
		//	|	dojo.place("<li></li>", "someUl", "first");

		node = dom.byId(node);
		refNode = dom.byId(refNode);

		if (typeof position === 'number') {
			var childNodes = refNode.childNodes;
			if (!childNodes.length || childNodes.length <= position) {
				refNode.appendChild(node);
			}
			else {
				_insertBefore(node, childNodes[position < 0 ? 0 : position]);
			}
		}
		else {
			switch (position) {
			case 'before':
				_insertBefore(node, refNode);
				break;
			case 'after':
				_insertAfter(node, refNode);
				break;
			case 'replace':
				refNode.parentNode.replaceChild(node, refNode);
				break;
			case 'only':
				exports.empty(refNode);
				refNode.appendChild(node);
				break;
			case 'first':
				if (refNode.firstChild) {
					_insertBefore(node, refNode.firstChild);
					break;
				}
				// else fallthrough...
			default: // aka: last
				refNode.appendChild(node);
			}
		}
		return node; // DomNode
	};

	/**
	 * Create an element, allowing for optional attribute decoration and placement.
	 *
	 * @param {string} tag
	 * @param {Object=} attrs
	 * @param {(Element|string)=} refNode
	 * @param {string=} pos
	 */
	exports.create = function create(tag, attrs, refNode, pos) {
		// summary:
		//		Create an element, allowing for optional attribute decoration
		//		and placement.
		// description:
		//		A DOM Element creation function. A shorthand method for creating a node or
		//		a fragment, and allowing for a convenient optional attribute setting step,
		//		as well as an optional DOM placement reference.
		//
		//		Attributes are set by passing the optional object through `dojo.setAttr`.
		//		See `dojo.setAttr` for noted caveats and nuances, and API if applicable.
		//
		//		Placement is done via `dojo.place`, assuming the new node to be the action
		//		node, passing along the optional reference node and position.
		// tag: DOMNode|String
		//		A string of the element to create (eg: "div", "a", "p", "li", "script", "br"),
		//		or an existing DOM node to process.
		// attrs: Object
		//		An object-hash of attributes to set on the newly created node.
		//		Can be null, if you don't want to set any attributes/styles.
		//		See: `dojo.setAttr` for a description of available attributes.
		// refNode: DOMNode|String?
		//		Optional reference node. Used by `dojo.place` to place the newly created
		//		node somewhere in the dom relative to refNode. Can be a DomNode reference
		//		or String ID of a node.
		// pos: String?
		//		Optional positional reference. Defaults to "last" by way of `dojo.place`,
		//		though can be set to "first","after","before","last", "replace" or "only"
		//		to further control the placement of the new node relative to the refNode.
		//		'refNode' is required if a 'pos' is specified.
		// example:
		//		Create a DIV:
		//	|	var n = dojo.create('div');
		//
		// example:
		//		Create a DIV with content:
		//	|	var n = dojo.create('div', { innerHTML:'<p>hi</p>' });
		//
		// example:
		//		Place a new DIV in the BODY, with no attributes set
		//	|	var n = dojo.create('div', null, dojo.body());
		//
		// example:
		//		Create an UL, and populate it with LI's. Place the list as the first-child of a
		//		node with id='someId':
		//	|	var ul = dojo.create('ul', null, 'someId', 'first');
		//	|	var items = ['one', 'two', 'three', 'four'];
		//	|	dojo.forEach(items, function(data){
		//	|		dojo.create('li', { innerHTML: data }, ul);
		//	|	});
		//
		// example:
		//		Create an anchor, with an href. Place in BODY:
		//	|	dojo.create('a', { href:'foo.html', title:'Goto FOO!' }, dojo.body());
		//
		// example:
		//		Create a `dojo/NodeList()` from a new element (for syntactic sugar):
		//	|	dojo.query(dojo.create('div'))
		//	|		.addClass('newDiv')
		//	|		.onclick(function(e){ console.log('clicked', e.target) })
		//	|		.place('#someNode'); // redundant, but cleaner.

		var doc = document;
		if (refNode) {
			refNode = dom.byId(refNode);
			doc = refNode.ownerDocument;
		}
		if (typeof tag === 'string') { // inline'd type check
			tag = doc.createElement(tag);
		}
		// TODO: Figure out how we want to do attribute/property assignment
		/*if (attrs) {
			attr.set(tag, attrs);
		}*/
		if (refNode) {
			exports.place(tag, refNode, pos);
		}
		return tag; // DomNode
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