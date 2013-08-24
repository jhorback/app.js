/// <reference path="context.js" />
/// <reference path="app.js" />


module("app.js");

window.debug = true;

var counter = 0,
    getNextName = function () {
	    return "test" + counter++;
    };


test("Calling module returns an object with expected methods.", function () {

	var m = module(getNextName());
	ok(m.register !== undefined, "register is defined");
	ok(m.construct !== undefined, "construct is defined");
	ok(m.use !== undefined, "use is defined");
	ok(m.config !== undefined, "config is defined");
	ok(m.start === undefined, "start is not defined");
	ok(m.call === undefined, "call is not defined");
	
});


test("Calling app returns an object with expected methods.", function () {

	var m = app(getNextName());
	ok(m.register !== undefined, "register is defined");
	ok(m.construct !== undefined, "construct is defined");
	ok(m.use !== undefined, "use is defined");
	ok(m.config !== undefined, "config is defined");
	ok(m.start !== undefined, "start is defined");
	ok(m.call !== undefined, "call is defined");
});


test("Registered start and config method gets injected on app.start.", function () {
	expect(2);

	var testApp = app(getNextName());
	testApp.register("foo", { foo: 23 });
	testApp.config(function (foo) {
		equal(foo.foo, 23);
	});
	testApp.start(function (foo) {
		equal(foo.foo, 23);
	});
	testApp.start();
});


test("Declaring dependencies in start and config methods using an array works", function () {
	expect(2);

	var testApp = app(getNextName());
	testApp.register("fooReal", { foo: 23 });
	testApp.config(["fooReal", function (foo) {
		equal(foo.foo, 23);
	}]);
	testApp.start(["fooReal", function (foo) {
		equal(foo.foo, 23);
	}]);
	testApp.start();
});


test("Registered start and config method can change the state of services.", function () {
	expect(2);

	var testApp = app(getNextName());
	testApp.register("foo", function () {
		var x = 23;
		return {
			setX: function (newX) {
				x = newX;
			},
			getX: function () {
				return x;
			}
		};
	});

	testApp.config(function (foo) {
		equal(foo.getX(), 23);
		foo.setX(24);
	});
	
	testApp.start(function (foo) {
		equal(foo.getX(), 24);
	});
	
	testApp.start();
});


test("Using another modules services works.", function () {
	expect(2);
	
	var modName = getNextName();
	var testMod = module(modName);
	var testApp = app(getNextName());
	testMod.register("foo", { foo: 23 });
	testApp.use(modName);

	testApp.config(function (foo) {
		equal(foo.foo, 23);
	});

	testApp.start(function (foo) {
		equal(foo.foo, 23);
	});

	testApp.start();
});


test("A module used more than once only gets bootstrapped once.", function () {

	var counter = 0;
	var modName = getNextName();
	var modName2 = getNextName();
	var testMod = module(modName);
	var testMod2 = module(modName2);
	var testApp = app(getNextName());
	testMod2.config(function () {
		counter++;
	});

	testMod.use(modName2);
	testApp.use(modName, modName2);
	testApp.use(modName2);

	testApp.start();
	equal(counter, 1);
});


test("Apps sharing modules get the module in a fresh state.", function () {
	expect(3);

	var modName = getNextName();
	var testMod = module(modName);
	var testApp = app(getNextName());
	var testApp2 = app(getNextName());

	testMod.register("foo", function () {
		var x = 23;
		return {
			setX: function (newX) {
				x = newX;
			},
			getX: function () {
				return x;
			}
		};
	});

	testApp.use(modName);
	testApp2.use(modName);
	
	
	testApp.start(function (foo) {
		equal(foo.getX(), 23, "testApp has original value.");
		foo.setX(24);
		equal(foo.getX(), 24, "testApp has changed value.");
	});

	testApp2.start(function (foo) {
		equal(foo.getX(), 23, "testApp2 has original value.");
	});

	testApp.start();
	testApp2.start();
});


test("An app cannot be started more than once.", function () {

	var counter = 0;
	var testApp = app(getNextName());

	testApp.start(function () {
		counter++;
	});

	testApp.start();
	testApp.start();
	equal(counter, 1);
});


test("The context is available for injection.", function () {
	expect(1);
	
	var testApp = app(getNextName());
	testApp.config(function (context) {

		context.register("foo", { test: 23 });
	});

	testApp.start(function (foo) {
		equal(foo.test, 23);
	});

	testApp.start();
});


test("The globals var is available for injection and can be used accrossed apps.", function () {
	expect(1);

	var testApp = app(getNextName());
	var testApp2 = app(getNextName());
	
	testApp.config(function (globals) {
		globals.rock = 23;
	});

	testApp2.start(function (globals) {
		equal(globals.rock, 23);
	});

	testApp.start();
	testApp2.start();
});


test("The service construct is available and can be used to create generic services.", function () {
	expect(2);
	
	var testApp = app(getNextName());
	testApp.service("fooFactory", function () {
		return {
			foo: 23
		};
	});

	testApp.service("fooService", function (fooFactory) {
		this.fooFactory = fooFactory;
	}, {
		test: function () {
			return this.fooFactory.foo;
		}
	});

	testApp.start(function (fooFactory, fooService) {

		equal(fooFactory.foo, 23);
		fooFactory.foo = 24;
		equal(fooService.test(), 24);
	});
	
	testApp.start();
});


test("Dependencies can be injected into a service via an array argument.", function () {
	expect(1);
	
	var testApp = app(getNextName());
	testApp.register("fooReal", { test: 23 });
	testApp.service("fooService", ["fooReal", function (foo) {

		this.foo = foo;

	}], {
		test: function () {
			return this.foo.test;
		}
	});

	testApp.start(function (fooService) {

		equal(fooService.test(), 23);

	});
	testApp.start();
});


test("Dependencies can be injected into a service via the $inject property.", function () {
	expect(1);

	var testApp = app(getNextName());
	testApp.register("fooReal", { test: 23 });
	testApp.service("fooService", function (foo) {

		this.foo = foo;

	}, {
		$inject: ["fooReal"],
		
		test: function () {
			return this.foo.test;
		}
	});

	testApp.start(function (fooService) {

		equal(fooService.test(), 23);

	});
	testApp.start();
});


test("Constructs can enhance object creation.", function () {
	expect(2);

	var testApp = app(getNextName());
	testApp.register("foo", { bar: "wonderwoman" });
	testApp.construct("conundrum", function (foo) {

		return function (construct) {

			construct.prototype.likes = function () {
				return foo.bar;
			};

			return construct;
		};
	});

	testApp.conundrum("superman", function (foo) {
		this.foo = foo;
	}, {
		doesNotLike: function () {
			return this.foo.bar;
		}
	});

	testApp.start(function (superman) {

		equal(superman.likes(), "wonderwoman");
		equal(superman.doesNotLike(), "wonderwoman");

	});

	testApp.start();
});


test("Constructs can be used from other modules.", function () {
	expect(3);

	var testModName = getNextName();
	var testMod = module(testModName);
	var testApp = app(getNextName());
	
	testMod.construct("awesome", function () {
		return function (construct) {
			construct.prototype.itis = 23;
			return construct;
		};
	});
	
	equal(testApp.awesome, undefined, "Awesome is not defined.");
	testApp.use(testModName);
	notEqual(testApp.awesome, undefined, "Awesome is defined.");
	testApp.awesome("ness", function () {
		
	}, {
		test: function () {
			return this.itis;
		}
	});
	testApp.start(function (ness) {
		equal(ness.test(), 23, "ness was modified by awesome");
	});
	testApp.start();
});


test("Using modules indirectly uses the correct app context.", function () {
	expect(2);
	
	var m1Name = getNextName();
	var m2Name = getNextName();
	var appName = getNextName();
	
	var testApp = app(appName);
	var m2 = module(m2Name);

	var m1 = module(m1Name).use(m2Name);
	m1.register("foo", { bar: 23 });
	
	testApp.use(m1Name);
	m2.config(function (context) {
		var foo = context.get("foo");
		equal(foo.bar, 23);
	});
	testApp.start(function (foo) {
		equal(foo.bar, 23);
	});
	testApp.start();
});


test("Constructor function is not required in constructs", function () {
	var testApp = app(getNextName());
	testApp.service("foo", {
		testMethod: function () {
			ok(true, "Constructor not required.");
		}
	});

	testApp.start(function (foo) {
		foo.testMethod();
	});
	
	testApp.start();
});


test("The app call method is injected.", function () {
	var testApp = app(getNextName());
	testApp.register("foo", {
		bar: 23
	});

	testApp.call(function (foo) {
		equal(foo.bar, 23);
	});
});