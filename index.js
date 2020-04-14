'use strict';

function getOrientation() {
  if (!window) return undefined;
  var screen = window.screen;
  var orientation;

  // W3C spec implementation
  if (
    typeof window.ScreenOrientation === 'function' &&
    screen.orientation instanceof ScreenOrientation &&
    typeof screen.orientation.addEventListener == 'function' &&
    screen.orientation.onchange === null &&
    typeof screen.orientation.type === 'string'
  ) {
    orientation = screen.orientation;
  } else {
    orientation = createOrientation();
  }

  return orientation;
}

module.exports = {
  orientation: getOrientation(),
  getOrientation: getOrientation,
  install: function install() {
    var screen = window.screen;
    if (
      typeof window.ScreenOrientation === 'function' &&
      screen.orientation instanceof ScreenOrientation
    ) {
      return screen.orientation;
    }
    window.screen.orientation = orientation;
    return orientation;
  },
};

function createOrientation() {
  var orientationMap = {
    '90': 'landscape-primary',
    '-90': 'landscape-secondary',
    '0': 'portrait-primary',
    '180': 'portrait-secondary',
  };

  function ScreenOrientation() {}
  var or = new ScreenOrientation();

  var found = findDelegate(or);

  ScreenOrientation.prototype.addEventListener = delegate(
    'addEventListener',
    found.delegate,
    found.event
  );
  ScreenOrientation.prototype.dispatchEvent = delegate(
    'dispatchEvent',
    found.delegate,
    found.event
  );
  ScreenOrientation.prototype.removeEventListener = delegate(
    'removeEventListener',
    found.delegate,
    found.event
  );
  ScreenOrientation.prototype.lock = getLock();
  ScreenOrientation.prototype.unlock = getUnlock();

  Object.defineProperties(or, {
    onchange: {
      get: function () {
        return found.delegate['on' + found.event] || null;
      },
      set: function (cb) {
        found.delegate['on' + found.event] = wrapCallback(cb, or);
      },
    },
    type: {
      get: function () {
        var screen = window.screen;
        return (
          screen.msOrientation ||
          screen.mozOrientation ||
          orientationMap[window.orientation + ''] ||
          (getMql().matches ? 'landscape-primary' : 'portrait-primary')
        );
      },
    },
    angle: {
      value: 0,
    },
  });

  return or;
}

function delegate(fnName, delegateContext, eventName) {
  var that = this;
  return function delegated() {
    var args = Array.prototype.slice.call(arguments);
    var actualEvent = args[0].type ? args[0].type : args[0];
    if (actualEvent !== 'change') {
      return;
    }
    if (args[0].type) {
      args[0] = getOrientationChangeEvent(eventName, args[0]);
    } else {
      args[0] = eventName;
    }
    var wrapped = wrapCallback(args[1], that);
    if (fnName === 'addEventListener') {
      addTrackedListener(args[1], wrapped);
    }
    if (fnName === 'removeEventListener') {
      removeTrackedListener(args[1]);
    }
    args[1] = wrapped;
    return delegateContext[fnName].apply(delegateContext, args);
  };
}

var trackedListeners = [];
var originalListeners = [];

function addTrackedListener(original, wrapped) {
  var idx = originalListeners.indexOf(original);
  if (idx > -1) {
    trackedListeners[idx] = wrapped;
  } else {
    originalListeners.push(original);
    trackedListeners.push(wrapped);
  }
}

function removeTrackedListener(original) {
  var idx = originalListeners.indexOf(original);
  if (idx > -1) {
    originalListeners.splice(idx, 1);
    trackedListeners.splice(idx, 1);
  }
}

function wrapCallback(cb, orientation) {
  var idx = originalListeners.indexOf(cb);
  if (idx > -1) {
    return trackedListeners[idx];
  }
  return function wrapped(evt) {
    if (evt.target !== orientation) {
      defineValue(evt, 'target', orientation);
    }
    if (evt.currentTarget !== orientation) {
      defineValue(evt, 'currentTarget', orientation);
    }
    if (evt.type !== 'change') {
      defineValue(evt, 'type', 'change');
    }
    cb(evt);
  };
}

function getLock() {
  var err = 'lockOrientation() is not available on this device.';
  var delegateFn;
  var screen = window.screen;
  if (typeof screen.msLockOrientation == 'function') {
    delegateFn = screen.msLockOrientation.bind(screen);
  } else if (typeof screen.mozLockOrientation == 'function') {
    delegateFn = screen.mozLockOrientation.bind(screen);
  } else {
    delegateFn = function () {
      return false;
    };
  }

  return function lock(lockType) {
    var Promise = window.Promise;
    if (delegateFn(lockType)) {
      return Promise.resolve(lockType);
    } else {
      return Promise.reject(new Error(err));
    }
  };
}

function getUnlock() {
  var screen = window.screen;
  return (
    (screen.orientation &&
      screen.orientation.unlock.bind(screen.orientation)) ||
    (screen.msUnlockOrientation && screen.msUnlockOrientation.bind(screen)) ||
    (screen.mozUnlockOrientation && screen.mozUnlockOrientation.bind(screen)) ||
    function unlock() {
      return;
    }
  );
}

function findDelegate(orientation) {
  var events = [
    'orientationchange',
    'mozorientationchange',
    'msorientationchange',
  ];

  for (var i = 0; i < events.length; i++) {
    if (screen['on' + events[i]] === null) {
      return {
        delegate: screen,
        event: events[i],
      };
    }
  }

  if (typeof window.onorientationchange != 'undefined') {
    return {
      delegate: window,
      event: 'orientationchange',
    };
  }

  return {
    delegate: createOwnDelegate(orientation),
    event: 'change',
  };
}

function getOrientationChangeEvent(name, props) {
  var orientationChangeEvt;

  try {
    orientationChangeEvt = new Event(name, props);
  } catch (e) {
    orientationChangeEvt = { type: 'change' };
  }
  return orientationChangeEvt;
}

function createOwnDelegate(orientation) {
  var ownDelegate = Object.create({
    addEventListener: function addEventListener(evt, cb) {
      if (!this.listeners[evt]) {
        this.listeners[evt] = [];
      }
      if (this.listeners[evt].indexOf(cb) === -1) {
        this.listeners[evt].push(cb);
      }
    },
    dispatchEvent: function dispatchEvent(evt) {
      if (!this.listeners[evt.type]) {
        return;
      }
      this.listeners[evt.type].forEach(function (fn) {
        fn(evt);
      });
      if (typeof orientation.onchange == 'function') {
        orientation.onchange(evt);
      }
    },
    removeEventListener: function removeEventListener(evt, cb) {
      if (!this.listeners[evt]) {
        return;
      }
      var idx = this.listeners[evt].indexOf(cb);
      if (idx > -1) {
        this.listeners[evt].splice(idx, 1);
      }
    },
  });

  ownDelegate.listeners = {};

  var mql = getMql();

  if (mql && typeof mql.matches === 'boolean') {
    mql.addListener(function () {
      ownDelegate.dispatchEvent(getOrientationChangeEvent('change'));
    });
  }

  return ownDelegate;
}

function getMql() {
  if (typeof window.matchMedia != 'function') {
    return {};
  }
  return window.matchMedia('(orientation: landscape)');
}

function defineValue(obj, key, val) {
  Object.defineProperty(obj, key, {
    value: val,
  });
}
