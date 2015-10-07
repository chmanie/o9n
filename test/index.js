'use strict';

var test = require('tape');
var orientation = require('../').orientation;
var Promise = window.Promise || require('a-promise');

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
    t.end();
  }

  orientation.addEventListener('change', onChange);
  orientation.dispatchEvent(evt);
  orientation.removeEventListener('change', onChange);

});

test('orientation.onchange', function (t) {

  t.equal(orientation.onchange, null);

  orientation.onchange = function () {
    t.end();
  };

  orientation.dispatchEvent(evt);

  orientation.onchange = null;

});

test('orientation type', function (t) {

  t.plan(1);

  t.equal(typeof orientation.type, 'string');

});

test('orientation functions', function (t) {

  t.plan(4);

  t.equal(typeof orientation.lock, 'function');
  t.equal(typeof orientation.unlock, 'function');

  var promise = orientation.lock('landscape-primary');
  t.ok(promise instanceof Promise);
  promise.then(function () {
    t.equal(typeof orientation.unlock(), 'undefined');
  }, function (err) {
    t.equal(typeof orientation.unlock(), 'undefined');
  });

});
