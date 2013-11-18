var cookieparser = require("../js/cookieparser.js");
var Benchmark = require("benchmark");
var cookie = require("cookie");
var assert = require("assert");
var l;
var now;
var cookieStr;
var count = 450000;

cookieStr = 'a=b%20cd; longkey=somethingElseEntirely%20WithSpacesInside; anotherLongKeyString=something:somethingElse:yetAnotherDifferentThing:andFinallyThis; g=another%20spacey';

assert.deepEqual(cookie.parse(cookieStr),cookieparser.parse(cookieStr));

l = 50000;

while(l--) {
    cookie.parse(cookieStr);
    cookieparser.parse(cookieStr);
}

function suite(cookieStr) {
    console.log(cookieStr);
    var suite = new Benchmark.Suite();
    suite.add("cookieparser", function() {
        cookieparser.parse(cookieStr);
    })
    .add("cookie", function(){
        cookie.parse(cookieStr);
    }).on("cycle", function(e){
        console.log("" + e.target);
    }).run();
}


function test1() {
    suite('a=b%20cd; longkey=somethingElseEntirely%20WithSpacesInside; anotherLongKeyString=something:somethingElse:yetAnotherDifferentThing:andFinallyThis; g=another%20spacey');
}

function test2() {
    suite('PHPSESSID=abcdefghijklmnopqrstuvyx');
}

function test3() {
    suite('a=b; c=d; e=f; g=h; k=j; m =n; b = q;    a = c;  r = l');
}

test1(); test2(); test3();
