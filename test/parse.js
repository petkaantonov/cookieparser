var assert = require('assert');

var cookie = require('../js/cookieparser.js');


describe("parse", function() {

    specify('basic', function() {
        assert.deepEqual({ foo: 'bar' }, cookie.parse('foo=bar'));
        assert.deepEqual({ foo: '123' }, cookie.parse('foo=123'));
    });

    specify("basic multiple values", function() {
        assert.deepEqual({ foo: 'bar', abc: "4" }, cookie.parse('foo=bar; abc=4'));
    });

    specify('ignore spaces', function() {
        assert.deepEqual({ FOO: 'bar', baz: 'raz' },
                cookie.parse('FOO    = bar;   baz  =   raz'));
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
    })

});
