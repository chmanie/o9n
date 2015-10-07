'use strict';

if (typeof window != 'object') {
  throw new Error('Oh no! o9n needs to run in a browser');
}

var screen = window.screen;

var Promise = window.Promise || require('a-promise');

var orientation;

// W3C spec implementation
if (typeof window.ScreenOrientation === 'function' &&
  screen.orientation instanceof ScreenOrientation &&
  typeof screen.orientation.addEventListener == 'function' &&
  screen.orientation.onchange === null &&
  typeof screen.orientation.type === 'string') {
  orientation = screen.orientation;
} else {
  orientation = createOrientation();
}

module.exports = {
  orientation: orientation,
  install: function install () {
    if (typeof window.ScreenOrientation === 'function' &&
      screen.orientation instanceof ScreenOrientation) {
      return screen.orientation;
    }
    window.screen.orientation = orientation;
    return orientation;
  }
};

function createOrientation () {

  var orientationMap = {
    '90': 'landscape-primary',
    '-90': 'landscape-secondary',
    '0': 'portrait-primary',
    '180': 'portrait-secondary'
  };

  var found = findDelegate();

  var or = Object.create({
    addEventListener: delegate('addEventListener', found.delegate, found.event),
    dispatchEvent: delegate('dispatchEvent', found.delegate, found.event),
    removeEventListener: delegate('removeEventListener', found.delegate, found.event),
    lock: getLock(),
    unlock: getUnlock()
  });

  Object.defineProperties(or, {
    onchange: {
      get: function () {
        return found.delegate['on' + found.event];
      },
      set: function (cb) {
        found.delegate['on' + found.event] = cb;
      }
    },
    type: {
      get: function () {
        return screen.msOrientation || screen.mozOrientation ||
          orientationMap[window.orientation + ''] ||
          (getMql().matches ? 'landscape-primary' : 'portrait-primary');
      }
    },
    angle: {
      value: 0
    }
  });

  return or;

}


function delegate (name, fn, event) {
  return function () {
    var args = Array.prototype.slice.call(arguments);
    var actualEvent = args[0].type ? args[0].type : args[0];
    if (actualEvent !== 'change') {
      return;
    }
    if (args[0].type) {
      args[0] = getOrientationChangeEvent(event, args[0]);
    } else {
      args[0] = event;
    }
    return fn[name].apply(fn, args);
  };
}

function getLock () {

  var err = 'lockOrientation() is not available on this device.';

  var delegateFn;
  if (typeof screen.msLockOrientation == 'function') {
    delegateFn = screen.msLockOrientation.bind(screen);
  } else if (typeof screen.mozLockOrientation == 'function') {
    delegateFn = screen.mozLockOrientation.bind(screen);
  } else {
    delegateFn = function () { return false; };
  }

  return function lock(lockType) {

    if (delegateFn(lockType)) {
      return Promise.resolve(lockType);
    } else {
      return Promise.reject(new Error(err));
    }
  };
}

function getUnlock () {
  return screen.orientation && screen.orientation.unlock.bind(screen.orientation) ||
    screen.msUnlockOrientation && screen.msUnlockOrientation.bind(screen) ||
    screen.mozUnlockOrientation && screen.mozUnlockOrientation.bind(screen) ||
    function unlock () { return; };
}

function findDelegate () {
  var events = ['orientationchange', 'mozorientationchange', 'msorientationchange'];

  for (var i = 0; i < events.length; i++) {
    if (screen['on' + events[i]] === null) {
      return {
        delegate: screen,
        event: events[i]
      };
    }
  }

  if (window.onorientationchange === null) {
    return {
      delegate: window,
      event: 'orientationchange'
    };
  }

  return {
    delegate: ownDelegate(),
    event: 'change'
  };

}

function getOrientationChangeEvent (name, props) {
  var orientationChangeEvt;

  try {
    orientationChangeEvt = new Event(name, props);
  } catch (e) {
    orientationChangeEvt = { type: 'change' };
  }
  return orientationChangeEvt;
}

function ownDelegate () {

  var or = Object.create({
    addEventListener: function addEventListener (evt, cb) {
      if (!this.listeners[evt]) {
        this.listeners[evt] = [];
      }
      this.listeners[evt].push(cb);
    },
    dispatchEvent: function dispatchEvent (evt) {
      if (!this.listeners[evt.type]) {
        return;
      }
      this.listeners[evt.type].forEach(function (fn) {
        fn(evt);
      });
      if (typeof this.onchange == 'function') {
        this.onchange(evt);
      }
    },
    removeEventListener: function removeEventListener (evt, cb) {
      if (!this.listeners[evt]) {
        return;
      }
      var idx = this.listeners[evt].indexOf(cb);
      if (idx > -1) {
        this.listeners[evt].splice(idx, 1);
      }
    }
  });

  or.listeners = {};
  or.onchange = null;

  var mql = getMql();

  if (mql && typeof mql.matches === 'boolean') {
    mql.addListener(function() {
      or.dispatchEvent({ type: 'change' });
    });
  }

  return or;

}

function getMql () {
  if (typeof window.matchMedia != 'function') {
    return {};
  }
  return window.matchMedia('(orientation: landscape)');
}
