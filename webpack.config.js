var path = require("path");
var webpack = require("webpack");
var fableUtils = require("fable-utils");
var glob = require("glob");
var UglifyJSPlugin = require('uglifyjs-webpack-plugin');

var pageJs =
    glob.sync("./src/scripts/**/*.fs")
    .reduce(
        (acc, fileToPack) => {
            let outFile =
                fileToPack
                .split('scripts/')[1] //Get only the page specific files
                .replace(/\.[^/.]+$/, "") //Remove the extension
            acc["scripts/" + outFile] = fileToPack
            return acc;

        }, {})




function resolve(filePath) {
    return path.join(__dirname, filePath)
}

var isProduction = process.argv.indexOf("-p") >= 0;
var port =
    process.env.FABLE_SERVER_PORT != null ?
    parseInt(process.env.FABLE_SERVER_PORT, 10) :
    61225;
console.log("Bundling for " + (isProduction ? "production" : "development") + "...");

let plugins = [
    new webpack.optimize.CommonsChunkPlugin({
        name: "vendor",
        //https://jeremygayed.com/dynamic-vendor-bundling-in-webpack-528993e48aab
        minChunks: ({
            resource
        }) => {

            return /node_modules/.test(resource) ||
                /.nuget/.test(resource);
        }

    }),
    // new webpack.optimize.CommonsChunkPlugin({
    //     name: "shared",
    //     //https://jeremygayed.com/dynamic-vendor-bundling-in-webpack-528993e48aab
    //     minChunks: 2


    // })
]
if (!isProduction) {
    plugins.push(new webpack.HotModuleReplacementPlugin());
    plugins.push(new webpack.NamedModulesPlugin());
} else {
    plugins.push(new UglifyJSPlugin({
        sourceMap: true
    }));
}



let msg = {
    path: resolve("./src/FableTestSplitter.fsproj")
}


let preppedFableWithProject = fableUtils.client.send(port, JSON.stringify(msg)).then(() => {

    var babelOptions = fableUtils.resolveBabelOptions({
        presets: [
            ["env", {
                "targets": {
                    "browsers": ["last 2 versions"]
                },
                "modules": false
            }]
        ],
        plugins: ["transform-runtime"]
    });




    return {
        devtool: "source-map",
        entry: pageJs,
        output: {
            filename: '[name].bundle.js',
            path: __dirname + '/dist'
        },
        resolve: {
            modules: [resolve("./node_modules/")]
        },
        devServer: {
            proxy: {
                '/api/*': {
                    target: 'http://localhost:' + port,
                    changeOrigin: true
                }
            },
            hot: true,
            inline: true
        },
        module: {
            rules: [{
                test: /\.fs(x|proj)?$/,
                use: {
                    loader: "fable-loader",
                    options: {
                        babel: babelOptions,
                        define: isProduction ? [] : ["DEBUG"]
                    }
                }
            }, {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: babelOptions
                },
            }]
        },
        plugins: plugins
    }
});


module.exports = preppedFableWithProject;