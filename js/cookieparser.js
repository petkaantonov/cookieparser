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
    var mode = 1;
    var i = 0;

    for( var len = str.length; i < len; ++i ) {
        var ch = str.charCodeAt(i);
        if (ch > 127) {
            return slowParse(str, decode);
        }
        switch(mode) {
        case 1:
            if (ch === 61) {
                mode = 2;
            }
            else if (ch === 59 ||
                     ch === 44) {
                keyEnd = keyStart = i + 1;
            }
            else {
                keyEnd = i;
            }
            break;

        case 2:
            valueStart = valueEnd = i;
            if (ch === 34) {
                valueStart = valueEnd = i + 1;
                mode = 4;
                break;
            }
            mode = 3;
        case 3:
            if (ch === 37) {
                valueMightNeedDecoding = true;
            }
            if (ch === 59 ||
                ch === 44) {
                var key = extract(str, keyStart, keyEnd);
                var value = extract(str, valueStart, valueEnd);

                dictionary[key] = valueMightNeedDecoding
                    ? decode(value)
                    : value;
                valueMightNeedDecoding = false;
                var j = i;
                for (; j < len; ++j) {
                    if (str.charCodeAt(j) !== 32) {
                        i = j - 1;
                        break;
                    }
                }
                keyEnd = keyStart = i + 1;
                mode = 1;
            }
            else {
                valueEnd = i;
            }
            break;

        case 4:
            if (ch === 37) {
                valueMightNeedDecoding = true;
            }
            if (ch === 59 ||
                ch === 44) {
                var j = trimBackward(str, i - 1);
                valueEnd = j - 1;
                if(valueEnd < valueStart) valueStart = valueEnd;

                var key = extract(str, keyStart, keyEnd);
                var value = extract(str, valueStart, valueEnd);

                dictionary[key] = valueMightNeedDecoding
                    ? decode(value)
                    : value;

                valueMightNeedDecoding = false;
                j = i;
                for (; j < len; ++j) {
                    if (str.charCodeAt(j) !== 32) {
                        i = j - 1;
                        break;
                    }
                }
                keyEnd = keyStart = i + 1;
                mode = 1;
            }
            else {
                valueEnd = i;
            }
            break;
        }
    }

    if (mode !== 1) {
        if (mode === 4) {
            var j = trimBackward(str, i - 1);
            valueEnd = j - 1;
            if(valueEnd < valueStart) valueStart = valueEnd;
        }
        var key = extract(str, keyStart, keyEnd);
        var value = extract(str, valueStart, valueEnd);

        dictionary[key] = valueMightNeedDecoding
            ? decode(value)
            : value;
    }
    return dictionary;
}


function serialize() {

}

module.exports = {
    parse: parse,
    serialize: serialize
};

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
