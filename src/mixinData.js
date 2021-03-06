// This file is copied from https://github.com/adamhaile/surplus-mixin-data
// Original code imports S from 'Surplus' package while here I need to import from s-js one

import S from 's-js';
export function data(signal, arg1, arg2) {
    var event = arg1 || 'input', on = arg1 === undefined ? true : arg1, off = arg2 === undefined ? (on === true ? false : null) : arg2;
    return function (node) {
        if (node instanceof HTMLInputElement) {
            var type = node.type.toUpperCase();
            if (type === 'CHECKBOX') {
                checkboxData(node, signal, on, off);
            }
            else if (type === 'RADIO') {
                radioData(node, signal, on);
            }
            else {
                valueData(node, signal, event);
            }
        }
        else if (node instanceof HTMLSelectElement || node instanceof HTMLTextAreaElement) {
            valueData(node, signal, event);
        }
        else if (node.isContentEditable) {
            textContentData(node, signal, event);
        }
        else {
            throw new Error("@data can only be applied to a form control element, \n"
                + "such as <input/>, <textarea/> or <select/>, or to an element with "
                + "'contentEditable' set.  Element ``" + node.nodeName + "'' is \n"
                + "not such an element.  Perhaps you applied it to the wrong node?");
        }
    };
}
function valueData(node, signal, event) {
    S(function updateValue() {
        node.value = toString(signal());
    });
    node.addEventListener(event, valueListener, false);
    S.cleanup(function () { node.removeEventListener(event, valueListener); });
    function valueListener() {
        var cur = toString(S.sample(signal)), update = node.value;
        if (cur !== update)
            signal(update);
        return true;
    }
}
function checkboxData(node, signal, on, off) {
    S(function updateCheckbox() {
        node.checked = signal() === on;
    });
    node.addEventListener("change", checkboxListener, false);
    S.cleanup(function () { node.removeEventListener("change", checkboxListener); });
    function checkboxListener() {
        signal(node.checked ? on : off);
        return true;
    }
}
function radioData(node, signal, on) {
    S(function updateRadio() {
        node.checked = (signal() === on);
    });
    node.addEventListener("change", radioListener, false);
    S.cleanup(function () { node.removeEventListener("change", radioListener); });
    function radioListener() {
        if (node.checked)
            signal(on);
        return true;
    }
}
function textContentData(node, signal, event) {
    S(function updateTextContent() {
        node.textContent = toString(signal());
    });
    node.addEventListener(event, textContentListener, false);
    S.cleanup(function () { node.removeEventListener(event, textContentListener); });
    function textContentListener() {
        var cur = toString(S.sample(signal)), update = node.textContent;
        if (cur !== update)
            signal(update);
        return true;
    }
}
function toString(v) {
    return v == null ? '' : v.toString();
}
