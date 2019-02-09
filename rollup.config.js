export default {
    input: 'src/s-jsx.js',
    output: {
        file: 'index.js',
        format: 'umd',
        exports: 'named',
        name: 's-jsx',
        globals: { 's-js': "S"}
    },
    external: ['s-js'],
}