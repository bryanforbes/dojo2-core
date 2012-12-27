define(['exports', './dom'], function (exports, dom) {
	// module:
	//		dojo/dom-class

	// =============================
	// (CSS) Class Functions
	// =============================

	var spaces = /\s+/;

	// summary:
	//		This module defines the core dojo DOM class API.

	/**
	 * Determines if the specified classes are applied to the node.
	 *
	 * @param {(Element|string)} node
	 * ID or node reference to check
	 *
	 * @param {string} classStr
	 * A CSS class, space-separated classes, or an array of classes to check
	 */
	exports.contains = function contains(node, classStr) {
		// example:
		//		Do something if a node with id="someNode" has class="aSillyClassName" present
		//	|	if(dojo.hasClass('someNode','aSillyClassName')){ ... }

		node = dom.byId(node);
		classStr = classStr.trim();

		var nodeClasses = node.className.trim();

		// If classStr is a string and the classes passed in exist in the node
		// in the order passed in, this will match
		if ((' ' + nodeClasses + ' ').indexOf(' ' + classStr + ' ') > -1) {
			return true;
		}
		// If the previous test failed and there is only one class, it's a
		// genuine failure
		else if (!spaces.test(classStr)) {
			return false;
		}
		nodeClasses = nodeClasses.split(spaces);
		classStr = classStr.split(spaces);

		var map = {};
		for (var i = 0; i < nodeClasses.length; i++) {
			map[nodeClasses[i]] = true;
		}

		for (i = 0; i < classStr.length; i++) {
			if (!(classStr[i] in map)) {
				return false;
			}
		}
		return true;
	};

	/**
	 * Adds the specified classes to the end of the class list on the
	 * passed element. Will not re-apply duplicate classes.
	 *
	 * @param {(Element|string)} node
	 * ID of or reference to the element to add a class string
	 *
	 * @param {string} classStr
	 * A CSS class or space separated classes to add to the element
	 */
	exports.add = function add(/*DomNode|String*/ node, /*String|Array*/ classStr) {
		// example:
		//		Add a class to some node:
		//	|	require(['dojo/dom-class'], function(domClass){
		//	|		domClass.add('someNode', 'anewClass');
		//	|	});
		//
		// example:
		//		Add two classes at once:
		//	|	require(['dojo/dom-class'], function(domClass){
		//	|		domClass.add('someNode', 'firstClass secondClass');
		//	|	});
		//
		// example:
		//		Add two classes at once (using array):
		//	|	require(['dojo/dom-class'], function(domClass){
		//	|		domClass.add('someNode', ['firstClass', 'secondClass']);
		//	|	});
		//
		// example:
		//		Available in `dojo/NodeList` for multiple additions
		//	|	require(['dojo/query'], function(query){
		//	|		query('ul > li').addClass('firstLevel');
		//	|	});

		node = dom.byId(node);
		classStr = classStr.trim();
		var nodeClasses = node.className.trim();

		if (!nodeClasses) {
			node.className = classStr;
			return;
		}

		classStr = classStr.split(spaces);
		nodeClasses = ' ' + nodeClasses + ' ';

		var oldLength = nodeClasses.length,
			klass;
		for (var i = 0, l = classStr.length; i < l; i++) {
			klass = classStr[i];
			if (klass && nodeClasses.indexOf(' ' + klass + ' ') < 0) {
				nodeClasses += klass + ' ';
			}
		}
		if (oldLength < nodeClasses.length) {
			node.className = nodeClasses.substr(1, nodeClasses.length - 2);
		}
	};

	/**
	 * Removes the specified classes from an element.
	 *
	 * @param {(Element|string)} node
	 * ID of or reference to the node to remove classes from
	 *
	 * @param {?string=} classStr
	 * A CSS class or space separated classes to remove. If omitted, all
	 * class names will be removed.
	 */
	exports.remove = function remove(node, classStr) {
		// example:
		//		Remove a class from some node:
		//	|	require(['dojo/dom-class'], function(domClass){
		//	|		domClass.remove('someNode', 'firstClass');
		//	|	});
		//
		// example:
		//		Remove two classes from some node:
		//	|	require(['dojo/dom-class'], function(domClass){
		//	|		domClass.remove('someNode', 'firstClass secondClass');
		//	|	});
		//
		// example:
		//		Remove two classes from some node (using array):
		//	|	require(['dojo/dom-class'], function(domClass){
		//	|		domClass.remove('someNode', ['firstClass', 'secondClass']);
		//	|	});
		//
		// example:
		//		Remove all classes from some node:
		//	|	require(['dojo/dom-class'], function(domClass){
		//	|		domClass.remove('someNode');
		//	|	});
		//
		// example:
		//		Available in `dojo/NodeList` for multiple removal
		//	|	require(['dojo/query'], function(query){
		//	|		query('ul > li').removeClass('foo');
		//	|	});

		node = dom.byId(node);

		var nodeClasses = '';
		if (classStr != null) {
			classStr = classStr.split(spaces);
			nodeClasses = ' ' + node.className + ' ';
			for (var i = 0, l = classStr.length; i < l; i++) {
				nodeClasses = nodeClasses.replace(' ' + classStr[i] + ' ', ' ');
			}
			nodeClasses = nodeClasses.trim();
		}
		if (node.className !== nodeClasses) {
			node.className = nodeClasses;
		}
	};

	/**
	 * Replaces one or more classes ona node if not present. Operates more quickly than
	 * calling `remove` and `add`.
	 *
	 * @param {(Element|string)} node
	 * ID or node reference to remove the class from
	 *
	 * @param {(string|string[])} toRemove
	 * A CSS class, space-separated classes, or an array of class names to remove
	 *
	 * @param {(string|string[])} toAdd
	 * A CSS class, space-separated classes, or an array of class names to add
	 */
	exports.replace = function replace(node, toRemove, toAdd) {
		// example:
		//	|	require(['dojo/dom-class'], function(domClass){
		//	|		domClass.replace('someNode', 'add1 add2', 'remove1 remove2');
		//	|	});
		//
		// example:
		//	Replace all classes with addMe
		//	|	require(['dojo/dom-class'], function(domClass){
		//	|		domClass.replace('someNode', 'addMe');
		//	|	});
		//
		// example:
		//	Available in `dojo/NodeList` for multiple toggles
		//	|	require(['dojo/query'], function(query){
		//	|		query('.findMe').replaceClass('addMe', 'removeMe');
		//	|	});

		node = dom.byId(node);
		var fakeNode = {
			className: node.className
		};
		exports.remove(fakeNode, toRemove);
		exports.add(fakeNode, toAdd);
		if (node.className !== fakeNode.className) {
			node.className = fakeNode.className;
		}
	};

	/**
	 * Adds a class to an element if the class is not present or removes the
	 * class if the class is present.
	 *
	 * @param {(Element|string)} node
	 * ID of or reference to the element on which to toggle a class
	 *
	 * @param {string} classStr
	 * A CSS class or space separated classes to toggle
	 *
	 * @param {boolean=} condition
	 * An optional condition to force addition (true) or removal (false) of
	 * the classes
	 */
	exports.toggle = function toggle(node, classStr, condition) {
		// example:
		//	|	require(['dojo/dom-class'], function(domClass){
		//	|		domClass.toggle('someNode', 'hovered');
		//	|	});
		//
		// example:
		//		Forcefully add a class
		//	|	require(['dojo/dom-class'], function(domClass){
		//	|		domClass.toggle('someNode', 'hovered', true);
		//	|	});
		//
		// example:
		//		Available in `dojo/NodeList` for multiple toggles
		//	|	require(['dojo/query'], function(query){
		//	|		query('.toggleMe').toggleClass('toggleMe');
		//	|	});

		node = dom.byId(node);
		if (condition === undefined) {
			classStr = classStr.trim().split(spaces);
			var klass;
			for (var i = 0, l = classStr.length; i < l; i++) {
				klass = classStr[i];
				exports[exports.contains(node, klass) ? 'remove' : 'add'](node, klass);
			}
		}
		else {
			exports[condition ? 'add' : 'remove'](node, classStr);
		}
		return condition;   // Boolean
	};
});