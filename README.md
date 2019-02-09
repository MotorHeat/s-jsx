# s-jsx
This is yet another JavaScript view library that manages application state using [S.js](https://github.com/adamhaile/S) signals and creates real DOM nodes (similar to Surplus, Solid and otthers).
It allows you to define your view in JavaScript using JSX syntax.

# Intro
This project was inspired by [S.js](https://github.com/adamhaile/S) and [Surplus](https://github.com/adamhaile/surplus)
While Surplus implements own compiler that transpiles JSX syntax to a plain JavaScript this library implements the JSX Factory function that creates real DOM nodes and manages S-computations. 

# How it differs from Surplus?
- You don't need a special compiler, you can use any existing JSX transpilers (Babel, TypeScript)
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

# Why real DOM, why not virtual DOM?
Thar are million reasons for that and another million not to use it. 
In short - because you don't need a virtual dom, the price you pay for using it is much bigger that what you get from it.
You can also read good explanation on this topic on [Surplus page](https://github.com/adamhaile/surplus).
