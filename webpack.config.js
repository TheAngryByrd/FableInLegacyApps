var path = require("path");
var webpack = require("webpack");
var fableUtils = require("fable-utils");
var pkg = require('./package.json');
var glob = require("glob");
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');

var pageJs =
    glob.sync("./out/Pages/**/*.js")
    .reduce(
        (acc, fileToPack) => {
            let outFile =
                fileToPack
                .split('Pages/')[1] //Get only the page specific files
                .replace(/\.[^/.]+$/, "") //Remove the extension
            acc["Pages/" + outFile] = fileToPack
            return acc;

        }, {})


var babelOptions = fableUtils.resolveBabelOptions({
    "presets": [
        ["env", {
            "modules": false
        }]
    ],
    "sourceMaps": true
});

module.exports = {
    entry: pageJs,
    devtool: 'source-map',
    output: {
        filename: '[name].bundle.js',
        path: __dirname + '/dist'
    },
    plugins: [
        // new UglifyJSPlugin({
        //     sourceMap: true
        // }),
        new webpack.optimize.CommonsChunkPlugin({
            name: "vendor",
            //https://jeremygayed.com/dynamic-vendor-bundling-in-webpack-528993e48aab
            minChunks: ({
                resource
            }) => {

                return /node_modules/.test(resource) //put into vendor chunk if node_modules
                    ||
                    /out\/fable/.test(resource);
            }

        }),
        new webpack.optimize.CommonsChunkPlugin({
            name: "shared",
            //https://jeremygayed.com/dynamic-vendor-bundling-in-webpack-528993e48aab
            minChunks: 2


        })

    ],
    module: {
        rules: [{
            test: /\.js$/,
            exclude: /node_modules/,
            use: {
                loader: 'babel-loader',
                options: babelOptions
            },
        }]
    }
}