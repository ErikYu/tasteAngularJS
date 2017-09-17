## Cover
1. digest cycle and dirty-check, including $watch, $digest, $apply
2. Scope inheritance - the mechanism
3. Efficient dirty-checking for collections - arrays and objects
4. Event system - $on, $emit, $broadcast

# $watch和$digest
## Checking for dirty values
1. Attaching value to scope does not degrade performance. Add more watcheres does degrade performance. Because ng will interate $$watchers instead of scope.
2. During every $digest cycle, ***all*** watch function will be called.

## Initializing Watch Values
## Getting Noitfied of Digests
1. Angularjs will look at the return value of watchFn even when there is no listenerFn

## Keep Digest While Dirty
1. Watchers should be idempotence
2. Digest now runs all watchers at least once. In the first pass, any watch that is changed will be marked as dirty.

## Short Circuiting When Last Watch is Clean
## Value - Based Dirty Checking
1. Not just based on referance, but on value

## NaNs
1. NaN !== NaN. Need special deal.

## Handle Exceptions
1. Errors in watchFn and listenerFn should not stop the code.
2. Do a `try{} catch(){}`

## Destroying a watch
1. Remove a watcher by a removal function;
2. Remove a watcher during a digest cycle: unshift instead of push;
3. Remove a watcher in another watcher;
3. Remove several watches in one watch;

# Scope Methods
## $eval - Evaluating the Code in the Context of A Scope

## $apply - Integrating External Code With the Digest Cycle
1. The big idea of $apply is that we can execute some code that isn’t aware of Angular. That code may still change things on the scope, and as long as we wrap the code in $apply we can be sure that any watches on the scope will pick up on those changes. When people talk about integrating code to the “Angular lifecycle” using $apply, this is essentially what they mean.

## $evalAsync - deferred execution
1. Ways to defer the execution of a function:
    - setTimeOut() 
    - $timeout service, to integrates the funtion to the digest cycle by $apply()
    - $evalAsync, take a function as argument. But still in the current digest cycle
2. Everytime you want to execute a funtion outside the execute context of another function, #evalAsync shall be used

## Scheduling $evalAsync from Watch Functions
1. Schedule a $evalAsync() in a watch function which is not advised but possible;
2. In digest(), while dirty and **$$asyncQueue.length**, the digestInce() shoulb be executed;

## Scope Phases
1. $evalAsync() does schedule a digest. That means whenever you calls a $evalAsync, the code you are deferring is going to be invoked very soon instead of waiting something else to trigger a digest;
2. Add phases: $digest, $apply, null;
3. If you call $evalAsync when a digest is already running, your function will be evaluated during 
that digest. If there is no digest running, one is started.

## $applyAsync - Coalescing(合并) $apply invocations
1. It is useful when you need to do $apply(), but know you'll be doing it several times in a shory period of time; 

## $$postDigest - Running code after a digest
1. Execute all the function in $$postDigestQueue in the next digest;
2. Only execute once, like the $evalAsync.
3. As the postDigest runs after the digest, so if you make changes in $$postDigest, the dirty-checking mechanism won't pick it up. $digest should be called manually;

## Handle Exceptions
1. 

## evalAsync applyAsync
1. $evalAsync会在当前digest循环中执行
2. $applyAsync 让apply()晚一些运行，例如在Angular中发起AJAX请求一般通过$http服务，在得到来自后端的响应之后，它也会触发一轮digest循环。这也就是说，如果同时发起了10个AJAX请求，那么最终会触发10轮digest循环。而如果这10个AJAX请求并不是那么耗时，它们返回的速度很快，这就会造成10轮digest循环依次被触发，而很显然没有必要这么密集地触发digest循环。