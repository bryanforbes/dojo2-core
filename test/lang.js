define([
	'teststack!tdd',
	'chai',
	'dojo/lang'
], function (test, chai, lang) {
	var assert = chai.assert,
		slice = Array.prototype.slice;
	test.suite('lang', function () {
		test.test('mixin', function () {
			var testObject = {};
			lang.mixin(testObject, {
				foo: 1,
				bar: 2,
				toString: Object.prototype.toString
			}, {
				foo: 3
			});

			assert.lengthOf(Object.keys(testObject), 2, 'testObject has 2 keys');
			assert.ok(testObject.hasOwnProperty('foo'), 'testObject has a "foo" property');
			assert.ok(testObject.hasOwnProperty('bar'), 'testObject has a "bar" property');
			assert.strictEqual(testObject.foo, 3, 'testObject\'s "foo" property equals 3');
			assert.ok(!testObject.hasOwnProperty('toString'), 'testObject does not have its own "toString" property');
		});

		test.test('clone', function () {
			var object = {
				foo: 'bar',
				answer: 42,
				jan102007: new Date(2007, 0, 10),
				baz: {
					a: null,
					b: [1, 'b', 2.3, true, false],
					c: {
						d: undefined,
						e: 99,
						f: function () { console.log(42); return 42; },
						g: /\d+/gm
					}
				},
				toString: function () { return 'meow'; }
			};

			var clone = lang.clone(object);
			assert.strictEqual(object.foo, clone.foo);
			assert.strictEqual(object.answer, clone.answer);
			assert.strictEqual(+object.jan102007, +clone.jan102007);
			assert.notStrictEqual(object.jan102007, clone.jan102007);
			assert.notStrictEqual(object.baz, clone.baz);
			assert.strictEqual(object.baz.a, clone.baz.a);
			assert.notStrictEqual(object.baz.b, clone.baz.b);
			assert.deepEqual(object.baz.b, clone.baz.b);
			assert.notStrictEqual(object.baz.c, clone.baz.c);
			assert.strictEqual(object.baz.c.d, clone.baz.c.d);
			assert.strictEqual(object.baz.c.e, clone.baz.c.e);
			assert.strictEqual(object.baz.c.f, clone.baz.c.f);
			assert.equal(object.baz.c.g.toString(), clone.baz.c.g.toString());
			assert.notStrictEqual(object.baz.c.g, clone.baz.c.g);
			assert.strictEqual(object.toString, clone.toString);
		});

		test.test('setProperty', function () {
			var object = {};

			assert.notDeepProperty(object, 'A.B.C', 'object does not have "A.B.C"');

			lang.setProperty(object, 'A.B.C', 400);
			assert.deepProperty(object, 'A.B.C', 'object has "A.B.C"');
			assert.deepPropertyVal(object, 'A.B.C', 400, 'object.A.B.C is 400');
		});

		test.test('getProperty', function () {
			var object = {
				A: {
					B: {
						C: 400
					}
				}
			};

			assert.strictEqual(lang.getProperty(object, 'A.B.C'), 400, 'object.A.B.C is 400');
			assert.strictEqual(lang.getProperty(object, 'A.D.C'), undefined, 'getting object.A.D.C returns undefined');
		});

		var base = { foo: 1 },
			delegate = Object.create(base);

		delegate.bar = 2;

		test.test('forIn', function () {
			var values = [];
			lang.forIn(base, function (value, key) {
				assert.strictEqual(value, base[key], '"' + key + '" property of base is ' + value);
				values.push(key);
			});

			assert.lengthOf(values, 1, 'callback called once for base');
			assert(values.indexOf('foo') > -1, '"foo" was iterated over');

			values = [];
			lang.forIn(delegate, function (value, key) {
				assert.strictEqual(value, delegate[key], '"' + key + '" property of delegate is ' + value);
				values.push(key);
			});

			assert.lengthOf(values, 2, 'callback called twice for delegate');
			assert(values.indexOf('foo') > -1 && values.indexOf('bar') > -1,
				   '"foo" and "bar" were iterated over');
		});

		test.test('forOwn', function () {
			var values = [];
			lang.forOwn(base, function (value, key) {
				assert.strictEqual(value, base[key], '"' + key + '" property of base is ' + value);
				values.push(key);
			});

			assert.lengthOf(values, 1, 'callback called once for base');
			assert(values.indexOf('foo') > -1, '"foo" was iterated over');

			values = [];
			lang.forOwn(delegate, function (value, key) {
				assert.strictEqual(value, delegate[key], '"' + key + '" property of delegate is ' + value);
				values.push(key);
			});

			assert.lengthOf(values, 1, 'callback called once for delegate');
			assert(values.indexOf('bar') > -1, '"bar" was iterated over');
			assert(values.indexOf('foo') === -1, '"foo" was skipped');
		});

		test.test('bind', function () {
			var context1 = { foo: 'bar' },
				context2 = { foo: 'baz' };

			function func(arg1, arg2) {
				return [this.foo, arg1, arg2];
			}

			var bound1 = lang.bind(context1, func),
				result = bound1();
			assert.strictEqual(result[0], 'bar', 'bound1() calls func with context1 as context');
			assert.strictEqual(result[1], undefined, 'bound1() calls func with no arguments');

			result = bound1.call(context2);
			assert.strictEqual(result[0], 'bar', 'bound1 always calls func with context1 as context');

			var bound2 = lang.bind(context2, func);
			result = bound2('blah');
			assert.strictEqual(result[0], 'baz', 'bound2("blah") calls func with context2 as context');
			assert.strictEqual(result[1], 'blah', 'bound2("blah") calls func with "blah" as the first argument');

			var bound3 = lang.bind(context1, func, 'foo');
			result = bound3('bar');
			assert.strictEqual(result[0], 'bar', 'bound3("bar") calls func with context1 as context');
			assert.strictEqual(result[1], 'foo', 'bound3("bar") calls func with "foo" as the first argument');
			assert.strictEqual(result[2], 'bar', 'bound3("bar") calls func with "bar" as the second argument');

			context1.method = function () {
				return 1;
			};

			var bound4 = lang.bind(context1, 'method');
			result = bound4();
			assert.strictEqual(result, 1, 'bound4() calls "method" of context1');

			context1.method = function () {
				return 2;
			};
			result = bound4();
			assert.strictEqual(result, 2, 'bound4() calls new "method" of context1');
		});

		test.test('partial', function () {
			var context = { foo: 'bar' };

			function func (arg1, arg2, arg3) {
				return [this.foo, arg1, arg2, arg3];
			}
			var partial1 = lang.partial(func);
			assert.strictEqual(partial1.call(context)[0], 'bar', 'partial call takes on context from call/apply');
			assert.strictEqual(partial1()[0], undefined, 'partial1 has no context bound and global "foo" is undefined');

			var partial2 = lang.partial(func, 'foo', 'bar'),
				result = partial2('baz');
			assert.strictEqual(result[1], 'foo', 'partial2 has "foo" passed as func\'s first argument');
			assert.strictEqual(result[2], 'bar', 'partial2 has "bar" passed as func\'s second argument');
			assert.strictEqual(result[3], 'baz', 'partial2 has "baz" passed as func\'s third argument');

			var partial3 = lang.partial(func, 'foo'),
				partial4 = lang.partial(partial3, 'bar');

			result = partial3('baz');
			assert.strictEqual(result[1], 'foo', 'partial3 has "foo" passed as func\'s first argument');
			assert.strictEqual(result[2], 'baz', 'partial3 has "baz" passed as func\'s second argument');

			result = partial4('baz');
			assert.strictEqual(result[1], 'foo', 'partial4 has "foo" passed as func\'s first argument');
			assert.strictEqual(result[2], 'bar', 'partial4 has "bar" passed as func\'s second argument');
			assert.strictEqual(result[3], 'baz', 'partial4 has "baz" passed as func\'s third argument');
		});
	});
});