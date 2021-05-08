/* ### Async Tutorial ###
Here are some basic examples of using async programming in Node/JS
You should comment out the section you're not using if you want to
see more clearly the order of the callbacks

One of the main things to remember - as soon as one function in a chain is asynchronous, the 
whole callback chain must be asynchronous. you can't get a value back to a synchronous
function from an asynchronous function. You have to process the value in the callback/promise.
*/

const util = require('util'); // required for promisify
const fs = require('fs'); // file system calls

/* ### Callbacks ###
The most basic form of asynchronous programming is using a callback
setTimeout is an example
*/

let timer = function(){
    setTimeout(function(){console.log('Timer callback return success')},2000);
}

console.log('Starting');
timer();
/* timer message will come back after 2 seconds
if you want to do a next action, you can put it in the setTimeout callback
function. You can keep cascading these ad-infinitum to get 'callback hell'
*/

/* ### Promises ###
Promises are a wrapper around a function that return a resolve (success)
or reject (failure) message once complete. The actual function return is
a promise object, that will start as 'pending'. Two new functions, .then
and .catch are executed on resolve or reject.
*/

let promiseTimer = function() {
    return new Promise(function (resolve, reject) {
      setTimeout(function(){resolve('Timer promise resolved')},2000);
      error_condition = false; //faking it for the example
      if (error_condition) {reject('Something happened')}; 
    })
}

console.log('Starting promise');
let promiseReturn = promiseTimer()
    .then(promiseResolve => {console.log('Promise return: '+promiseResolve)}) // next action if it worked
    .catch(err => {console.log(err)}) // next action if it failed
// do something else //

console.log(promiseReturn); 
// This will immediately return 'pending' because it's a promise that's returned
// then 2 seconds later the promise will resolve

/* ### async/await ###
One further wrapper on top of promises, allows for simple linear looking
flow in the code: 
do something
await
do next thing
await waits until the promise is resolved - it must therefore sit inside an async
function otherwise the whole system will be blocked.
*/

// top level function
asyncMain = async function() {
    console.log('starting await');
    await promiseTimer(); // same function as above that returns a promise
    console.log('await complete');
}

asyncMain();
console.log('now im doing something else')

/* ### Applied to File System Commands ###
File system calls are classic things you want to do asynchronously, so here are some further
examples

The default function uses a callback just like setTimeout()
*/
myFileDirectory = '/Users/patrickmclean/odrive/Google Drive - Main/Development/iBrowser/iBrowser';
console.log('starting callback readdir')
fs.readdir(myFileDirectory,function(err,data){
    if (err) {console.log(err)}; // or throw err
    console.log('Basic readdir callback');
    console.log(data); // should print out content of directory
});
console.log('follow callback read')

/* ### Promisify ###
There is a function in util called promisify that wraps any function in a promise
It is essentially the same structure as the function written above but simpler
*/

readDir = util.promisify(fs.readdir);

// Now we can use it with .then

console.log('starting promisified read')
readDir(myFileDirectory)
    .then(result => {console.log('Promisified readdir callback :'+result)})
console.log('follow promisified read');

// Or with await

asyncMain2 = async function() {
    console.log('starting await for read');
    await readDir(myFileDirectory); // same function as above that returns a promise
    console.log('await complete for read');
}

asyncMain2();

/* ### asyncLimit ###
For more advanced work we may want to limit the number of async calls 
running in parallel. A great function called asyncLimit does this.
There's a nice function wrapping pattern here too

Full example remains to be fleshed out
*/

//const readDir = asyncLimit(util.promisify(fs.readdir),3);

/* ### pubsub ###
A different approach to managing aync coordination in a more 
complex system is pub/sub. You use one layer callbacks, and in 
the callback you publish an event stating the action is complete.
You then have a separate subscriber that reacts to that message
and sets off whatever next action you might require. Typically this
will require you also maintain a state machine so you know what's
meant to happen in a given situation. This is used by SpanishPhrases
as an example.
*/


