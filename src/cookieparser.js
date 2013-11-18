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
    var mode = KEY;
    var i = 0;

    //reset values
    for( var len = str.length; i < len; ++i ) {
        var ch = str.charCodeAt(i);
        if (ch > MAX_ASCII) {
            return slowParse(str, decode);
        }
        switch(mode) {
        case KEY:
            if (ch === EQUALS) {
                mode = VALUE_START;
            }
            else if (ch === SCOLON ||
                     ch === COMMA) {
                keyEnd = keyStart = i + 1;
            }
            else {
                keyEnd = i;
            }
            break;

        case VALUE_START:
            valueStart = valueEnd = i;
            if (ch === QUOTE) {
                valueStart = valueEnd = i + 1;
                mode = STRING;
                break;
            }
            //Character is part of value - fall through
            mode = VALUE;
        /* falls through */
        case VALUE:
            if (ch === PCT) {
                valueMightNeedDecoding = true;
            }
            if (ch === SCOLON ||
                ch === COMMA) {
                var key = extract(str, keyStart, keyEnd);
                var value = extract(str, valueStart, valueEnd);

                dictionary[key] = valueMightNeedDecoding
                    ? decode(value)
                    : value;
                valueMightNeedDecoding = false;
                var j = i;
                for (; j < len; ++j) {
                    if (str.charCodeAt(j) !== SPACE) {
                        i = j - 1;
                        break;
                    }
                }
                keyEnd = keyStart = i + 1;
                mode = KEY;
            }
            else {
                valueEnd = i;
            }
            break;

        case STRING:
            if (ch === PCT) {
                valueMightNeedDecoding = true;
            }
            if (ch === SCOLON ||
                ch === COMMA) {
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
                    if (str.charCodeAt(j) !== SPACE) {
                        i = j - 1;
                        break;
                    }
                }
                keyEnd = keyStart = i + 1;
                mode = KEY;
            }
            else {
                valueEnd = i;
            }
            break;
        }
    }

    if (mode !== KEY) {
        if (mode === STRING) {
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
    var enc = opt.encode || encode;
    var pairs = [name + '=' + enc(val)];

    if (opt.maxAge) pairs.push('Max-Age=' + opt.maxAge);
    if (opt.domain) pairs.push('Domain=' + opt.domain);
    if (opt.path) pairs.push('Path=' + opt.path);
    if (opt.expires) pairs.push('Expires=' + opt.expires.toUTCString());
    if (opt.httpOnly) pairs.push('HttpOnly');
    if (opt.secure) pairs.push('Secure');

    return pairs.join('; ');
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
