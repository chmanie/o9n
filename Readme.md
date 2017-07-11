# o9n (orientation)
A screen.orientation ponyfill 🖥

This is a [ponyfill](https://ponyfill.com) for the new, currently in-draft [screen.orientation API](https://w3c.github.io/screen-orientation/#widl-ScreenOrientation-lock-Promise-void--OrientationLockType-orientation).

## Installation

Use [npm](https://npmjs.org):

```
npm install o9n
```

## Usage

Using [browserify](https://github.com/substack/node-browserify):

```javascript
var orientation = require('o9n').orientation;
```

or build it and include the file in a `<script>`-tag:

```html
<script src="dist/o9n.js"></script>
```

It will be available in `window.o9n`.

## Supported browsers

It **should** work in these browsers although I couldn't test them all manually (or automatically).

* IE10+
* Edge 12+
* Firefox 6+
* Safari 6+
* Chrome 9+
* Opera 15+
* iOS Safari 5.1+
* Android browser 3+
* Blackberry browser 10+
* Opera mobile 30+
* Chrome for Android (some versions ago)
* Firefox for Android (some versions ago)
* IE Mobile 10+

## Building

```
npm run build
```

creates `o9n.js` in the *dist* dir

## Implementation

This ponyfill leverages all the browser APIs there are at the moment:

Methods:
* `screen.msLockOrientation` (IE11, Win8.1, Edge 12+)
* `screen.msUnlockOrientation` (IE11, Win8.1, Edge 12+)
* `screen.mozLockOrientation` (Firefox 18+)
* `screen.mozUnlockOrientation` (Firefox 18+)

Events:
* `window.onorientationchange` (iOS)
* `screen.onmsorientationchange` (IE11, Win8.1, Edge 12+)
* `screen.onmozorientationchange` (Firefox 18+)

Getters:
* `window.orientation` (iOS)
* `screen.msOrientation` (IE11, Win8.1, Edge 12+)
* `screen.mozOrientation` (Firefox 18+)


It normalises them to the aforementioned API draft which is implemented in Chrome 38+, Opera 25+. Also it falls back to a media-query solution for browsers that don't support orientation events at all (all that were not mentioned yet).

## API

### Methods

### o9n.orientation.lock()

Locks the orientation on devices that support it. Possible values are:

* `any`
* `natural`
* `landscape`
* `portrait`
* `portrait-primary`
* `portrait-secondary`
* `landscape-primary`
* `landscape-secondary`

It returns a **promise** which resolves, when the orientation was locked. The promise will be rejected if the device could not be locked or locking is not supported at all.

### o9n.orientation.unlock()

Unlocks the orientation on devices that support it. Returns **undefined**.

### Events

#### 'change' on o9n.orientation

`o9n.orientation` can listen to the `change` event that fires every time the orientation was changed. Just use `o9n.orientation.addEventListener` or `o9n.orientation.onchange` like you would normally do.

### Getters

#### o9n.orientation.type

Equals to one of the following

* `portrait-primary`
* `portrait-secondary` (portrait upside down)
* `landscape-primary`
* `landscape-secondary` (landscape upside down)

#### o9n.orientation.angle

Currently equals to 0 for browsers that don't support it.

## Polyfill (not recommended)

It is also possible to install o9n as a polyfill. Just call

`o9n.install();`

before using any of the orientation API.

It will be then available as `window.screen.orientation`.

This implementation already differs a bit from the current browser implementation in Blink. So it is not recommended to use it as a polyfill to not confuse tools like Modernizr.

## Running the tests

```
npm test
```

## Contributing

I'm happy for every contribution or manual tests in browsers I could not test. Just open an issue or directly file a PR.

## License

MIT
