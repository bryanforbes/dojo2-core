define([
	'exports',
	'../has',
	'../dom',
	'./style'
], function (exports, has, dom, domStyle) {
	// module:
	//		dojo/dom-geometry

	var cssPrefixes = ['ms', 'O', 'Moz', 'Webkit'];
	has.add('css-box-sizing', function (global, document, element) {
		var style = element.style,
			i;

		if (style.boxSizing !== undefined) {
			return 'boxSizing';
		}

		for (i = cssPrefixes.length; i--;) {
			if (style[cssPrefixes[i] + 'BoxSizing'] !== undefined) {
				return cssPrefixes[i];
			}
		}

		return false;
	});

	var boxSizingProperty = has('css-box-sizing');

	function toPixelValue(value) {
		return parseFloat(value) || 0;
	}

	exports.getMargins = function getMargins(node, computedStyle) {
		node = dom.get(node);
		computedStyle = computedStyle || domStyle._getComputedStyle(node);

		var left = toPixelValue(computedStyle.marginLeft),
			top = toPixelValue(computedStyle.marginTop),
			right = toPixelValue(computedStyle.marginRight),
			bottom = toPixelValue(computedStyle.marginBottom);

		return {
			left: left,
			top: top,
			right: right,
			bottom: bottom,
			width: left + right,
			height: top + bottom
		};
	};

	exports.getPaddings = function getPaddings(node, computedStyle) {
		node = dom.get(node);
		computedStyle = computedStyle || domStyle._getComputedStyle(node);

		var left = toPixelValue(computedStyle.paddingLeft),
			top = toPixelValue(computedStyle.paddingTop),
			right = toPixelValue(computedStyle.paddingRight),
			bottom = toPixelValue(computedStyle.paddingBottom);

		return {
			left: left,
			top: top,
			right: right,
			bottom: bottom,
			width: left + right,
			height: top + bottom
		};
	};

	exports.getBorders = function getBorders(node, computedStyle) {
		node = dom.get(node);
		computedStyle = computedStyle || domStyle._getComputedStyle(node);

		var left = computedStyle.borderLeftStyle !== 'none' ? toPixelValue(computedStyle.borderLeftWidth) : 0,
			top = computedStyle.borderTopStyle !== 'none' ? toPixelValue(computedStyle.borderTopWidth) : 0,
			right = computedStyle.borderRightStyle !== 'none' ? toPixelValue(computedStyle.borderRightWidth) : 0,
			bottom = computedStyle.borderBottomStyle !== 'none' ? toPixelValue(computedStyle.borderBottomWidth) : 0;

		return {
			left: left,
			top: top,
			right: right,
			bottom: bottom,
			width: left + right,
			height: top + bottom
		};
	};

	exports.getMarginBox = function getMarginBox(node, computedStyle) {
		node = dom.get(node);
		computedStyle = computedStyle || domStyle._getComputedStyle(node);

		var margins = exports.getMargins(node, computedStyle),
			left,
			top;

		// TODO: calculate left and top

		return {
			left: left,
			top: top,
			width: node.offsetWidth + margins.width,
			height: node.offsetHeight + margins.height
		};
	};

	exports.setMarginBox = function setMarginBox(node, box, computedStyle) {
		node = dom.get(node);
		computedStyle = computedStyle || domStyle._getComputedStyle(node);

		var width = box.width,
			height = box.height,
			margins = exports.getMargins(node, computedStyle);

		if (computedStyle[boxSizingProperty] === 'content-box') {
			var borders = exports.getBorders(node, computedStyle),
				paddings = exports.getPaddings(node, computedStyle);

			width -= borders.width + paddings.width;
			height -= borders.height + paddings.height;
		}

		width -= margins.width;
		height -= margins.height;

		width = width < 0 ? 0 : width;
		height = height < 0 ? 0 : height;

		var style = node.style;
		if (width >= 0) {
			style.width = width + 'px';
		}
		if (height >= 0) {
			style.height = height + 'px';
		}
		if (box.left >= 0) {
			style.left = box.left + 'px';
		}
		if (box.top >= 0) {
			style.top = box.top + 'px';
		}
	};

	exports.getContentBox = function getContentBox(node, computedStyle) {
		node = dom.get(node);
		computedStyle = computedStyle || domStyle._getComputedStyle(node);

		var paddings = exports.getPaddings(node, computedStyle),
			borders,
			width = node.clientWidth,
			height,
			left,
			top;

		// clientWidth/Height are important since the automatically account for scrollbars
		// fallback to offsetWidth/Height for special cases (see #3378)
		if (!width) {
			borders = exports.getBorders(node, computedStyle);
			width = node.offsetWidth - borders.width;
			height = node.offsetHeight - borders.width;
		} else {
			height = node.clientHeight;
		}

		// TODO: see if opera needs borders.left and borders.top added to
		// returned left and top

		return {
			left: paddings.left,
			top: paddings.top,
			width: width - paddings.width,
			height: height - paddings.height
		};
	};

	exports.setContentBox = function setContentBox(node, box, computedStyle) {
		node = dom.get(node);
		computedStyle = computedStyle || domStyle._getComputedStyle(node);

		var width = box.width,
			height = box.height;

		if (computedStyle[boxSizingProperty] === 'border-box') {
			var paddings = exports.getPaddings(node, computedStyle),
				borders = exports.getBorders(node, computedStyle);

			if (width >= 0) {
				width += paddings.width + borders.width;
			}
			if (height >= 0) {
				height += paddings.height + borders.height;
			}
		}
		if (width >= 0) {
			node.style.width = width + 'px';
		}
		if (height >= 0) {
			node.style.height = height + 'px';
		}
	};

	// We punt per-node box mode testing completely.
	// If anybody cares, we can provide an additional (optional) unit
	// that overrides existing code to include per-node box sensitivity.

	// Opera documentation claims that Opera 9 uses border-box in BackCompat mode.
	// but experiments (Opera 9.10.8679 on Windows Vista) indicate that it actually continues to use content-box.
	// IIRC, earlier versions of Opera did in fact use border-box.
	// Opera guys, this is really confusing. Opera being broken in quirks mode is not our fault.

	// =============================
	// Positioning
	// =============================

	exports.isBodyLtr = function isBodyLtr(/*Document?*/ doc) {
		// summary:
		//		Returns true if the current language is left-to-right, and false otherwise.
		// doc: Document?
		//		Optional document to query.   If unspecified, use win.doc.
		// returns: Boolean

		doc = doc || document;
		return (doc.body.dir || doc.documentElement.dir || 'ltr').toLowerCase() === 'ltr'; // Boolean
	};

	exports.docScroll = function docScroll(/*Document?*/ doc) {
		// summary:
		//		Returns an object with {node, x, y} with corresponding offsets.
		// doc: Document?
		//		Optional document to query.   If unspecified, use win.doc.
		// returns: Object

		doc = doc || document;
		var node = doc.parentWindow || doc.defaultView;   // use UI window, not dojo.global window.
		if ('pageXOffset' in node) {
			return {
				x: node.pageXOffset,
				y: node.pageYOffset
			};
		}
		node = doc.documentElement;
		return {
			x: node.scrollLeft || 0,
			y: node.scrollTop || 0
		};
	};

	exports.position = function(/*DomNode*/ node, /*Boolean?*/ includeScroll) {
		// summary:
		//		Gets the position and size of the passed element relative to
		//		the viewport (if includeScroll==false), or relative to the
		//		document root (if includeScroll==true).
		//
		// description:
		//		Returns an object of the form:
		//		`{ x: 100, y: 300, w: 20, h: 15 }`.
		//		If includeScroll==true, the x and y values will include any
		//		document offsets that may affect the position relative to the
		//		viewport.
		//		Uses the border-box model (inclusive of border and padding but
		//		not margin).  Does not act as a setter.
		// node: DOMNode|String
		// includeScroll: Boolean?
		// returns: Object

		node = dom.get(node);
		var body = node.ownerDocument.body,
			result = node.getBoundingClientRect();
		result = {x: result.left, y: result.top, w: result.right - result.left, h: result.bottom - result.top};

		// account for document scrolling
		// if offsetParent is used, ret value already includes scroll position
		// so we may have to actually remove that value if !includeScroll
		if(includeScroll){
			var scroll = exports.docScroll(node.ownerDocument);
			result.x += scroll.x;
			result.y += scroll.y;
		}

		return result; // Object
	};

	// random "private" functions wildly used throughout the toolkit

	exports.getMarginSize = function getMarginSize(/*DomNode*/ node, /*Object*/ computedStyle) {
		// summary:
		//		returns an object that encodes the width and height of
		//		the node's margin box
		// node: DOMNode|String
		// computedStyle: Object?
		//		This parameter accepts computed styles object.
		//		If this parameter is omitted, the functions will call
		//		dojo.getComputedStyle to get one. It is a better way, calling
		//		dojo.computedStyle once, and then pass the reference to this
		//		computedStyle parameter. Wherever possible, reuse the returned
		//		object of dojo/dom-style.getComputedStyle().

		node = dom.get(node);
		var me = exports.getMargins(node, computedStyle || domStyle._getComputedStyle(node));
		var size = node.getBoundingClientRect();
		return {
			w: (size.right - size.left) + me.w,
			h: (size.bottom - size.top) + me.h
		};
	};

	exports.normalizeEvent = function(event) {
		// summary:
		//		Normalizes the geometry of a DOM event, normalizing the pageX, pageY,
		//		offsetX, offsetY, layerX, and layerX properties
		// event: Object
		if(!('layerX' in event)){
			event.layerX = event.offsetX;
			event.layerY = event.offsetY;
		}
	};
});