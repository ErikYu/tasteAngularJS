## Cover
1. digest cycle and dirty-check, including $watch, $digest, $apply
2. Scope inheritance - the mechanism
3. Efficient dirty-checking for collections - arrays and objects
4. Event system - $on, $emit, $broadcast

## $watch和$digest
## Checking for dirty values
1. Attaching value to scope does not degrade performance. Add more watcheres does degrade performance. Because ng will interate $$watchers instead of scope.
2. During every $digest cycle, ***all*** watch function will be called.

## Initializing Watch Values
