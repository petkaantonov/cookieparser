var cookieparser = require("../js/cookieparser.js");
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


function test1() {
    console.log("test1");
    var cookieStr ='a=b%20cd; longkey=somethingElseEntirely%20WithSpacesInside; anotherLongKeyString=something:somethingElse:yetAnotherDifferentThing:andFinallyThis; g=another%20spacey';

    now = Date.now();

    l = count;
    while(l--) {
        cookieparser.parse(cookieStr);
    }

    console.log("cookieparser", Date.now() - now, "ms");


    now = Date.now();

    l = count;
    while(l--) {
        cookie.parse(cookieStr);
    }

    console.log("cookie", Date.now() - now, "ms");
}

function test2() {
    console.log("test2");
    var cookieStr ='PHPSESSID=abcdefghijklmnopqrstuvyx';
    now = Date.now();

    l = count;
    while(l--) {
        cookieparser.parse(cookieStr);
    }

    console.log("cookieparser", Date.now() - now, "ms");


    now = Date.now();

    l = count;
    while(l--) {
        cookie.parse(cookieStr);
    }

    console.log("cookie", Date.now() - now, "ms");
}

function test3() {
    console.log("test3");
    var cookieStr ='a=b; c=d; e=f; g=h; k=j; m =n; b = q;    a = c;  r = l';
    now = Date.now();

    l = count;
    while(l--) {
        cookieparser.parse(cookieStr);
    }

    console.log("cookieparser", Date.now() - now, "ms");


    now = Date.now();

    l = count;
    while(l--) {
        cookie.parse(cookieStr);
    }

    console.log("cookie", Date.now() - now, "ms");
}

test1(); test2(); test3();
