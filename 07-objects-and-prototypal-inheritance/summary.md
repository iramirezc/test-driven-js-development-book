# Summary - Part II: JavaScript for Programmers

## Chapter 7: Objects and Prototypal Inheritance

### 7.1 Objects & Properties

#### Object literal

example:

```js
var car = {
  model: {
    year: "1998",
    make: "Ford",
    model: "Mondeo"
  },
  color: 'Red',
  seats: 5,
  doors: 5,
  accessories: ['Air Condition', 'Electric Windows'],
  drive () {
    console.log('Vroooom!')
  }
}
```

### 7.2 Creating Objects with Constructors

#### constructors vs functions

> JavaScript does not make distinction between constructors and normal functions, any function can be called with the `new` operator, however there's a convention to capitalize the name of the functions that are used as constructors

example:

```js
function Car(model) {
  this.model = model;
}

function call(to) {
  // make a call
}

// function used as constructor
var car = new Car('ioniq');

call('mom');
```

#### detecting constructor misuse

```js
function Circle(radius) {
  if (!(this instanceof Circle)) {
    return new Circle(radius);
  }
  this.radius = radius;
}
```

### 7.3 Pseudo-Classical Inheritance

#### the intermediate constructor

```js
function Circle (radius) {
  this.radius = radius
};
(function (p) {
  p.diameter = function () {
    return this.radius * 2
  }
}(Circle.prototype))

function Sphere (radius) {
  this.radius = radius
}
Sphere.prototype = (function () {
  function F () { }
  F.prototype = Circle.prototype
  return new F()
}())
Sphere.prototype.constructor = Sphere

var sphere = new Sphere(6)
sphere.diameter() // 12
```

#### the `inherit` function with `_super` implementation

```js
if (!Function.prototype.inherit) {
  (function () {
    function F () { /* intermediate constructor */ }
    Function.prototype.inherit = function (parentFunction) {
      F.prototype = parentFunction.prototype
      this.prototype = new F()
      this.prototype.constructor = this
      this.prototype._super = parentFunction.prototype
    }
  }())
}
function Circle (radius) {
  this.radius = radius
};

(function (p) {
  p.diameter = function () {
    return this.radius * 2
  }
  p.circumference = function () {
    return this.diameter() * Math.PI
  }
  p.area = function () {
    return this.radius * this.radius * Math.PI
  }
}(Circle.prototype))

function Sphere (radius) {
  Circle.call(this, radius)
}

Sphere.inherit(Circle);

(function (p) {
  p.area = function () {
    return this._super.area.call(this) * 4
  }
}(Sphere.prototype))

var sphere = new Sphere(3)
sphere.diameter() // 6
sphere.area() // 113.09...
```

#### the `_super` method

> THIS IS NOT RECOMMENDED FOR PRODUCTION as it is not performant
>
> Downside for this is that inheritance is only static. if you would like to add more methods to the Person class, you will need to redefine that method again in the LoudPerson class. See the next note "the `_super` method helper"

```js
if (!Function.prototype.inheritFrom) {
  (function () {
    function F () { /* intermediate constructor */ }
    Function.prototype.inheritFrom = function (parentFunction, methods) {
      F.prototype = parentFunction.prototype
      this.prototype = new F()
      this.prototype.constructor = this
      var subProto = this.prototype
      tddjs.each(methods, (name, method) => {
        subProto[name] = function () {
          var returnValue
          var oldSuper = this._super
          this._super = parentFunction.prototype[name]
          try {
            returnValue = method.apply(this, arguments)
          } finally {
            this._super = oldSuper
          }
          return returnValue
        }
      })
    }
  }())
}
function Person (name) {
  this.name = name
}

Person.prototype = {
  constructor: Person,
  getName () {
    return this.name
  },
  speak () {
    return 'Hello'
  }
}

function LoudPerson (name) {
  Person.call(this, name)
}

LoudPerson.inheritFrom(Person, {
  getName () {
    return this._super().toUpperCase()
  },
  speak () {
    return this._super() + '!!!'
  }
})

var loudPerson = new LoudPerson('Rick')
loudPerson.getName() // 'RICK'
loudPerson.speak() // 'Hello!!!'
```

#### the `_super` method helper

> this `_super` method uses the implementation of the `inherit` (not the `inheritFrom`) function from the two previous examples

```js
function _super(object, methodName) {
  var method = object._super && object._super[methodName]

  if (typeof method !== 'function') {
    return
  }

  // cut the first two arguments (object and methodName)
  var args = Array.prototype.slice.call(arguments, 2)

  return method.apply(object, args)
}

// usage
function LoudPerson(name) {
  _super(this, 'constructor', name)
}
LoudPerson.inherit(Person)
LoudPerson.prototype.getName = function() {
  return _super(this, 'getName').toUpperCase()
}
LoudPerson.prototype.speak = function() {
  return _super(this, 'speak') + '!!!'
}
var loudPerson = new LoudPerson('Rick')
loudPerson.getName() // "RICK"
loudPerson.speak() // "Hello!!!"

```

### 7.4 Encapsulation & Information Hiding

#### private methods

> nothing new, just encapsulate the funtion inside a closure

Example:

```js
function Circle(radius) {
  this.radius = radius
}

(function (p) {
  // this is the private function
  function ensureValidRadius(radius) {
    return typeof radius === 'number' && radius > 0
  }
  // these functions are public
  p.getRadius = function () {
    return this.radius
  }
  p.setRadius = function (newRadius) {
    if (!ensureValidRadius(newRadius)) {
      throw new TypeError('radius should be greater than 0')
    }
    this.radius = newRadius
  }
})(Circle.prototype)

var circle = new Circle(3)
circle.setRadius(6)
circle.getRadius() // 6
circle.setRadius(0) // TypeError
```

#### privileged methods

> are methods that are built inside the scope of a constructor and have access to private members (private variables)

Example:

```js
function Circle(radius) {
  // this is a privileged method
  function getRadius() {
    return radius
  }
  // and this one too
  function setRadius(radius) {
    radius = newRadius
  }
}
```

#### functional inheritance

> So, we no longer depend on the `this` keyword, and instead we are using functions saving state in the closure of the private functions and returning the object with the API.
>
> Douglas Crockford calls these objects *durables*.
>
> Drawbacks for this approach are:
>
> * each instance holds a copy of every private member increasing memory
> * whenever we need to call a "super" function (a method from the parent) we need to add the cruft code to do that, as the example with the `sphere` calling the `circle`'s `area` method.

Example:

```js
function circle(radius) {
  function getSetRadius() {
    // I'm avoiding validation here
    if (arguments.length > 0) {
      radius = arguments[0]
    }
    return radius
  }

  function diameter () {
    return radius * 2
  }

  function area () {
    return radius * radius * Math.PI
  }

  return {
    radius: getSetRadius,
    diameter,
    area
  }
}
var circ = circle(6)
circ.radius() // 6
circ.radius(12) // 12
circ.diameter() // 24

// functional inheritance
function sphere(radius) {
  var sphereObj = circle(radius)
  var circleArea = sphereObj.area

  function area () {
    return 4 * circleArea()
  }

  sphereObj.area = area

  return sphereObj
}
var sphere1 = sphere(3)
sphere1.area() // 133.09...
```

### 7.5 Object Composition & Mixins

#### the `Object.create` method (prototype-based inheritance)

> returns a new object with the object provided as its prototype. It can be used to provide simple-inheritance.

Example:

```js
function Circle (radius) {
  this.radius = radius
}
Circle.prototype.area = function () {
  return this.radius * this.radius * Math.PI
}
var circle = new Circle(6)

var Sphere = Object.create(circle)

Sphere.area = function () {
  return circle.area.call(this) * 4
}

var sphere = Object.create(Sphere)
sphere.radius = 10

sphere.area() // 1256.63...
```

#### mixins

> provide a mechanism to share behavior between objects, in other words, you can have an object that extends its functionality by combining methods from different objects, resulting in a "merged" object with more "powers" (behaviors).
