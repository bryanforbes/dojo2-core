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

			assert.notStrictEqual(result, null);
			assert.deepEqual(result, source);

			source.toString = source.toString;
			lang.mixIn(destination, source);

			assert.strictEqual(source.foo, destination.foo);
			assert.strictEqual(source.baz, destination.baz);
			assert.strictEqual(source.array, destination.array);
			assert.strictEqual(source.toString, destination.toString);
			assert.ok(!destination.hasOwnProperty('toString'));

			destination.one.two.three = 4;

			assert.equal(source.one.two.three, 4);
		},

		delegate: function () {
			var destination = lang.delegate(source, {
				bar: 'new bar'
			});

			assert.strictEqual(source.foo, destination.foo);
			assert.notEqual(source.bar, destination.bar);
			assert.strictEqual(source.baz, destination.baz);
			assert.strictEqual(source.array, destination.array);

			assert.ok(!destination.hasOwnProperty('foo'));
			assert.ok(destination.hasOwnProperty('bar'));
			assert.ok(!destination.hasOwnProperty('baz'));
		},

		setProperty: function () {
			lang.setProperty(source, 'baz.blah', 'flap');
			lang.setProperty(source, 'baz.one.two', 'three');

			assert.deepPropertyVal(source, 'baz.blah', 'flap');
			assert.deepPropertyVal(source, 'baz.one.two', 'three');
		},

		getProperty: function () {
			assert.strictEqual(lang.getProperty(source, 'baz.blah'), 'flop');
			assert.strictEqual(lang.getProperty(source, 'baz.blah.one'), undefined);
			assert.strictEqual(lang.getProperty(source, 'baz.one.two.three'), undefined);
			assert.notStrictEqual(lang.getProperty(source, 'baz.one.two.three', true), undefined);
		},

		bind: {
			'normal binding': function () {
				source.foo = utils.spy(function () {
					return 0;
				});
				var sourceBoundFoo = utils.spy(lang.bind(source, source.foo, 1, 2));

				sourceBoundFoo(3);
				sourceBoundFoo.call(destination, 3);

				assert.strictEqual(source.foo.calls[0].thisValue, source);
				assert.deepEqual(source.foo.calls[0].args, [1, 2, 3]);
				assert.strictEqual(source.foo.calls[1].thisValue, source);
				assert.deepEqual(source.foo.calls[1].args, [1, 2, 3]);
				assert.strictEqual(sourceBoundFoo.calls[0].returnValue, 0);

				source.foo = utils.spy(function () {
					return 1;
				});
				sourceBoundFoo(3);

				assert.ok(!source.foo.called);
				assert.strictEqual(sourceBoundFoo.calls[2].returnValue, 0);
			},

			'late binding': function () {
				source.foo = utils.spy(function () {
					return 0;
				});
				var sourceBoundFoo = utils.spy(lang.bind(source, 'foo', 1, 2));

				sourceBoundFoo(3);
				sourceBoundFoo.call(destination, 3);

				assert.strictEqual(source.foo.calls[0].thisValue, source);
				assert.deepEqual(source.foo.calls[0].args, [1, 2, 3]);
				assert.strictEqual(source.foo.calls[1].thisValue, source);
				assert.deepEqual(source.foo.calls[1].args, [1, 2, 3]);
				assert.strictEqual(sourceBoundFoo.calls[0].returnValue, 0);
				assert.strictEqual(sourceBoundFoo.calls[1].returnValue, 0);

				source.foo = utils.spy(function () {
					return 2;
				});

				sourceBoundFoo(3);
				sourceBoundFoo.call(destination, 3);

				assert.ok(source.foo.called);
				assert.strictEqual(source.foo.calls[0].thisValue, source);
				assert.deepEqual(source.foo.calls[0].args, [1, 2, 3]);
				assert.strictEqual(source.foo.calls[1].thisValue, source);
				assert.deepEqual(source.foo.calls[1].args, [1, 2, 3]);
				assert.strictEqual(sourceBoundFoo.calls[2].returnValue, 2);
				assert.strictEqual(sourceBoundFoo.calls[3].returnValue, 2);
			}
		},

		clone: {
			'undefined': function () {
				var cloned = lang.clone(undefined);
				assert.isUndefined(cloned);
			},

			'null': function () {
				var cloned = lang.clone(null);
				assert.isNull(cloned);
			},

			'non-zero number': function () {
				var cloned = lang.clone(1);
				assert.equal(cloned, 1);
			},

			'true': function () {
				var cloned = lang.clone(true);
				assert.equal(cloned, true);
			},

			'object': function () {
				var cloned = lang.clone(source);
				assert.notStrictEqual(cloned, source);
				assert.notStrictEqual(cloned.baz, source.baz);
				assert.deepEqual(cloned, source);
			},

			'array': function () {
				var arraySource = [ 1, 2, { foo: 'bar' }, 4 ],
					cloned = lang.clone(arraySource);
				assert.notStrictEqual(cloned, arraySource);
				assert.notStrictEqual(cloned[2], arraySource[2]);
				assert.deepEqual(cloned, arraySource);
			},

			'regexp': function () {
				var regexpSource = /asdf/ig,
					cloned = lang.clone(regexpSource);
				assert.notStrictEqual(cloned, regexpSource);
				assert.deepEqual(cloned, regexpSource);
			},

			'date': function () {
				var dateSource = new Date(12345684732),
					cloned = lang.clone(dateSource);
				assert.notStrictEqual(cloned, dateSource);
				assert.equal(cloned.getTime(), dateSource.getTime());
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

			assert.ok(foo.called);
			assert.strictEqual(foo.calls[0].thisValue, source);
			assert.deepEqual(foo.calls[0].args, [1, 2, 3]);
			assert.strictEqual(foo.calls[1].thisValue, destination);
			assert.deepEqual(foo.calls[1].args, [1, 2, 4]);
		},

		deepMixIn: function () {
			lang.deepMixIn(destination, source);

			assert.strictEqual(source.foo, destination.foo);
			assert.equal(source.bar, destination.bar);
			assert.notStrictEqual(source.baz, destination.baz);
			assert.notStrictEqual(source.one, destination.one);
			assert.notStrictEqual(source.one.two, destination.one.two);
			assert.notStrictEqual(source.array, destination.array);
			assert.notEqual(destination.one.two, 2);

			destination.one.two.three = 4;

			assert.notEqual(source.one.two.three, 4);
		},

		deepDelegate: function () {
			var destination = lang.deepDelegate(source, {
				bar: 'new bar'
			});

			assert.strictEqual(source.foo, destination.foo);
			assert.notEqual(source.bar, destination.bar);
			assert.notStrictEqual(source.baz, destination.baz);
			assert.notStrictEqual(source.one.two, destination.one.two);
			assert.notStrictEqual(source.array, destination.array);

			destination.one.two.three = 4;

			assert.notEqual(source.one.two.three, 4);

			assert.ok(!destination.hasOwnProperty('foo'));
			assert.ok(destination.hasOwnProperty('bar'));
			assert.ok(destination.hasOwnProperty('baz'));
		}
	});
});