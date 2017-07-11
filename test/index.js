'use strict';

var test = require('tape');
var orientation = require('../').orientation;
var Promise = window.Promise;

var evt;

try {
  evt = new Event('change');
} catch (e) {
  evt = { type: 'change' };
}

test('orientation is an EventTarget', function (t) {

  t.equal(typeof orientation.addEventListener, 'function');
  t.equal(typeof orientation.dispatchEvent, 'function');
  t.equal(typeof orientation.removeEventListener, 'function');

  function onChange (e) {
    t.ok(e.type, 'type should exist');
    orientation.removeEventListener('change', onChange);
    t.end();
  }

  orientation.addEventListener('change', onChange);
  orientation.dispatchEvent(evt);
});

test('orientation.onchange', function (t) {

  t.equal(orientation.onchange, null, 'onchange function should be null');

  orientation.onchange = function (changeEvt) {
    t.equal(changeEvt.target, orientation, 'evt.target should be the orientation object');
    t.equal(changeEvt.currentTarget, orientation, 'evt.currentTarget should be the orientation object');
    t.equal(changeEvt.type, 'change', 'event type should be \'change\'');
    t.end();
  };

  orientation.dispatchEvent(evt);
  orientation.onchange = null;

});

test('orientation type', function (t) {

  t.plan(1);

  t.equal(typeof orientation.type, 'string', 'orientation.type should be a string');

});

test('orientation functions', function (t) {

  t.plan(4);

  t.equal(typeof orientation.lock, 'function', 'lock function should exist');
  t.equal(typeof orientation.unlock, 'function', 'unlock function should exist');

  var promise = orientation.lock('landscape-primary');
  t.ok(promise instanceof Promise);
  promise.then(function () {
    t.equal(typeof orientation.unlock(), 'undefined');
  }, function (err) {
    t.equal(typeof orientation.unlock(), 'undefined');
  });
});
