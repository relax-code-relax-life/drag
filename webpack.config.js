/**
 * Created by wangweilin on 2017/6/9.
 */

// const UglifyJSPlugin = require('uglifyjs-webpack-plugin');

// const webpack = require('webpack');


var isDev = false;

module.exports = {
    mode: isDev ? 'none' : 'production',
    entry: {
        main: './index.js'
    },
    output: {
        filename: 'index.js',
        path: __dirname + '/dist',
        library: 'drag',
        libraryTarget: 'umd',
        umdNamedDefine: false
    },
    watch: isDev,
    module: {
        rules: [{
            test: /\.js$/,
            exclude: /(node_modules|bower_components)/,
            use: {
                loader: 'babel-loader',
                options: {
                    presets: ['env']
                }
            }
        }]
    },
    plugins: []
}