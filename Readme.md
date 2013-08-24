
# app.js

Provides Angular like bootstrapping with Backbone like flexibility.

Facilitates the creation of modules and apps.


## Global Methods

### module(moduleName)
Creates/references the module by name.

```js
var myModule = module("myModule");
myModule.use("someOtherMod");
```

```c#
var test = new Test("hello");
public class Test()
{
}
```

### app(appName)
Create/references the app by name.

## App and Module Methods

### register(name, value, type)
Register an object with the current module.
The **type** argument is optional and useful when registering a plain function (such as jQuery).
If the **value** is an object the type will be "object". If the **value** is a function, the type will be "constructor".
```js
myApp.register("foo", { bar: 23 });
myApp.register("$", jQuery, "function");
```


### construct(name, creator)
Creates a construct to be used by the module. This is a core feature to be used only when creating new 'types' of 
objects that need to have specific methods and properties. Analogous to interfaces.

Constructs allow for the composition of objects. Similar to the `_.extend` pattern,
Constructs createa a way to augument simple objects with common patterns.
For instance, a construct can be created to provide Backbone views.

```js
module("BackboneExtensions").construct("view", function () {
	return function (construct, name) {
		var protoProps = construct.prototype;

		protoProps.constructor = construct;
		if (protoProps.constructor) {
			protoProps._ctor = protoProps[name].constructor;
		}

		protoProps.constructor = function () {
			var context = arguments[arguments.length - 1];

			// inject the constructor
			if (this._ctor) {
				context.call(this._ctor, arguments, this);
			}

			Backbone.View.apply(this, arguments);
			return this;
		};

		return Backbone.View.extend(protoProps[name], construct);
	};
});
```

The simple goal of the code above is to hijack the constructor so it can be injected with the context.
The context, retrieved using this: `var context = arguments[arguments.length - 1];` is added as the last argument
by the context script during instantiation.

**Using Constructs**
```js
app("myApp").use("BackboneExtensions");
```

When an app or a module uses a module that contains constructs, each construct name is copied to the app symbol
so the following is possible.

**Creating an instance of a construct**
```js
app("myApp").view(function (dependency1) {
	// injected constructor
}, {
	// prototype
});
```

The injected constructor can return an object to be used or the prototype 
can be used for the object creation. If no injection is neccessary, then the constructor function
is not required.

```js
app("myApp").view({
	// prototype
});
```
**Constructor Injection**

If `window.debug` is set to true (useful for unit tests), the constructor arguments are read dynamically.
However if the JavaScript is obfusticated, injection will have to be annotated.

```js
// using an array for the constructor
myApp.service("foo", ["dependency1", function (dep1) {
	// dependency1 is injected into dep1
}]);


// using the $inject property
myApp.service("foo", function (dep1) {
	// dependency1 is injected into dep1
}, {
	$inject: ["dependency1"],
	// rest of prototype
});
```



### use(moduleDependencies)
Any number of arguments (or an array) of dependent module names.

### config(fn)
Registers a config method to execute before application start.
fn can be injected using the array notation

## Additional App Methods

### start(fn)
Registers a start method to execute after all configuration methods have executed.
fn can be injected using the array notation

If calling start without arguments 'starts' the app bootstrapping process.

## Services

### context
The ioc container for the app

#### register(name, value, type)
Registers an object with the container.
The type is only needed if the value is a plain function not to be used 
as a constructor function (created with the new keyword).
Valid types are "object", "constructor", "function".


#### get
`get(name)`
Retrieves the dependency.
If the dependency is a constructor it will inject and return then 'newed' object as a singleton.

If a second argument passed is _true_ it will retrieve the _raw_ registry value.
So in the case of a constructor function it will return the un-'newed' object.


#### call(method, args, context)
A utility method for satisfying the dependencies of a method directly.
The context will be applied to the method call -> 'this'

#### instantiate(constructor, args)
Calls the constructor which can also be the name
of a registered dependency.


### globals
A plain old JavaScript object that is shared accross apps.


## Constructs

### service
A simple call to register.
