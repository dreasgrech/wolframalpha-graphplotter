window.onload = function () {
    Array.prototype.iterate || (Array.prototype.iterate = function (callback, ignore) {
        var i = 0,
            j = this.length;
        for (; i < j; ++i) {
            if (ignore && ignore(this[i], i)) {
                continue;
            }

            callback(this[i], i);
        }
    });

    var mainUrl = "http://www.wolframalpha.com/input/?i=",
        axes = ["x", "y"],
        functionSerializeSeperator = "#-#",
        toArray = function (el) {
            return Array.prototype.slice.call(el);
        },
        typesHolder = document.getElementById('types'),
        functionsHolder = document.getElementById('functions'),
        addFunction = function (f) {
            var holder = document.createElement('div'),
                input = document.createElement('input');
            input.classList.add("function");
            input.type = "text";
            input.onkeyup = saveData;
            if (f) {
                input.value = f;
            }

            holder.appendChild(input);
            functions.appendChild(holder);
            input.focus();
        },
        getType = function () {
            var selectedType;
            toArray(typesHolder.getElementsByTagName("input")).iterate(function (radio) {
                if (radio.checked) {
                    selectedType = radio.value
                }
            });
            return selectedType;
        },
        getFunctions = function () {
            var functions = [];
            toArray(functionsHolder.childNodes).iterate(function (functionHolder) {
                var value;
                if (functionHolder.nodeName !== "DIV") {
                    return;
                }
                value = functionHolder.getElementsByTagName("input")[0].value;
                if (value) {
                    functions.push(value);
                }
            });

            return functions;
        },
        getRanges = function () {
            var ranges = {}, limits = ["From", "To"];
            axes.iterate(function (axis) {
                var axisLimits = {};
                limits.iterate(function (limit) {
                    var inputtedAxisLimit = document.getElementById(axis + "Range" + limit);
                    axisLimits[limit] = inputtedAxisLimit.value || "";
                });

                if (axisLimits["From"] && axisLimits["To"]) {
                    ranges[axis] = axisLimits;
                    ranges[axis].serialize = function () {
                        return "{" + axis + ", " + axisLimits["From"] + ", " + axisLimits["To"] + "}";
                    };
                }
            });
            return ranges;
        },
        constructUrl = function (functions, ranges) {
            var plotParameter = "Plot[",
                serializedFunctions = functions.join(", "),
                serializedRanges = [];

            axes.iterate(function (axis) {
                if (!ranges[axis]) {
                    return;
                }
                serializedRanges.push(ranges[axis].serialize());
            });
            serializedRanges = serializedRanges.join(", ");

            return mainUrl + encodeURIComponent(getType() + " Plot[" + serializedFunctions + (serializedRanges ? ", " + serializedRanges : "") + "]");
        },
        ready = function (e) {
            e.preventDefault();
            var functions = getFunctions(),
                ranges = getRanges(),
                fullUrl;
            if (!functions.length) {
                return;
            }
            fullUrl = constructUrl(functions, ranges);

            chrome.tabs.create({'url': fullUrl});
        },
        saveData = function () {
            var ranges = getRanges();
            localStorage["functions"] = getFunctions().join(functionSerializeSeperator);
            axes.iterate(function (axis) {
                localStorage[axis + "RangeFrom"] = document.getElementById(axis + "RangeFrom").value;
                localStorage[axis + "RangeTo"] = document.getElementById(axis + "RangeTo").value;
            });
        },
        loadData = function () {
            var functions = localStorage["functions"];
            if (functions) {
                functions.split(functionSerializeSeperator).iterate(addFunction);
            } else { // if there are no saved functions, just add an empty first one
                addFunction();
            }
            axes.iterate(function (axis) {
                document.getElementById(axis + "RangeFrom").value = localStorage[axis + "RangeFrom"] || "";
                document.getElementById(axis + "RangeTo").value = localStorage[axis + "RangeTo"] || "";
            });
        },
        clear = function () {
            axes.iterate(function (axis) {
                document.getElementById(axis + "RangeFrom").value = "";
                document.getElementById(axis + "RangeTo").value = "";
            });
            toArray(document.getElementsByClassName('function')).iterate(function (f) {
                functionsHolder.removeChild(f.parentNode);
            });

            addFunction();
            saveData();
        };

    document.getElementById('ready').onclick = ready;

    /*
     * The reason I didn't do "onclick = addFunction" for addFunction is because
     * if I did that, addFunction will recieve the event arguments from onclick
     * and that's not good because addFunction assumes that if an argument is passed,
     * it's a new function to be added.
     */
    document.getElementById('addFunction').onclick = function () {
        addFunction();
    };

    toArray(document.getElementsByTagName("input")).iterate(function (input) {
        input.onkeyup = saveData;
    });

    document.getElementById('clear').onclick = clear;

    loadData();
};
