export function AmbiguousElement(nodeName, props, children) {
    this.nodeName = nodeName
    this.props = props
    this.children = children
}

export function isSvgNodeName(nodeName) {
    return svgTags.indexOf(nodeName) >= 0
}

export function isSvgAmbiguousNodeName(nodeName) {
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
]

const ambiguousSvgTags = ['a', 'font', 'title', 'script', 'style']