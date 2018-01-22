var path = require("path");
var webpack = require("webpack");
var fableUtils = require("fable-utils");
var pkg = require('./package.json');
var glob = require("glob");

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
    ]
});

module.exports = {
    entry: pageJs,
    output: {
        filename: '[name].bundle.js',
        path: __dirname + '/dist'
    },
    plugins: [
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