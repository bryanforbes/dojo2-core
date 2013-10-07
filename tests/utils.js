define(['exports'], function (exports) {
	var slice = [].slice,
		hasOwn = {}.hasOwnProperty;
	function createSpy(func) {
		function invoke(thisObject, args) {
			proxy.called = true;
			proxy.callCount += 1;
			proxy.thisValues.push(thisObject);
			proxy.args.push(args);

			var returnValue, exception;
			try {
				returnValue = func.apply(thisObject, args);
			}
			catch (e) {
				exception = e;
				throw e;
			}
			finally {
				proxy.returnValues.push(returnValue);
				proxy.exceptions.push(exception);
				proxy.calls.push({
					thisValue: thisObject,
					args: args,
					returnValue: returnValue,
					exception: exception
				});
			}

			return returnValue;
		}
		function proxy() {
			return invoke(this, slice.call(arguments));
		}
		proxy.reset = function () {
			proxy.called = false;
			proxy.callCount = 0;
			proxy.calls = [];
			proxy.args = [];
			proxy.returnValues = [];
			proxy.thisValues = [];
			proxy.exceptions = [];
		};
		proxy.reset();

		return proxy;
	}
	function wrapMethod(object, property) {
		var original = object[property],
			spyWrapper = createSpy(original),
			owned = hasOwn.call(object, property);

		spyWrapper.displayName = property;
		spyWrapper.restore = function () {
			if (!owned) {
				delete object[property];
			}
			if (object[property] === spyWrapper) {
				object[property] = original;
			}
		};

		for (var key in original) {
			if (!hasOwn.call(spyWrapper, key)) {
				spyWrapper[key] = original[key];
			}
		}
	}
	function spy(object, property) {
		if (!property && typeof object === 'function') {
			return createSpy(object);
		}
		if (!object && !property) {
			return createSpy(function () {});
		}
		
		return wrapMethod(object, property);
	}

	exports.spy = spy;
});