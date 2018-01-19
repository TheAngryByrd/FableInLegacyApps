var path = require("path");
var webpack = require("webpack");
var fableUtils = require("fable-utils");
var pkg = require('./package.json');
var glob = require("glob");

var pageJs =
    glob.sync("./out/Pages/**/*.js")
    .reduce(
        (acc, next) => {
            let outFile = next.split('Pages/')[1].replace(/\.[^/.]+$/, "")
            acc["Pages/" + outFile] = next
            return acc;

        }, {}) //.map(pageFilePath => 


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
            // filename: "vendor.js"
            // (Give the chunk a different name)

            minChunks: Infinity,
            // (with more entries, this ensures that no other module
            //  goes into the vendor chunk)
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