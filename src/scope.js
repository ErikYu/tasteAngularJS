'use strict';
var _ = require('lodash');
function Scope() {
    this.$$watchers = [];
}
Scope.prototype.$watch = function(watchFn, listenFn) {
    var watcher = {
        watchFn: watchFn,
        listenFn: listenFn
    };
    this.$$watchers.push(watcher);
};
Scope.prototype.$digest = function() {
    _.forEach(this.$$watchers, function(watcher) {
        watcher.listenFn();
    });
};
module.exports = Scope;