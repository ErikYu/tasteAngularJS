'use strict';

var Scope = require('../src/scope');

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
});