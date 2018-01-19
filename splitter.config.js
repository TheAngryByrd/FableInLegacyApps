const path = require("path");
const fableUtils = require("fable-utils");

function resolve(relativePath) {
    return path.join(__dirname, relativePath);
}

module.exports = {
    entry: resolve("src/FableTestSplitter.fsproj"),
    outDir: resolve("out"),
    // fable: {
    //     define: ["DEBUG"]
    // },
    // babel: fableUtils.resolveBabelOptions({
    //     presets: [
    //         ["es2015", {
    //             modules: false
    //         }]
    //     ],
    //     sourceMaps: true,
    // }),
    allFiles: true
}