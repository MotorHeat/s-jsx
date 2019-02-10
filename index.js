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

    function AmbiguousElement(nodeName, props, children) {
        this.nodeName = nodeName;
        this.props = props;
        this.children = children;
    }

    function isSvgNodeName(nodeName) {
        return svgTags.indexOf(nodeName) >= 0
    }

    function isSvgAmbiguousNodeName(nodeName) {
        return ambiguousSvgTags.indexOf(nodeName) >= 0
    }

    const svgTags = [
        'circle',
        'clipPath',
        'defs',
        'desc',
        'ellipse',
        'feBlend',
        'feColorMatrix',
        'feComponentTransfer',
        'feComposite',
        'feConvolveMatrix',
        'feDiffuseLighting',
        'feDisplacementMap',
        'feDistantLight',
        'feFlood',
        'feFuncA',
        'feFuncB',
        'feFuncG',
        'feFuncR',
        'feGaussianBlur',
        'feImage',
        'feMerge',
        'feMergeNode',
        'feMorphology',
        'feOffset',
        'fePointLight',
        'feSpecularLighting',
        'feSpotLight',
        'feTile',
        'feTurbulence',
        'filter',
        'foreignObject',
        'g',
        'image',
        'line',
        'linearGradient',
        'marker',
        'mask',
        'metadata',
        'path',
        'pattern',
        'polygon',
        'polyline',
        'radialGradient',
        'rect',
        'stop',
        'svg',
        'switch',
        'symbol',
        'text',
        'textPath',
        'tspan',
        'use',
        'view'
    ];

    const ambiguousSvgTags = ['a', 'font', 'title', 'script', 'style'];

    const fnProps = ['fn', 'fn0', 'fn1','fn2', 'fn3', 'fn4', 'fn5', 'fn6', 'fn7', 'fn8', 'fn9' ];

    function h(nameOrComponent, attributes) {
        let children = [];
        for (let i = 2; i < arguments.length; i++) {
            let c = arguments[i];
            if (c) {
                if (Array.isArray(c)) {
                    c.map(v => children.push(v));
                }
                else {
                    children.push(arguments[i]);
                }
            }
        }

        if (typeof (nameOrComponent) === 'string') {
            if (isSvgAmbiguousNodeName(nameOrComponent)) {
                return new AmbiguousElement(nameOrComponent, attributes, children)
            }
            else {
                return createElement(nameOrComponent, attributes, children, isSvgNodeName(nameOrComponent))
            }
        }
        else {
            let result = nameOrComponent(attributes, children);
            processSpecialProps(result, attributes, nameOrComponent);
            return result
        }
    }

    function createElement(nodeName, attributes, children, isSvg) {
        let element = isSvg 
            ? document.createElementNS("http://www.w3.org/2000/svg", nodeName) 
            : document.createElement(nodeName);
        setProps(element, attributes, isSvg);
        createChildren(element, children);
        processSpecialProps(element, attributes, nodeName);
        return element
    }


    function processSpecialProps(element, props, nameOrComponent) {
        if (props) {
            fnProps.map( p => { 
                if (props[p]) {
                    props[p](element, nameOrComponent);
                }
            });        
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
        return result
    };

    function setProps(element, props, isSvg) {
        for (let a in props) {
            if (fnProps.indexOf(a) >= 0) {
                continue
            }        
            let attrValue = props[a];
            if (a === "class") {
                a = "className";
            }

            if (typeof (attrValue) === "function" && a.indexOf("on") !== 0) {
                S(() => setPropValue(element, a, attrValue(), isSvg));
            }
            else {
                setPropValue(element, a, attrValue, isSvg);
            }
        }
    }

    function getStyleString(obj) {
        let result = "";
        for(let p in obj) {
            result += `${p}:${obj[p]};`;
        }
        return result
    }
    function setPropValue(element, propertyName, value, isSvg) {
        if (propertyName === "style" && typeof(value) === "object") {
            value = getStyleString(value);
        }
        if (isSvg || propertyName.indexOf('-') >= 0) {
            element.setAttribute(propertyName, value);
        }
        else {
            element[propertyName] = value;
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
        return element instanceof Element || element instanceof HTMLDocument || element instanceof Comment
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

    function factoryFunction(child) {
        let result = function (parent, prevChild) {
            let factory = nodeFactoryFromChild(child());
            return factory(parent, prevChild, true)
        };
        result.isComputationFactory = true;
        return result
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

    function factoryAmbiguous(child) {
        return function (parent, prevChild, calledFromComputation) {
            let isSvg = (parent instanceof SVGElement) && !(parent instanceof SVGForeignObjectElement);
            let element = createElement(child.nodeName, child.props, child.children, isSvg);
            return factoryElement(element)(parent, prevChild, calledFromComputation)
        }
    }

    function nodeFactoryFromChild(child) {

        if (child === null || child === undefined || child === false) {
            return factoryNull(child)
        }

        if (isElement(child)) {
            return factoryElement(child)
        }

        if (Array.isArray(child)) {
            return factoryArray(child)
        }

        if (child instanceof AmbiguousElement) {
            return factoryAmbiguous(child)
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
