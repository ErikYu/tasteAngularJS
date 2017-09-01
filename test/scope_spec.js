'use strict';

var Scope = require('../src/scope');
var _ = require('lodash');

describe('Scope', function () {
    it('可以被创建和使用', function () {
        var scope = new Scope();
        scope.a = 1;
        expect(scope.a).toBe(1);
    });
});

describe('digest', function() {
    var scope;

    beforeEach(function() {
        scope = new Scope();
    });

    it('第一次$digest循环 调用listenFunc', function() {
        var watchFn = function() {return 'wat';};
        var listenerFn = jasmine.createSpy();
        scope.$watch(watchFn, listenerFn);

        scope.$digest();

        expect(listenerFn).toHaveBeenCalled();
    });

    it('以scope为参数调用$watch', function() {
        var watchFn = jasmine.createSpy();
        var listenerFn = function() {};
        scope.$watch(watchFn, listenerFn);
        scope.$digest();

        expect(watchFn).toHaveBeenCalledWith(scope);
    });

    it('当watch的值发生变化时调用listenerFn', function() {
        scope.someVal = 'a';
        scope.counter = 0;

        scope.$watch(function(scope) {return scope.someVal;}, function(newVal, oldVal, scope) {
            scope.counter++;
        });
        expect(scope.counter).toBe(0);

        scope.$digest();
        expect(scope.counter).toBe(1);

        scope.$digest();
        expect(scope.counter).toBe(1);

        scope.someVal = 'b';
        expect(scope.counter).toBe(1);
        scope.$digest();
        expect(scope.counter).toBe(2);
    });

    it('当value初始化为undefined时触发listenerFn', function() {
        scope.counter = 0;
        scope.$watch(function(scope) {return scope.someVal;}, function(newVal, oldVal, scope) {
            scope.counter++;
        });
        scope.$digest();
        expect(scope.counter).toBe(1);
    });

    it('may have the watchers that omit the listenerFn', function() {
        var watchFn = jasmine.createSpy().and.returnValue('something');
        scope.$watch(watchFn);

        scope.$digest();

        expect(watchFn).toHaveBeenCalled();
    });

    it('在同一个digest循环中触发链式watcher', function() {
        scope.name = 'jane';
        scope.$watch(function(scope) {return scope.nameUpper;}, function(newVal, oldVal, scope) {
            if (newVal) {
                scope.initial = newVal.substring(0, 1);
            }
        });
        scope.$watch(function(scope) {return scope.name;}, function(newVal, oldVal, scope) {
            if (newVal) {
                scope.nameUpper = newVal.toUpperCase();
            }
        });
        scope.$digest();
        expect(scope.initial).toBe('J');
        expect(scope.nameUpper).toBe('JANE');

        scope.name = 'bob';
        scope.$digest();
        expect(scope.nameUpper).toBe('BOB');
        expect(scope.initial).toBe('B');
    });

    it('throw when 10 digest', function() {
        scope.counterA = 0;
        scope.counterB = 0;
        scope.$watch(function(scope) {return scope.counterA;}, function(newVal, oldVal, scope) {
            scope.counterB++;
        });
        scope.$watch(function(scope) {return scope.counterB;}, function(newVal, oldVal, scope) {
            scope.counterA++;
        });
        expect(function() {scope.$digest();}).toThrow();
    });

    it('get out when last watcher is clean', function() {
        scope.array = _.range(100);
        var counter = 0;                   // counter watcher执行计数
        _.times(100, function(i) {
            scope.$watch(
                function(scope) {
                    counter++;
                    return scope.array[i];
                }, 
                function(newVal, oldVal, scope) {}
            );
        });
        scope.$digest();
        expect(counter).toBe(200);
        scope.array[0] = 110;
        scope.$digest();
        expect(counter).toBe(301);
    });

    it('does not end dirgest so that new watches can run', function() {
        scope.aValue = 'a';
        scope.counter = 0;

        scope.$watch(
            function(scope) {return scope.aValue;},
            function(newVal, oldVal, scope) {
                scope.$watch(
                    function(scope) {return scope.aValue;},
                    function(newVal, oldVal, scope) {
                        scope.counter++;
                    }
                );
            }
        );
        scope.$digest();
        expect(scope.counter).toBe(1);
    });

    it('基于数据进行比较，而不是reference', function() {
        scope.aValue = [1, 2, 3];
        scope.counter = 0;
        scope.$watch(
            function(scope) {return scope.aValue;},
            function(newVal, oldVal, scope) {
                scope.counter++;
            },
            true
        );
        scope.$digest();
        expect(scope.counter).toBe(1);

        scope.aValue.push(4);
        scope.$digest();
        expect(scope.counter).toBe(2);
    });

    it('NaN不等于自身，需要特殊处理', function() {
        scope.num = 0/0;
        scope.counter = 0;
        scope.$watch(
            function(scope) {return scope.num;},
            function(newVal, oldVal, scope) {
                scope.counter++;
            }
        );
        scope.$digest();
        expect(scope.counter).toBe(1);
        scope.$digest();
        expect(scope.counter).toBe(1);
    });

    it('执行eval方法并返回值', function() {
        scope.aValue = 42;
        var result = scope.$eval(function(scope) {
            return scope.aValue;
        });

        expect(result).toBe(42);
    });

    it('执行eval方法并传参', function() {
        scope.aValue = 44;
        var result = scope.$eval(function(scope, arg) {
            return scope.aValue * arg;
        }, 2);

        expect(result).toBe(88);
    });

    it('', function() {
        scope.aValue = 43;
        scope.counter = 0;

        scope.$watch(
            function(scope) { return scope.aValue; },
            function(newVal, oldVal, scope) {
                scope.counter++;
            }
        );

        scope.$digest();
        expect(scope.counter).toBe(1);

        scope.$apply(function(scope) {
            scope.aValue = 42;
        });
        expect(scope.counter).toBe(2);
    });

    it('在同一个digest循环中执行evalAsync方法，推迟执行', function() {
        scope.aValue = [1, 2, 3];
        scope.asyncEvaluated = false;
        scope.asyncEvaluatedImmediately = false;
        scope.$watch(
            function (scope) { return scope.aValue; },
            function (newValue, oldValue, scope) {
                scope.$evalAsync( function (scope) {
                    scope.asyncEvaluated = true ;
                });
                scope.asyncEvaluatedImmediately = scope.asyncEvaluated;
            }
        );
        scope.$digest();
        expect(scope.asyncEvaluated).toBe( true );
        expect(scope.asyncEvaluatedImmediately).toBe( false );
    });

    it('执行被watchFn增加的evalAsync方法', function() {
        scope.aValue = 'a';
        scope.asyncEvaluated = false;
        scope.asyncEvaluatedImmediately = false;
        scope.$watch(
            function(scope) {
                if (!scope.asyncEvaluated) {
                    scope.$evalAsync(function(){
                        scope.asyncEvaluated = true;
                    });
                }
                return scope.aValue;
            },
            function (newVal, oldVal, scope) {

            }
        );
        scope.$digest();
        expect(scope.asyncEvaluated).toBe(true);
    });
});