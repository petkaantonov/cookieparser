"use strict";
module.exports = CookieParser;

function CookieParser() {

}

CookieParser.maxLength = 4096;

CookieParser.parse = function(str) {
    var maxLength = CookieParser.maxLength;

    if (typeof str !== "string") {
        throw new TypeError("str must be a string");
    }

    if (str.length > maxLength) {
        throw new RangeError("str is too large " +
            "(CookieParser.maxLength="+maxLength+")");
    }
    var cookieParser = new CookieParser();
    if (arguments.length > 1) {
        var opt = arguments[1];
        if (typeof opt === "object" && opt !== null &&
            typeof opt.decode === "function") {
            return cookieParser.slowParse(str, opt.decode);
        }
    }
    return cookieParser.parse(str);
};

CookieParser.prototype.decode = function CookieParser$decode(str) {
    try {
        return decodeURIComponent(str);
    }
    catch(e) {
        return str;
    }
};

CookieParser.prototype.extract =
function CookieParser$extract(str, start, end) {
    if( start === end + 1) {
        return "";
    }
    return str.slice(
        this.trimForward(str, start),
        this.trimBackward(str, end) + 1
    );
};

CookieParser.prototype.trimForward =
function CookieParser$trimForward(str, i) {
    var ch = str.charCodeAt(i);
    while (this.isWhiteSpace(ch)) {
        ch = str.charCodeAt(++i);
    }
    return i;
};

CookieParser.prototype.trimBackward =
function CookieParser$trimBackward(str, i) {
    var ch = str.charCodeAt(i);
    while (this.isWhiteSpace(ch)) {
        ch = str.charCodeAt(--i);
    }
    return i;
};

CookieParser.prototype.isWhiteSpace = function CookieParser$isWhiteSpace(ch) {
    return ch <= SPACE;
};

CookieParser.prototype.parse = function CookieParser$parse(str) {
    var dictionary = {};
    var keyStart = 0;
    var keyEnd = 0;
    var valueStart = 0;
    var valueEnd = 0;
    var valueMightNeedDecoding = false;
    var isQuote = false;
    var i = 0;
    var len = str.length;
    //reset values
    mainloop: for (; i < len; ++i ) {
        var ch = str.charCodeAt(i);
        if (ch > MAX_ASCII) {
            return this.slowParse(str, this.decode);
        }
        else if (ch === EQUALS) {
            keyEnd = i - 1;
            var j = i + 1;
            ch = str.charCodeAt(j);
            while(ch === SPACE) {
                j++;
                ch = str.charCodeAt(j);
            }
            if (ch === QUOTE) {
                j++;
                isQuote = true;
            }
            valueStart = j;
            for(; j < len; ++j) {
                ch = str.charCodeAt(j);
                if( ch === PCT ) {
                    valueMightNeedDecoding = true;
                }
                else if (ch === SCOLON ||
                        ch === COMMA) {
                    if (isQuote) {
                        var k = this.trimBackward(str, j - 1);
                        valueEnd = k - 1;
                        if(valueEnd < valueStart) valueStart = valueEnd;
                    }
                    else {
                        valueEnd = j - 1;
                    }

                    var key = this.extract(str, keyStart, keyEnd);
                    var value = this.extract(str, valueStart, valueEnd);

                    dictionary[key] = valueMightNeedDecoding
                        ? this.decode(value)
                        : value;

                    i = j;
                    for (; j < len; ++j) {
                        if (str.charCodeAt(j) !== SPACE) {
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
                var k = this.trimBackward(str, j - 1);
                valueEnd = k - 1;
                if(valueEnd < valueStart) valueStart = valueEnd;
            }
            else {
                valueEnd = j - 1;
            }

            var key = this.extract(str, keyStart, keyEnd);
            var value = this.extract(str, valueStart, valueEnd);

            dictionary[key] = valueMightNeedDecoding
                ? this.decode(value)
                : value;
            i = j;
        }
        else if (ch === SCOLON ||
            ch === COMMA) {
            keyStart = i + 1;
        }

    }
    return dictionary;
};

/*
// MIT License
Copyright (C) Roman Shtylman <shtylman@gmail.com>
https://github.com/defunctzombie/node-cookie/
*/
CookieParser.serialize = function CookieParser$Serialize(name, val, opt) {
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
};

CookieParser.prototype.slowParse = function CookieParser$slowParse(str, dec) {
    var obj = {};
    var pairs = str.split(/[;,] */);

    pairs.forEach(function(pair) {
        var eq_idx = pair.indexOf("=");

        // skip things that don't look like key=value
        if (eq_idx < 0) {
            return;
        }

        var key = pair.substr(0, eq_idx).trim();
        var val = pair.substr(++eq_idx, pair.length).trim();

        // quoted values
        if ("\"" == val[0]) {
            val = val.slice(1, -1);
        }

        // only assign once
        if (undefined == obj[key]) {
            try {
                obj[key] = dec(val);
            } catch (e) {
                obj[key] = val;
            }
        }
    });

    return obj;
};
