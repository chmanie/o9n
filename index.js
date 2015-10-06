(function (root, factory) {
  'use strict';
  if (typeof define == 'function' && define.amd) {
    // AMD.
    define([], factory);
  } else if (typeof module == 'object' && module.exports) {
    // CommonJS
    module.exports = factory();
  } else {
    // Browser globals (root is window)
    root.returnExports = factory();
  }
}(this, function () {
  'use strict';
  // Just return a value to define the module export.
  // This example returns an object, but the module
  // can return a function as the exported value.
  return {};
}));
