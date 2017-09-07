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

    it('当所有的watch都是clean时执行evalAsync', function() {
        scope.aValue = 'a';
        scope.asyncTimes = 0;

        scope.$watch(
            function(scope) { 
                if(scope.asyncTimes < 2) {
                    scope.$evalAsync(function(scope) {
                        scope.asyncTimes++;                        
                    });
                }
                return scope.aValue;
            },
            function(newVal, oldVal, scope) {}
        );

        scope.$digest();
        expect(scope.asyncTimes).toBe(2);
    });

    it('evalAsync在watcher中超过10次抛出', function() {
        scope.aValue = 'a';
        scope.counter = 0;
        scope.$watch(
            function(scope) {
                scope.$evalAsync(function(scope) {
                    scope.counter++;
                });
                return scope.aValue;
            }
        );
        expect(function(){scope.$digest();}).toThrow();
    });

    it('在watchFn中catch到错误并继续', function() {
        scope.aValue = 'a';
        scope.counter = 0;

        scope.$watch(
            function(scope) {
                throw ('watch error');
            },
            function(newVal, oldVal, scope) {}
        );
        scope.$watch(
            function(scope) {
                return scope.aValue;
            },
            function(newVal, oldVal, scope) {
                scope.counter++;
            }
        );

        scope.$digest();
        expect(scope.counter).toBe(1);
    });

    it('在listenerFn中catch到错误并能继续', function() {
        scope.aValue = 'a';
        scope.counter = 0;

        scope.$watch(
            function(scope) {return scope.aValue;},
            function(newVal, oldVal, scope) {
                throw 'listener error';
            }
        );

        scope.$watch(
            function(scope) {return scope.aValue;},
            function(newVal, oldVal, scope) {
                scope.counter++;
            }
        );
        scope.$digest();
        expect(scope.counter).toBe(1);
    });

    it('销毁一个watch', function() {
        scope.aValue = 'abc';
        scope.counter = 0;

        var destroyWatch = scope.$watch(
            function(scope) { return scope.aValue; },
            function(newVal, oldVal, scope) {
                scope.counter++;
            }
        );

        scope.$digest();
        expect(scope.counter).toBe(1);

        scope.aValue = 'def';
        scope.$digest();
        expect(scope.counter).toBe(2);

        scope.aValue = 'ghi';
        destroyWatch();          // 调用销毁方法
        scope.$digest();
        expect(scope.counter).toBe(2);
    });
    
    it('在digest循环中销毁一个watch', function() {
        scope.aValue = 'abc';
        scope.watchCall = [];

        scope.$watch(
            function(scope) { 
                scope.watchCall.push('first');
                return scope.aValue;
            }
        );

        var destroyWatch = scope.$watch(
            function(scope) {
                scope.watchCall.push('second');
                destroyWatch();
                // return scope.aValue;
            }
        );

        scope.$watch(
            function(scope) {
                scope.watchCall.push('third');
                return scope.aValue;
            }
        );

        scope.$digest();
        expect(scope.watchCall).toEqual(['first', 'second', 'third', 'first', 'third']);
    });

    it('允许一个watch删除另一个watch', function() {
        scope.aValue = 'abc';
        scope.counter = 0;

        scope.$watch(
            function(scope) { return scope.aValue; },
            function(newVal, oldVal, scope) {
                destroyWatch();
            }
        );

        var destroyWatch = scope.$watch(
            function(scope) { return scope.aValue; },
            function(newVal, oldVal, scope) {}
        );

        scope.$watch(
            function(scope) { return scope.aValue; },
            function(newVal, oldVal, scope) {
                scope.counter++;
            }
        );

        expect(scope.$$watchers.length).toBe(3);
        scope.$digest();
        expect(scope.counter).toBe(1);
    });

    it('在一个watch中移除多个watch', function() {
        scope.aValue = 'abc';
        scope.counter = 0;
        var destroyWatch_1 = scope.$watch(
            function(scope) {
                destroyWatch_1();
                destroyWatch_2();
            }
        );

        var destroyWatch_2 = scope.$watch(
            function(scope) { return scope.aValue; },
            function(newVal, oldVal, scope) {
                scope.counter++;
            }
        );

        scope.$digest();
        expect(scope.counter).toBe(0);
    });

    it('$$phase字段显示状态信息', function() {
        scope.aValue = [1, 2, 3];
        scope.phaseInWatchFunc = undefined;
        scope.phaseInListenerFunc = undefined;
        scope.phaseInApplyFunc = undefined;

        scope.$watch(
            function(scope) {
                scope.phaseInWatchFunc = scope.$$phase;
                return scope.aValue;
            },
            function(newVal, oldVal, scope) {
                scope.phaseInListenerFunc = scope.$$phase;
            }
        );

        scope.$apply(function(scope){
            scope.phaseInApplyFunc = scope.$$phase;
        });
        expect(scope.phaseInWatchFunc).toBe('$digest');
        expect(scope.phaseInListenerFunc).toBe('$digest');
        expect(scope.phaseInApplyFunc).toBe('$apply');
    });
});

describe('evalAsync', function() {
    var scope;
    beforeEach(function() {
        scope = new Scope();
    });

    it('通过$evalAsync安排一个digest循环', function(done) {
        scope.aValue = 'abc';
        scope.counter = 0;

        scope.$watch(
            function(scope) { return scope.aValue; },
            function(newVal, oldVal, scope) {
                scope.counter++;
            }
        );

        scope.$evalAsync(function(){});
        expect(scope.counter).toBe(0);
        setTimeout(function() {
            expect(scope.counter).toBe(1);
            done();
        }, 50);
    });
});

describe('applyAsync', function() {
    var scope;
    beforeEach(function() {
        scope = new Scope();
    });
    it('通过$applyAsync异步执行apply', function(done) {
        scope.aValue = 'abc';
        scope.counter = 0;

        scope.$watch(
            function(scope) { return scope.aValue; },
            function(newVal, oldVal, scope) {
                scope.counter++;
            }
        );

        scope.$digest();
        expect(scope.counter).toBe(1);
        scope.$applyAsync(function(){
            scope.aValue = 'jhk';
        });
        expect(scope.counter).toBe(1);
        setTimeout(function(){
            expect(scope.counter).toBe(2);
            done();
        }, 50);
    });

    it('执行applyAsync调用一个digest', function(done) {
        scope.counter = 0;

        scope.$watch(
            function(scope) {
                scope.counter++;
                return scope.aValue;
            },
            function(newVal, oldVal, scope) {}
        );

        scope.$applyAsync(function(scope) {
            scope.aValue = 'abc';
        });
        scope.$applyAsync(function(scope) {
            scope.aValue = 'def';
        });
        expect(scope.counter).toBe(0);

        setTimeout(function() {
            expect(scope.counter).toBe(2);
            done();
        });
    });

    it('如果先digest循环取消$applyAsync', function(done) {
        scope.counter = 0;

        scope.$watch(
            function(scope) {
                scope.counter++;
                return scope.aValue;
            },
            function(newVal, oldVal, scope) {}
        );

        scope.$applyAsync(function(scope) {
            scope.aValue = 'abc';
        });
        scope.$applyAsync(function(scope) {
            scope.aValue = 'def';
        });
        scope.$digest();
        expect(scope.counter).toBe(2);
        expect(scope.aValue).toBe('def');

        setTimeout(function() {
            expect(scope.counter).toBe(2);
            done();
        }, 50);
    });
});
