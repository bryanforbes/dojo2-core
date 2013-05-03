define([
	'require',
	'exports',
	'./on',
	'./topic',
	'./domReady!'
], function (require, exports, on, topic) {
	/**
	 * Gets the hash string in the browser URL.
	 *
	 * @returns {string} Hash string.
	 */
	exports.get = function () {
		var href = location.href,
			i = href.indexOf('#');
		return (i >= 0) ? href.substring(i + 1) : '';
	};

	/**
	 * Sets the hash string in the browser URL.
	 *
	 * @param {string} hash The hash to set.
	 * @param {boolean} replace
	 * If true, updates the hash value in the current history
	 * state instead of creating a new history state.
	 */
	exports.set = function (hash, replace) {
		if (hash.charAt(0) !== '#') {
			hash = '#' + hash;
		}
		if (replace) {
			location.replace(hash);
		}
		else {
			location.href = hash;
		}
	};

	on(window, 'hashchange', function () {
		topic.publish('/dojo/hashchange', exports.get());
	});
});