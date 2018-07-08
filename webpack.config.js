/**
 * Created by wangweilin on 2017/6/9.
 */

// const UglifyJSPlugin = require('uglifyjs-webpack-plugin');

// const webpack = require('webpack');

var isWatch = false;
var isMini = true;

module.exports = {
    mode: isMini ? 'production' : 'none',
    entry: {
        'dist/index': './index.js',
        'demo/index': './index.js'
    },
    output: {
        filename: '[name].js',
        path: __dirname,
        library: 'drag',
        libraryTarget: 'umd',
        // umdNamedDefine: false
    },
    watch: isWatch,
    module: {
        rules: [{
            test: /\.js$/,
            exclude: /(node_modules|bower_components)/,
            use: {
                loader: 'babel-loader',
                options: {
                    presets: ['env'],
                    plugins: ["add-module-exports"]
                }
            }
        }]
    },
    plugins: []
}