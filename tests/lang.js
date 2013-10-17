define([
	'intern!object',
	'intern/chai!assert',
	'./utils',
	'../lang'
], function (registerSuite, assert, utils, lang) {
	var source, destination;
	registerSuite({
		name: 'lang',

		beforeEach: function () {
			source = {
				foo: function () {},
				bar: 'bar',
				baz: {
					blah: 'flop'
				},
				one: {
					two: {
						three: 3
					}
				},
				array: [ 1, 2, 3 ]
			};
			destination = {
				one: {
					two: 2
				},
				array: {}
			};
		},

		mixIn: function () {
			var result = lang.mixIn(null, source);

			assert.notStrictEqual(result, null, 'Result should be null');
			assert.deepEqual(result, source, 'Result should deeply equal source');

			source.toString = source.toString;
			lang.mixIn(destination, source);

			assert.strictEqual(destination.foo, source.foo, 'destination.foo should be strictly equal to source.foo');
			assert.strictEqual(destination.baz, source.baz, 'destination.baz should be strictly equal to source.baz');
			assert.strictEqual(destination.array, source.array,
				'destination.array should be strictly equal to source.array');
			assert.strictEqual(destination.toString, source.toString,
				'destination.toString should be strictly equal to source.toString');
			assert.isFalse(destination.hasOwnProperty('toString'), 'destination should not have its own toString');

			destination.one.two.three = 4;

			assert.strictEqual(source.one.two.three, 4, 'Changes to sub-objects should update source');
		},

		delegate: function () {
			var destination = lang.delegate(source, {
				bar: 'new bar'
			});

			assert.strictEqual(destination.foo, source.foo, 'destination.foo should strictly equal source.foo');
			assert.notEqual(destination.bar, source.bar, 'destination.bar should not equal source.bar');
			assert.strictEqual(destination.baz, source.baz, 'destination.baz should strictly equal source.baz');
			assert.strictEqual(destination.array, source.array, 'destination.array should strictly equal source.array');

			assert.isFalse(destination.hasOwnProperty('foo'));
			assert.isTrue(destination.hasOwnProperty('bar'));
			assert.isFalse(destination.hasOwnProperty('baz'));
		},

		setProperty: function () {
			lang.setProperty(source, 'baz.blah', 'flap');
			lang.setProperty(source, 'baz.one.two', 'three');

			assert.deepPropertyVal(source, 'baz.blah', 'flap', 'source.baz.blah should be equal to "flap"');
			assert.deepPropertyVal(source, 'baz.one.two', 'three', 'source.baz.one.two should be equal to "three"');
		},

		getProperty: function () {
			assert.strictEqual(lang.getProperty(source, 'baz.blah'), 'flop', 'getProperty should have returned "flop"');
			assert.strictEqual(lang.getProperty(source, 'baz.blah.one'), undefined,
				'getProperty should have returned undefined');
			assert.strictEqual(lang.getProperty(source, 'baz.one.two.three'), undefined,
				'getProperty should have returned undefined');
			assert.notStrictEqual(lang.getProperty(source, 'baz.one.two.three', true), undefined,
				'getProperty should have returned undefined');
			assert.isObject(lang.getProperty(source, 'baz.one.two'), 'getProperty should have created an object');
		},

		bind: {
			'normal binding': function () {
				source.foo = utils.spy(function () {
					return 0;
				});
				var sourceBoundFoo = utils.spy(lang.bind(source, source.foo, 1, 2));

				sourceBoundFoo(3);
				sourceBoundFoo.call(destination, 3);

				assert.strictEqual(source.foo.calls[0].thisValue, source,
					'|this| should have been source in the first call');
				assert.deepEqual(source.foo.calls[0].args, [1, 2, 3],
					'The arguments should have been [1, 2, 3] in the first call');
				assert.strictEqual(source.foo.calls[1].thisValue, source,
					'|this| should have been source in the second call');
				assert.deepEqual(source.foo.calls[1].args, [1, 2, 3],
					'The arguments should have been [1, 2, 3] in the second call');
				assert.strictEqual(sourceBoundFoo.calls[0].returnValue, 0,
					'The first call should have returned 0');
				assert.strictEqual(sourceBoundFoo.calls[1].returnValue, 0,
					'The second call should have returned 0');

				source.foo = utils.spy(function () {
					return 1;
				});
				sourceBoundFoo(3);

				assert.isFalse(source.foo.called,
					'The function assigned to "foo" should not have been called');
				assert.strictEqual(sourceBoundFoo.calls[2].returnValue, 0,
					'The third call should have returned 0');
			},

			'late binding': function () {
				source.foo = utils.spy(function () {
					return 0;
				});
				var sourceBoundFoo = utils.spy(lang.bind(source, 'foo', 1, 2));

				sourceBoundFoo(3);
				sourceBoundFoo.call(destination, 3);

				assert.strictEqual(source.foo.calls[0].thisValue, source,
					'|this| should have been source in the first call');
				assert.deepEqual(source.foo.calls[0].args, [1, 2, 3],
					'The arguments should have been [1, 2, 3] in the first call');
				assert.strictEqual(source.foo.calls[1].thisValue, source,
					'|this| should have been source in the second call');
				assert.deepEqual(source.foo.calls[1].args, [1, 2, 3],
					'The arguments should have been [1, 2, 3] in the second call');
				assert.strictEqual(sourceBoundFoo.calls[0].returnValue, 0,
					'The first call should have returned 0');
				assert.strictEqual(sourceBoundFoo.calls[1].returnValue, 0,
					'The second call should have returned 0');

				source.foo = utils.spy(function () {
					return 2;
				});

				sourceBoundFoo(3);
				sourceBoundFoo.call(destination, 3);

				assert.isTrue(source.foo.called,
					'The function assigned to "foo" should have been called');
				assert.strictEqual(source.foo.calls[0].thisValue, source,
					'|this| should have been source in the third call');
				assert.deepEqual(source.foo.calls[0].args, [1, 2, 3],
					'The arguments should have been [1, 2, 3] in the third call');
				assert.strictEqual(source.foo.calls[1].thisValue, source,
					'|this| should have been source in the fourth call');
				assert.deepEqual(source.foo.calls[1].args, [1, 2, 3],
					'The arguments should have been [1, 2, 3] in the fourth call');
				assert.strictEqual(sourceBoundFoo.calls[2].returnValue, 2,
					'The third call should have returned 0');
				assert.strictEqual(sourceBoundFoo.calls[3].returnValue, 2,
					'The fourth call should have returned 0');
			}
		},

		clone: {
			'undefined': function () {
				var cloned = lang.clone(undefined);
				assert.isUndefined(cloned, 'clone should return undefined');
			},

			'null': function () {
				var cloned = lang.clone(null);
				assert.isNull(cloned, 'clone should return null');
			},

			'non-zero number': function () {
				var cloned = lang.clone(1);
				assert.strictEqual(cloned, 1, 'clone should return 1');
			},

			'true': function () {
				var cloned = lang.clone(true);
				assert.strictEqual(cloned, true, 'clone should return true');
			},

			'object': function () {
				var cloned = lang.clone(source);
				assert.notStrictEqual(cloned, source, 'The cloned object should not be stricly equal to source');
				assert.notStrictEqual(cloned.baz, source.baz, 'cloned.baz should not be strictly equal to source.baz');
				assert.deepEqual(cloned, source, 'cloned and source should be deeply equal');
			},

			'array': function () {
				var arraySource = [ 1, 2, { foo: 'bar' }, 4 ],
					cloned = lang.clone(arraySource);
				assert.notStrictEqual(cloned, arraySource, 'The cloned array should not be the original array');
				assert.notStrictEqual(cloned[2], arraySource[2],
					'The objects in the second index should not be the same');
				assert.deepEqual(cloned, arraySource, 'The arrays are deeply equal');
			},

			'regexp': function () {
				var regexpSource = /asdf/ig,
					cloned = lang.clone(regexpSource);
				assert.notStrictEqual(cloned, regexpSource, 'The cloned RegExp should not be the original RegExp');
				assert.deepEqual(cloned, regexpSource, 'The RegExps should be deeply equal');
			},

			'date': function () {
				var dateSource = new Date(12345684732),
					cloned = lang.clone(dateSource);
				assert.notStrictEqual(cloned, dateSource, 'The cloned Date should not be the original Date');
				assert.strictEqual(cloned.getTime(), dateSource.getTime(), 'The internal time should be the same');
			}

			/* TODO: enable when has module has tests written
			if (has('host-browser')) {
				var nodeSource = document.createElement('div');
				nodeSource.innerHTML = '<span>Foo</span>';

				cloned = lang.clone(nodeSource);
				assert.notStrictEqual(cloned, nodeSource);
				assert.strictEqual(cloned.innerHTML, nodeSource.innerHTML);
			}*/
		},

		partial: function () {
			var foo = utils.spy(function () {
				return 0;
			});
			var partialFoo = utils.spy(lang.partial(foo, 1, 2));

			partialFoo.call(source, 3);
			partialFoo.call(destination, 4);

			assert.isTrue(foo.called, 'foo should have been called');
			assert.strictEqual(foo.calls[0].thisValue, source,
				'|this| in the first call should be source');
			assert.deepEqual(foo.calls[0].args, [1, 2, 3],
				'The arguments in the first call should be [1, 2, 3]');
			assert.strictEqual(foo.calls[1].thisValue, destination,
				'|this| in the second call should be destination');
			assert.deepEqual(foo.calls[1].args, [1, 2, 4],
				'The arguments in the second call should be [1, 2, 4]');
		},

		deepMixIn: function () {
			lang.deepMixIn(destination, source);

			assert.strictEqual(destination.foo, source.foo,
				'Functions should be copied and the same in both objects');
			assert.strictEqual(destination.bar, source.bar,
				'Strings should be copied and the same in both objects');
			assert.notStrictEqual(destination.baz, source.baz,
				'destination.baz should be a new object and not be the same in both objects');
			assert.notStrictEqual(destination.one, source.one,
				'destination.one should be a new object and not be the same in both objects');
			assert.notStrictEqual(destination.one.two, source.one.two,
				'destination.one.two should be a new object and not be the same in both objects');
			assert.notStrictEqual(destination.array, source.array,
				'destination.array should be a new array and not be the same in both objects');
			assert.notEqual(destination.one.two, 2,
				'destination.one.two should no longer be 2');

			destination.one.two.three = 4;

			assert.notEqual(source.one.two.three, 4,
				'Changing destination.one.two.three should not change source.one.two.three');
		},

		deepDelegate: function () {
			var destination = lang.deepDelegate(source, {
				bar: 'new bar'
			});

			assert.strictEqual(destination.foo, source.foo,
				'Functions should be the same in both objects');
			assert.notEqual(destination.bar, source.bar,
				'destination.bar should not be equal to source.bar');
			assert.notStrictEqual(destination.baz, source.baz,
				'destination.baz should be a new object');
			assert.notStrictEqual(destination.one.two, 2,
				'destination.one.two should not be 2');
			assert.notStrictEqual(destination.one.two, source.one.two,
				'destination.one.two should not be source.one.two');
			assert.notStrictEqual(destination.array, source.array,
				'destination.array should not be source.array');

			assert.isFalse(destination.hasOwnProperty('foo'),
				'destination should not have its own "foo"');
			assert.isTrue(destination.hasOwnProperty('bar'),
				'destination should have its own "bar"');
			assert.isTrue(destination.hasOwnProperty('baz'),
				'destination should have its own "baz"');
			assert.isFalse(destination.one.two.hasOwnProperty('three'),
				'destination.one.two should not have its own "three"');
			assert.strictEqual(destination.one.two.three, 3,
				'destination.one.two.three should equal 3');

			destination.one.two.three = 4;

			assert.notEqual(source.one.two.three, 4,
				'Changing destination.one.two.three should not change source.one.two.three');

		}
	});
});