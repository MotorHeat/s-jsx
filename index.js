(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('s-js')) :
    typeof define === 'function' && define.amd ? define(['exports', 's-js'], factory) :
    (global = global || self, factory(global['s-jsx'] = {}, global.S));
}(this, function (exports, S) { 'use strict';

    S = S && S.hasOwnProperty('default') ? S['default'] : S;

    // This file is copied from https://github.com/adamhaile/surplus-mixin-data
    function data(signal, arg1, arg2) {
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

    const fragmentProp = "s-jsx-fragment";
    const fnProp = 'fn';
    function h(nameOrComponent, attributes) {
        let children = [];
        for (let i = 2; i < arguments.length; i++) {
            let c = arguments[i];
            if (c) {
                if (c[fragmentProp] === true) {
                    c.map(v => children.push(v));
                }
                else {
                    children.push(arguments[i]);
                }
            }
        }

        if (typeof (nameOrComponent) === 'string') {
            let element = document.createElement(nameOrComponent);
            setProps(element, attributes);
            createChildren(element, children);
            processSpecialProps(element, attributes, nameOrComponent);
            return element
        }
        else {
            let result = nameOrComponent(attributes, children);
            processSpecialProps(result, attributes, nameOrComponent);
            return result
        }
    }

    function processSpecialProps(element, props, nameOrComponent) {
        if (props && props[fnProp]) {
            props[fnProp](element, nameOrComponent);
        }
    }

    h.fragment = function fragment(_, fragment) {
        let result = [];
        for (let i = 0; i < fragment.length; i++) {
            let c = fragment[i];
            if (c) {
                if (Array.isArray(c)) {
                    c.map(v => result.push(v));
                }
                else {
                    result.push(c);
                }
            }
        }
        result[fragmentProp] = true;
        return result
    };

    function setProps(element, props) {
        for (let a in props) {
            if (a === fnProp) {
                continue
            }
            let attrValue = props[a];
            if (typeof (attrValue) === "function" && isSignal(attrValue)) {
                S(() => element[a] = attrValue());
            }
            else {
                element[a] = attrValue;
            }
        }
    }

    function runFactory(parent, factory) {
        if (factory.isComputationFactory) {
            let prevChild = null;
            S(() => {
                let newChild = factory(parent, prevChild);
                prevChild = newChild;
            });
        }
        else {
            factory(parent, null);
        }
    }

    function createChildren(parent, children) {
        let factories = [];

        for (let i = 0; i < children.length; i++) {
            factories.push(nodeFactoryFromChild(children[i]));
        }

        for (let i = 0; i < factories.length; i++) {
            runFactory(parent, factories[i]);
        }
    }

    function isElement(element) {
        return element instanceof Element || element instanceof HTMLDocument;
    }

    function factoryElement(child) {
        return function (parent, prevChild) {
            if (prevChild) {
                parent.replaceChild(child, prevChild);
            }
            else {
                parent.appendChild(child);
            }
            return child
        }
    }

    function factoryArray(child) {
        return function (parent, prevChild) {
            if (prevChild) {
                if (Array.isArray(prevChild)) {
                    return reconcileArrays(parent, prevChild, child)
                }
                else {
                    return reconcileArrays(parent, [prevChild], child)
                }
            }
            return reconcileArrays(parent, [], child)
        }
    }

    function isSignal(func) {
        let code = func.toString(); //func.name doesn't work in IE, this is the best that I can find 

        return code.indexOf(".current()") >= 0 || code.indexOf('Error("conflicting values: "') >= 0
    }

    function factoryFunction(child) {
        if (isSignal(child)) {
            let result = function (parent, prevChild) {
                let factory = nodeFactoryFromChild(child());
                return factory(parent, prevChild, true)
            };
            result.isComputationFactory = true;
            return result
        }
        return nodeFactoryFromChild(child())
    }

    function factoryDefault(child) {
        return function (parent, prevChild) {
            if (prevChild) {
                prevChild.textContent = child;
                return prevChild
            }
            else {
                let result = document.createTextNode(child);
                parent.appendChild(result);
                return result
            }
        }
    }

    function factoryNull(child) {
        return function (parent, prevChild, calledFromComputation) {
            if (!calledFromComputation) {
                return null
            }

            let placeholder = document.createComment("");

            if (prevChild) {
                if (isElement(prevChild)) {
                    parent.replaceChild(placeholder, prevChild);
                }
                else if (Array.isArray(prevChild)) {
                    for (let i = 1; i < prevChild.length; i++) {
                        parent.removeChild(prevChild[i]);
                    }
                    parent.replaceChild(placeholder, prevChild[0]);
                }
                else {
                    throw "Don't know how to remove previous child: " + prevChild
                }
                return placeholder
            }
            parent.appendChild(placeholder);
            return placeholder
        }
    }

    function nodeFactoryFromChild(child) {

        if (child === null || child === undefined) {
            return factoryNull(child)
        }

        if (isElement(child)) {
            return factoryElement(child)
        }

        if (Array.isArray(child)) {
            return factoryArray(child)
        }

        if (typeof (child) === 'function') {
            return factoryFunction(child)
        }

        return factoryDefault(child)
    }

    function reconcileArrays(parent, prevItems, newItems) {
        if (prevItems.length === 0 && newItems.length > 0) {
            for (let i = 0; i < newItems.length; i++) {
                parent.appendChild(newItems[i]);
            }
            return newItems
        }

        if (prevItems.length === 0 && newItems.length === 0) {
            let placeholder = document.createComment("");
            parent.appendChild(placeholder);
            return placeholder
        }

        if (prevItems.length > 0 && newItems.length === 0) {
            let placeholder = document.createComment("");
            for (let i = 1; i < prevItems.length; i++) {
                parent.removeChild(prevItems[i]);
            }
            parent.replaceChild(placeholder, prevItems[0]);
            return placeholder
        }

        let p = 0, i = 0;
        let lastProcessedItem = null;
        while (p < prevItems.length && i < newItems.length) {
            let pi = prevItems[p];
            let ni = newItems[i];
            lastProcessedItem = ni;
            if (pi === ni) {
                p++;
                i++;
                continue
            }

            if (ni.parentNode === parent) {
                parent.removeChild(pi);
                p++;
                continue
            }

            if (ni.parentNode !== parent) {
                parent.insertBefore(ni, pi);
                i++;
                continue
            }

            throw "Cannot reconcile array"
        }

        while (i < newItems.length) {
            if (newItems[i].parentNode === null) {
                insertAfter(parent, lastProcessedItem, newItems[i]);
            }
            lastProcessedItem = newItems[i];
            i++;
        }

        while (p < prevItems.length) {
            parent.removeChild(prevItems[p]);
            p++;
        }

        return newItems
    }

    function insertAfter(parent, existingElement, newElement) {
        if (parent.lastChild == existingElement) {
            parent.appendChild(newElement);
        } else {
            parent.insertBefore(newElement, existingElement.nextSibling);
        }
    }

    exports.data = data;
    exports.h = h;

    Object.defineProperty(exports, '__esModule', { value: true });

}));
