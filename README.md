# s-jsx
This is yet another JavaScript view library that manages application state using [S.js](https://github.com/adamhaile/S) signals and creates real DOM nodes (similar to Surplus, Solid and others).
It allows you to define your view in JavaScript using JSX syntax.

# Intro
This project was inspired by [S.js](https://github.com/adamhaile/S) and [Surplus](https://github.com/adamhaile/surplus).
Surplus implements own compiler that transpiles JSX syntax to a plain JavaScript while this library implements the JSX Factory function that creates real DOM nodes and manages S-computations. 

# How it differs from Surplus?
- You don't need a special compiler
- You can use any existing JSX transpilers (Babel, TypeScript) that supports configuration of the jsxFactory function
- JSX is not required for building applications with s-jsx. You can use "h" directly and without a compilation step (see below)

# The Gist

Below is simple example of "Counter" app. Please note that you can use data signal directly `<h2>{counter}</h2>` if you just need to use it value. 
If you need some expression to be evaluated then you should wrap it with S-computation: 
`<p>{S( () => "The counter value is " + counter())}</p>`

Example

```javascript
import { h } from './s-jsx'
import S from 's-js'

const appState = {
    counter: S.data(0),
}

function CounterComponent({counter }) {
    return <div>        
        <h2>{counter}</h2>
        <p>{S( () => "The counter value is " + counter())}</p>
    </div>
}

function MainView(appState) {
    return <div>
        <CounterComponent counter={appState.counter}/>
        <button onclick={() => appState.counter(appState.counter() + 1)}>inc</button>
        <button onclick={() => appState.counter(appState.counter() - 1)}>dec</button>
    </div>
}

S.root( () => {
    document.body.appendChild(MainView(appState))
})
```
# How to use it?
The above example assumes you are using a JavaScript compiler like Babel or TypeScript and a module bundler like Parcel, Webpack, etc. If you are using JSX, all you need to do is install the [JSX transform plugin](https://babeljs.io/docs/en/babel-plugin-transform-react-jsx) and add the pragma option to your .babelrc file.
```
{
  "plugins": [
      ["@babel/plugin-transform-react-jsx", {
        "pragma": "h", 
        "pragmaFrag": "h.fragment"
      }]
    ]  
}
```
S-JSX supports JSX fragments via h.fragment function. Fragments are implemented in Babel starting from version 7. 
Using fragments your views can return several DOM nodes:
```JavaScript
function UserProfile({name, age, address}) {
  return <>
        <h1>{name}</h1>
        <h2>{age}</h2>
        <p>{address}</p>
    </>
}
```

JSX is a language syntax extension that lets you write HTML tags insede JavaScript files. We use compiler to transform it 
into "h" function calls under the hood. Note that JSX is not required for building applications with s-jsx.
You can use "h" directly and without a compilation. This is the same example with counter but written with "h" function:

```
function CounterComponent({ counter }) {
    return h('div', {},
        h('h2', {}, counter),
        h('p', {}, S(() => "The counter value is " + counter()))
    )
}

function MainView(appState) {
    return h('div', {},
        h(CounterComponent, { counter: appState.counter }),
        h('button', { onclick: () => appState.counter(appState.counter() + 1) }, "inc"),
        h('button', { onclick: () => appState.counter(appState.counter() - 1) }, "dec")
    )
}
```


# Does SVG supported?
Not yet but this is planned

# Why real DOM, why not virtual DOM?
Thar are million reasons to use real dom nodes and another million to use virtual dom.
In short:  because you don't need a virtual dom :)
My personal oppinion is that the price you pay for using vDOM is much bigger than what you get from it.
You can also read good explanation on this topic on [Surplus page](https://github.com/adamhaile/surplus) in FAQ section.
