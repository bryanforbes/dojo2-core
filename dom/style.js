define([
	'exports',
	'./has',
	'./dom'
], function (exports, has, dom) {
	has.add('css-float', function (global, document, element) {
		return typeof element.style.cssFloat === 'string';
	});
	has.add('bug-min-width-computed', function (global, document) {
		// Chrome currently does not compute min/max-width/height like
		// it should; this test determines if it is buggy
		var container = document.createElement('div'),
			child = document.createElement('div'),
			buggy = false;

		container.appendChild(child);
		container.style.position = 'absolute';
		container.style.top = container.style.left = '-1000px';
		container.style.width = container.style.height = '200px';
		child.style.minWidth = '10%';

		document.body.appendChild(container);

		buggy = document.defaultView.getComputedStyle(child, null).minWidth !== '20px';

		document.body.removeChild(container);

		return buggy;
	});

	var floatName = has('css-float') ? 'cssFloat' : 'styleFloat',
		floatAliases = {
			cssFloat: floatName,
			styleFloat: floatName,
			'float': floatName
		};

	var usedValueProperties = {},
		pixelPropertyNames = [
			'left', 'top', 'right', 'bottom', 'textIndent', 'height', 'width'
		];

	if (!has('bug-min-width-computed')) {
		pixelPropertyNames.push('minWidth', 'minHeight', 'maxWidth', 'maxHeight');
	}
	pixelPropertyNames.forEach(function (property) {
		usedValueProperties[property] = true;
	});
	['margin', 'padding'].forEach(function (prefix) {
		['Left', 'Top', 'Right', 'Bottom'].forEach(function (suffix) {
			usedValueProperties[prefix + suffix] = true;
		});
	});

	exports._getComputedStyle = function getComputedStyle(node) {
		return node.nodeType === 1 /* ELEMENT_NODE*/ ?
			node.ownerDocument.defaultView.getComputedStyle(node, null) : {};
	};

	/**
	 * Accesses styles on a node
	 *
	 * @param {(string|Element)} node
	 * @param {string=} name
	 * @returns {(Object|string|number)}
	 */
	exports.get = function get(node, name) {
		node = dom.get(node);

		var style = exports._getComputedStyle(node);

		if (!name) {
			return style;
		}

		if (!(name in usedValueProperties)) {
			return style[name];
		}
		return parseFloat(style[name]) || 0;
	};

	/**
	 * Sets styles on a node
	 *
	 * @param {(string|Element)} node
	 * @param {(string|Object)} name
	 * @param {string=} value
	 * @returns {(Object|string)}
	 */
	exports.set = function set(node, name, value) {
		node = dom.get(node);

		if (typeof name === 'string') {
			name = floatAliases[name];
			return node.style[name] = value;
		}

		for (var key in name) {
			var aliasedKey = floatAliases[key] || key;
			node.style[aliasedKey] = name[key];
		}

		return exports._getComputedStyle(node);
	};
});