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
    