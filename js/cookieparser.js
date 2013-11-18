/**
 * Copyright (c) 2013 Petka Antonov
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:</p>
 * 
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.  IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */
function decode(str) {
    try {
        return decodeURIComponent(str);
    }
    catch(e) {
        return str;
    }
}

function extract(str, start, end) {
    if( start === end + 1) {
        return "";
    }
    return str.slice(
        trimForward(str, start),
        trimBackward(str, end) + 1
    );
}

function trimForward(str, i) {
    var ch = str.charCodeAt(i);
    while (isWhiteSpace(ch)) {
        ch = str.charCodeAt(++i);
    }
    return i;

}

function trimBackward(str, i) {
    var ch = str.charCodeAt(i);
    while (isWhiteSpace(ch)) {
        ch = str.charCodeAt(--i);
    }
    return i;
}

function isWhiteSpace(ch) {
    return ch <= 32;
}

function parse(str) {
    if (typeof str !== "string") {
        throw new TypeError("str must be a string (Cookie parser)");
    }

    if (arguments.length > 1) {
        var opt = arguments[1];
        if (typeof opt === "object" && opt !== null &&
            typeof opt.decode === "function") {
            return slowParse(str, opt.decode);
        }
    }

    var dictionary = {};
    var keyStart = 0;
    var keyEnd = 0;
    var valueStart = 0;
    var valueEnd = 0;
    var valueMightNeedDecoding = false;
    var isQuote = false;
    var i = 0;
    var len = str.length;
    mainloop: for (; i < len; ++i ) {
        var ch = str.charCodeAt(i);
        if (ch > 127) {
            return slowParse(str, decode);
        }
        else if (ch === 61) {
            keyEnd = i - 1;
            var j = i + 1;
            ch = str.charCodeAt(j);
            if (ch === 34) {
                j++;
                isQuote = true;
            }
            valueStart = j;
            for(; j < len; ++j) {
                ch = str.charCodeAt(j);
                if( ch === 37 ) {
                    valueMightNeedDecoding = true;
                }
                else if (ch === 59 ||
                        ch === 44) {
                    if (isQuote) {
                        var k = trimBackward(str, j - 1);
                        valueEnd = k - 1;
                        if(valueEnd < valueStart) valueStart = valueEnd;
                    }
                    else {
                        valueEnd = j - 1;
                    }

                    var key = extract(str, keyStart, keyEnd);
                    var value = extract(str, valueStart, valueEnd);

                    dictionary[key] = valueMightNeedDecoding
                        ? decode(value)
                        : value;

                    i = j;
                    for (; j < len; ++j) {
                        if (str.charCodeAt(j) !== 32) {
                            i = j - 1;
                            break;
                        }
                    }
                    keyEnd = keyStart = i + 1;
                    isQuote = false;
                    valueMightNeedDecoding = false;
                    continue mainloop;
                }

            }
            if (isQuote) {
                var k = trimBackward(str, j - 1);
                valueEnd = k - 1;
                if(valueEnd < valueStart) valueStart = valueEnd;
            }
            else {
                valueEnd = j - 1;
            }

            var key = extract(str, keyStart, keyEnd);
            var value = extract(str, valueStart, valueEnd);

            dictionary[key] = valueMightNeedDecoding
                ? decode(value)
                : value;
            i = j;
        }
        else if (ch === 59 ||
            ch === 44) {
            keyStart = i + 1;
        }

    }
    return dictionary;
}

module.exports = {
    parse: parse,
    serialize: serialize
};

function serialize(name, val, opt) {
    opt = opt || {};
    var enc = opt.encode || encodeURIComponent;
    var pairs = [name + "=" + enc(val)];

    if (opt.maxAge) pairs.push("Max-Age=" + opt.maxAge);
    if (opt.domain) pairs.push("Domain=" + opt.domain);
    if (opt.path) pairs.push("Path=" + opt.path);
    if (opt.expires) pairs.push("Expires=" + opt.expires.toUTCString());
    if (opt.httpOnly) pairs.push("HttpOnly");
    if (opt.secure) pairs.push("Secure");

    return pairs.join("; ");
}
function slowParse(str, dec) {
    var obj = {};
    var pairs = str.split(/[;,] */);

    pairs.forEach(function(pair) {
        var eq_idx = pair.indexOf("=");

        if (eq_idx < 0) {
            return;
        }

        var key = pair.substr(0, eq_idx).trim();
        var val = pair.substr(++eq_idx, pair.length).trim();

        if ("\"" == val[0]) {
            val = val.slice(1, -1);
        }

        if (undefined == obj[key]) {
            try {
                obj[key] = dec(val);
            } catch (e) {
                obj[key] = val;
            }
        }
    });

    return obj;
}
