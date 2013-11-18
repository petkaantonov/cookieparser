function decode(str) {
    try {
        return decodeURIComponent(str);
    }
    catch(e) {
        return str;
    }
}

/* jshint maxparams: 7 */
function placeKeyValue(str, dictionary, keyStart,
    keyEnd, valueStart, valueEnd, valueMightNeedDecoding) {


    var key = keyStart === keyEnd ? "" :
        str.substring(
            trimForward(str, keyStart),
            trimBackward(str, keyEnd) + 1
        );
    var value = valueStart === valueEnd ? "" :
        str.substring(
            trimForward(str, valueStart),
            trimBackward(str, valueEnd) + 1
        );

    if( void 0 === dictionary[key] ) {
        dictionary[key] = valueMightNeedDecoding
            ? decode(value)
            : value;
    }
}

function eatSpace(str, i) {
    for (var len = str.length; i < len; ++i) {
        if (str.charCodeAt(i) !== SPACE) {
            return i - 1;
        }
    }
    return i;
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
                placeKeyValue(str, dictionary, keyStart, keyEnd,
                    valueStart, valueEnd, valueMightNeedDecoding);

                valueMightNeedDecoding = false;
                i = eatSpace(str, i);
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

                placeKeyValue(str, dictionary, keyStart, keyEnd,
                    valueStart, valueEnd, valueMightNeedDecoding);

                valueMightNeedDecoding = false;
                i = eatSpace(str, i);
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
        else {
            valueEnd++;
        }
        placeKeyValue(str, dictionary, keyStart, keyEnd,
                valueStart, valueEnd, valueMightNeedDecoding);
    }
    return dictionary;
}


function serialize() {

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
