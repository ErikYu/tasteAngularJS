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
});