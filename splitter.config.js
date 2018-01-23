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
    ],
    "sourceMaps": true

});

module.exports = {

    allFiles: true,
    preserveAppFolderStructure: true,
    entry: resolve("src/FableTestSplitter.fsproj"),
    outDir: resolve("out"),
    babel: babelOptions
}