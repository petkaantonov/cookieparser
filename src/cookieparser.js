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
    return ch <= SPACE;
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
    //reset values
    mainloop: for (; i < len; ++i ) {
        var ch = str.charCodeAt(i);
        if (ch > MAX_ASCII) {
            return slowParse(str, decode);
        }
        else if (ch === EQUALS) {
            keyEnd = i - 1;
            var j = i + 1;
            ch = str.charCodeAt(j);
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
        else if (ch === SCOLON ||
            ch === COMMA) {
            keyStart = i + 1;
        }

    }
    return dictionary;
}

module.exports = {
    parse: parse,
    serialize: serialize
};

/*
// MIT License
Copyright (C) Roman Shtylman <shtylman@gmail.com>
https://github.com/defunctzombie/node-cookie/
*/
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
}
