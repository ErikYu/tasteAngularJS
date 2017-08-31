'use strict';
var _ = require('lodash');

/**
 * 构造函数
 */
function Scope() {
    this.$$watchers = [];
}

// 初始化值
function initWatchVal() {}

/**
 * $watch方法：观测数据 
 */
Scope.prototype.$watch = function(watchFn, listenFn) {
    // watcher：新建的watcher
    var watcher = {
        watchFn: watchFn,
        listenFn: listenFn,
        last: initWatchVal
    };
    // $$watchers：所有的watcher组成的数组
    this.$$watchers.push(watcher);
};

/**
 * $digest：执行变更
 */
Scope.prototype.$digest = function() {
    var self = this;
    var newValue, oldValue;
    // 对每个watcher检查新旧值
    _.forEach(this.$$watchers, function(watcher) {
        newValue = watcher.watchFn(self);
        oldValue = watcher.last;
        if(newValue !== oldValue) {
            watcher.last = newValue;
            watcher.listenFn(newValue, oldValue===initWatchVal?newValue:oldValue, self);
        }
    });
};
module.exports = Scope;