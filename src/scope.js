'use strict';
var _ = require('lodash');

/**
 * 构造函数
 */
function Scope() {
    this.$$watchers = [];                   // 所有的watcher组成的数组
    this.$$lastDirtyWatch = null;           // 一次digestOnce循环的最有一个脏watcher
    this.$$asyncQueue = [];                 // 异步队列
    this.$$applyAsyncQueue = [];            // 
    this.$$phase = null;
}

// 初始化值
function initWatchVal() {}

/**
 * $watch方法：观测数据 
 */
Scope.prototype.$watch = function(watchFn, listenFn, valueEq) {
    var self = this;
    // watcher：新建的watcher
    var watcher = {
        watchFn: watchFn,
        listenFn: listenFn || function() {},
        valueEq: !!valueEq,   // undefined转为false
        last: initWatchVal
    };
    // $$watchers：所有的watcher组成的数组
    this.$$watchers.unshift(watcher);
    // 每次watch新值都要将lastDirtyWatch置为null
    this.$$lastDirtyWatch = null;

    // 调用自己销毁该watcher
    return function() {
        var index = self.$$watchers.indexOf(watcher);
        if (index !== -1) {
            self.$$watchers.splice(index, 1);
            // 在一个watcher中删除另一个watcher时增加
            self.$$lastDirtyWatch = null;
        }
    };
};

/**
 * $digestOnce：执行变更
 */
Scope.prototype.$digestOnce = function() {
    var self = this;
    var newValue, oldValue, dirty;
    // 对每个watcher检查新旧值，如果不一样就调用listenerFn
    _.forEachRight(this.$$watchers, function(watcher) {
        // watchFn中的错误信息log，并继续
        try {
            if(watcher) {
                newValue = watcher.watchFn(self);
                oldValue = watcher.last;
                if(!self.$$areEqual(newValue, oldValue, watcher.valueEq)) {
                    self.$$lastDirtyWatch = watcher;
                    // 将新值赋给last，供下次改变调用
                    watcher.last = watcher.valueEq ? _.cloneDeep(newValue) : newValue;
                    watcher.listenFn(newValue, oldValue===initWatchVal?newValue:oldValue, self);
                    dirty = true;
                } else if(self.$$lastDirtyWatch === watcher) {
                    // 当这个watcher此次循环中是clean的，且是上次循环中的最后一个dirty watch
                    return false;
                }
            }
        } catch (e) {
            console.log(e);
        }
    });
    return dirty;
};

/**
 * 正儿八经的$digest
 */
Scope.prototype.$digest = function() {
    var dirty;
    var TTL = 10;
    // 开始digest循环给phase赋值‘digest’
    this.$beginPhase('$digest');
    // 开始digest循环初始化$$lastDirtyWatch
    this.$$lastDirtyWatch = null;
    // 先执行再判断
    do {
        // 如果异步队列中有值，将第一个元素删除并返回第一个值
        // todo: 为什么异步执行
        while (this.$$asyncQueue.length > 0) {
            var asyncTask = this.$$asyncQueue.shift();
            asyncTask.scope.$eval(asyncTask.func);
        }
        dirty = this.$digestOnce();
        // 10次循环后抛出错误
        if((dirty || this.$$asyncQueue.length) && !(TTL--)){
            this.$clearPhase();
            throw('over 10 times digest cycle');
        }
    } while (dirty || this.$$asyncQueue.length);
    this.$clearPhase();
};

/**
 * 比较两个值是否相同
 * valueEq是如果是比较数组或对象时，要传true
 */
Scope.prototype.$$areEqual = function(newValue, oldValue, valueEq) {
    if (valueEq) {
        return _.isEqual(newValue, oldValue);
    } else {
        // 两者相等或者都是NaN时都返回true
        return newValue === oldValue ||
        (typeof newValue === 'number' && typeof oldValue === 'number' && isNaN(newValue) && isNaN(oldValue));
    }
};

/**
 * $eval方法，再scope的上下文上执行函数表达式
 */
Scope.prototype.$eval = function(func, locals) {
    return func(this, locals);
};

/**
 * $apply方法：用来把代码推到Ng的生命周期
 * 使用$eval方法执行函数表达式
 * 最后执行digest循环
 */
Scope.prototype.$apply = function(func) {
    try {
        this.$beginPhase('$apply');
        return this.$eval(func);
    } finally {
        this.$clearPhase();
        // 即使try中语句报错，也要执行digest循环
        this.$digest();
    }
};

/**
 * $evalAsync方法：推迟执行函数
 */
Scope.prototype.$evalAsync = function(func) {
    // digest
    var self = this;
    // 不在digest循环中且异步队列中没有元素
    if (!this.$$phase && !this.$$asyncQueue.length) {
        setTimeout(function() {
            if (self.$$asyncQueue.length) {
                self.$digest();
            }
        }, 0);
    }
    // 将需要推迟执行的方法推到异步队列
    this.$$asyncQueue.push({scope: this, func: func});
};

/**
 * 新建和清除一个scope的phase状态值
 */
Scope.prototype.$beginPhase = function(phase) {
    if (this.$$phase) {
        throw this.$$phase + 'is in progess';
    }
    this.$$phase = phase;
};
Scope.prototype.$clearPhase = function() {
    this.$$phase = null;
};

Scope.prototype.$applyAsync = function() {

};

module.exports = Scope;