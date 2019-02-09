import S from 's-js'

const fnProps = ['fn', 'fn0', 'fn1','fn2', 'fn3', 'fn4', 'fn5', 'fn6', 'fn7', 'fn8', 'fn9' ]

export function h(nameOrComponent, attributes) {
    let children = []
    for (let i = 2; i < arguments.length; i++) {
        let c = arguments[i]
        if (c) {
            if (Array.isArray(c)) {
                c.map(v => children.push(v))
            }
            else {
                children.push(arguments[i])
            }
        }
    }

    if (typeof (nameOrComponent) === 'string') {
        let element = document.createElement(nameOrComponent)
        setProps(element, attributes)
        createChildren(element, children)
        processSpecialProps(element, attributes, nameOrComponent)
        return element
    }
    else {
        let result = nameOrComponent(attributes, children)
        processSpecialProps(result, attributes, nameOrComponent)
        return result
    }
}

function processSpecialProps(element, props, nameOrComponent) {
    if (props) {
        fnProps.map( p => { 
            if (props[p]) {
                props[p](element, nameOrComponent)
            }
        })        
    }
}

h.fragment = function fragment(_, fragment) {
    let result = []
    for (let i = 0; i < fragment.length; i++) {
        let c = fragment[i]
        if (c) {
            if (Array.isArray(c)) {
                c.map(v => result.push(v))
            }
            else {
                result.push(c)
            }
        }
    }
    return result
}

function setProps(element, props) {
    for (let a in props) {
        if (fnProps.indexOf(a) >= 0) {
            continue
        }        
        let attrValue = props[a]
        if (a === "class") {
            a = "className"
        }
        if (typeof (attrValue) === "function" && a.indexOf("on") !== 0) {
            S(() => setPropValue(element, a, attrValue()))
        }
        else {
            setPropValue(element, a, attrValue)
        }
    }
}

function setPropValue(element, propertyName, value) {
    if (propertyName.indexOf('-') >= 0) {
        element.setAttribute(propertyName, value)
    }
    else {
        element[propertyName] = value
    }
}

function runFactory(parent, factory) {
    if (factory.isComputationFactory) {
        let prevChild = null
        S(() => {
            let newChild = factory(parent, prevChild)
            prevChild = newChild
        })
    }
    else {
        factory(parent, null)
    }
}

function createChildren(parent, children) {
    let factories = []

    for (let i = 0; i < children.length; i++) {
        factories.push(nodeFactoryFromChild(children[i]))
    }

    for (let i = 0; i < factories.length; i++) {
        runFactory(parent, factories[i])
    }
}

function isElement(element) {
    return element instanceof Element || element instanceof HTMLDocument || element instanceof Comment
}

function factoryElement(child) {
    return function (parent, prevChild) {
        if (prevChild) {
            parent.replaceChild(child, prevChild)
        }
        else {
            parent.appendChild(child)
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
        let factory = nodeFactoryFromChild(child())
        return factory(parent, prevChild, true)
    }
    result.isComputationFactory = true
    return result
}

function factoryDefault(child) {
    return function (parent, prevChild) {
        if (prevChild) {
            prevChild.textContent = child
            return prevChild
        }
        else {
            let result = document.createTextNode(child)
            parent.appendChild(result)
            return result
        }
    }
}

function factoryNull(child) {
    return function (parent, prevChild, calledFromComputation) {
        if (!calledFromComputation) {
            return null
        }

        let placeholder = document.createComment("")

        if (prevChild) {
            if (isElement(prevChild)) {
                parent.replaceChild(placeholder, prevChild)
            }
            else if (Array.isArray(prevChild)) {
                for (let i = 1; i < prevChild.length; i++) {
                    parent.removeChild(prevChild[i])
                }
                parent.replaceChild(placeholder, prevChild[0])
            }
            else {
                throw "Don't know how to remove previous child: " + prevChild
            }
            return placeholder
        }
        parent.appendChild(placeholder)
        return placeholder
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

    if (typeof (child) === 'function') {
        return factoryFunction(child)
    }

    return factoryDefault(child)
}

function reconcileArrays(parent, prevItems, newItems) {
    if (prevItems.length === 0 && newItems.length > 0) {
        for (let i = 0; i < newItems.length; i++) {
            parent.appendChild(newItems[i])
        }
        return newItems
    }

    if (prevItems.length === 0 && newItems.length === 0) {
        let placeholder = document.createComment("")
        parent.appendChild(placeholder)
        return placeholder
    }

    if (prevItems.length > 0 && newItems.length === 0) {
        let placeholder = document.createComment("")
        for (let i = 1; i < prevItems.length; i++) {
            parent.removeChild(prevItems[i])
        }
        parent.replaceChild(placeholder, prevItems[0])
        return placeholder
    }

    let p = 0, i = 0;
    let lastProcessedItem = null
    while (p < prevItems.length && i < newItems.length) {
        let pi = prevItems[p]
        let ni = newItems[i]
        lastProcessedItem = ni
        if (pi === ni) {
            p++
            i++
            continue
        }

        if (ni.parentNode === parent) {
            parent.removeChild(pi)
            p++
            continue
        }

        if (ni.parentNode !== parent) {
            parent.insertBefore(ni, pi)
            i++
            continue
        }

        throw "Cannot reconcile array"
    }

    while (i < newItems.length) {
        if (newItems[i].parentNode === null) {
            insertAfter(parent, lastProcessedItem, newItems[i])
        }
        lastProcessedItem = newItems[i]
        i++
    }

    while (p < prevItems.length) {
        parent.removeChild(prevItems[p])
        p++
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