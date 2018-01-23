const path = require("path");
const fableUtils = require("fable-utils");

function resolve(relativePath) {
    return path.join(__dirname, relativePath);
}

var babelOptions = fableUtils.resolveBabelOptions({
    "presets": [
        ["env", {
            "modules": false
        }]
    ]
});

module.exports = {

    allFiles: true,
    entry: resolve("src/FableTestSplitter.fsproj"),
    outDir: resolve("out/Pages"),
    babel: babelOptions
}
