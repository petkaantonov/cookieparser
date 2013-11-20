var assert = require('assert');

var cookie = require('../js/cookieparser.js');

/*
Tests based on node-cookie
// MIT License
Copyright (C) Roman Shtylman <shtylman@gmail.com>
https://github.com/defunctzombie/node-cookie/
*/
describe("parse", function() {

    var foobar = { FOO: 'bar', baz: 'raz' };

    specify('basic', function() {
        assert.deepEqual({ foo: 'bar' }, cookie.parse('foo=bar'));
        assert.deepEqual({ foo: '123' }, cookie.parse('foo=123'));
    });

    specify("basic multiple values", function() {
        assert.deepEqual({ foo: 'bar', abc: "4" }, cookie.parse('abc=4; foo=bar'));
        assert.deepEqual({ foo: 'bar', abc: "4" }, cookie.parse('foo=bar; abc=4'));
    });

    specify('ignore spaces', function() {
        assert.deepEqual(
            foobar,
            cookie.parse('FOO    = bar    ;   baz  =   raz')
        );
        assert.deepEqual(
            foobar,
            cookie.parse("    f     ;      FOO    =   bar;  ; f ; baz = raz")
        );
        assert.deepEqual(
            foobar,
            cookie.parse("    f     ;      FOO    =   \"bar\"     ;  ; f ; baz =\"raz\"    ")
        );
        assert.deepEqual(
            foobar,
            cookie.parse("    f     ;      FOO    =   \"bar\"     ;  ; f ; baz =    \"raz\"    ")
        );
        assert.deepEqual(
            foobar,
            cookie.parse("    f     ;      FOO    =      \"bar\";  ; f ; baz =    \"raz\"    ")
        );
    });

    specify('escaping', function() {
        assert.deepEqual({ foo: 'bar=123456789&name=Magic+Mouse' },
                cookie.parse('foo="bar=123456789&name=Magic+Mouse"'));

        assert.deepEqual({ email: ' ",;/' },
                cookie.parse('email=%20%22%2c%3b%2f'));
    });

    specify('ignore escaping error and return original value', function() {
        assert.deepEqual({ foo: '%1', bar: 'bar' }, cookie.parse('foo=%1;bar=bar'));
    });

    specify('ignore non values', function() {
        assert.deepEqual({ foo: '%1', bar: 'bar' }, cookie.parse('foo=%1;bar=bar;HttpOnly;Secure'));
    });

    specify('unencoded', function() {
        assert.deepEqual({ foo: 'bar=123456789&name=Magic+Mouse' },
                cookie.parse('foo="bar=123456789&name=Magic+Mouse"',{
                    decode: function(value) { return value; }
                }));

        assert.deepEqual({ email: '%20%22%2c%3b%2f' },
                cookie.parse('email=%20%22%2c%3b%2f',{
                    decode: function(value) { return value; }
                }));
    });

    specify("Doesn't accept large input", function() {
        var str = new Array(13500).join("n");
        try {
            cookie.parse(str);
            assert.fail();
        }
        catch(e) {
            assert(e instanceof RangeError);
        }
    });

    specify("Doesn't accept wrong input", function() {
        try {
            cookie.parse({});
            assert.fail();
        }
        catch(e) {
            assert(e instanceof TypeError);
        }
    });


});
