# Integrating Fable Into Legacy Project


Let's say you have an older website but want to integrate Fable into that website.  Most javascript tutorials seem to be under the impression you would like to do greenfield or SPA type applications.  Also it may be the case that terminology across these languages is becoming difficult to map to and from.

In our scenario here, we have a multipage application that has the notion of a javascript file per page.   Something like:

```
 tree
.
├── pages
│   ├── feature1
│   │   ├── details.cshtml
│   │   └── list.cshtml
│   └── feature2
│       ├── dashboard.cshtml
│       └── ticker.cshtml
└── scripts
    ├── feature1
    │   ├── details.js
    │   └── list.js
    ├── feature2
    │   ├── dashboard.js
    │   └── ticker.js
    └── someGlobalFileBecauseLegacy.js

```

What we want to do is start migrating those javascript files to F# Fable but not have to retool our entire stack.  To do this we'll need a combo of different techniques.

We'll need to use [webpack](https://webpack.js.org) because [bundling is a good idea](https://medium.com/@andrejsabrickis/modern-approach-of-javascript-bundling-with-webpack-3b7b3e5f4e7). Webpack doesn't know anything about Fable but, it allows people a way to teach webpack about how to process files called [loaders](https://webpack.js.org/loaders/)  The problem is that [fable-loader](https://www.npmjs.com/package/fable-loader) expects a single `entrypoint`.  Now what exactly is an `entrypoint`?  In a single page application it's basically the file with the notion of a `main` function. In our case it will be every single page.  And to achieve our goal of 1 javascript file per page, we'd need to create an fsproj per page.  Seems overkill. 

However Fable supplies a tool [fable-spliiter](https://www.npmjs.com/package/fable-splitter) that "compiles F# files to individual JS files." Now this sounds like what we want, but it doesn't do the bundling that webpack gives us.  So the goal of this repo is to show how to use both to get the effect we're looking for.

Let's quickly look at the project structure for this

```
.
├── FableTestSplitter.fsproj
├── Main.fs
├── Pages
│   ├── feature1
│   │   └── list.fs
│   └── feature2
│       └── dashboard.fs
├── SomeSharedCode.fs
└── paket.references
```

We all the javascript files we'll eventually replace in a tree structure similar to what we had before but as F# files. WARNING: Currently we have to references all files in Main.fs because `allFiles` [is broke currently](https://github.com/fable-compiler/Fable/issues/1165) but should be fixed soon. 


Now let's run fable splitter. To get started we'll need to use the fable dotnet tool and we'll need to run it from the directory with our fsproj file. `cd src && dotnet restore` then `dotnet fable npm-run splitter`.  This will run the `splitter` script in `package.json` with the fable daemon started.  

Our output directory ends up looking like:

```
Awaiting bugfix https://github.com/fable-compiler/Fable/issues/1333
```

So we have all the F# files we want transpiled to javascript.  Now we need to run the webpack bundler over them so we can pull in the required modules.  `dotnet fable npm-run webpack`


```
Awaiting bugfix https://github.com/fable-compiler/Fable/issues/1333
```

So now we have javascript suitable to be used in the browser. Cool! So what magic did we use to achieve this output? In the `webpack.config.js` , we'll need to set [multiple entry points](https://webpack.js.org/concepts/entry-points/#multi-page-application) dynamically by using the glob pattern matching:

```
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
```

Then to tell webpack to output each entrypoint by name we have to use this `[name].bundle.js` template.

```
module.exports = {
    entry: pageJs,
    output: {
        filename: '[name].bundle.js',
        path: __dirname + '/dist'
    }, ... rest of file
```


Then to pack up all the vendor stuff into a common library we'll use the [CommonChunkPlugin](https://webpack.js.org/plugins/commons-chunk-plugin/)

```
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
```

This will pull all fable and node_module depedencies into a vendor bundle so we don't have to reference it once.  


## Requirements

* [dotnet SDK](https://www.microsoft.com/net/download/core) 2.0 or higher
* [node.js](https://nodejs.org) 6.11 or higher
* A JS package manager: [yarn](https://yarnpkg.com) or [npm](http://npmjs.com/)

> npm comes bundled with node.js, but we recommend to use at least npm 5. If you have npm installed, you can upgrade it by running `npm install -g npm`.

Although is not a Fable requirement, on macOS and Linux you'll need [Mono](http://www.mono-project.com/) for other F# tooling like Paket or editor support.

## Editor

The project can be used by editors compatible with the new .fsproj format, like VS Code + [Ionide](http://ionide.io/), Emacs with [fsharp-mode](https://github.com/fsharp/emacs-fsharp-mode) or [Rider](https://www.jetbrains.com/rider/). **Visual Studio for Mac** is also compatible but in the current version the package auto-restore function conflicts with Paket so you need to disable it: `Preferences > Nuget > General`.

## Installing the template

In a terminal, run `dotnet new -i Fable.Template` to install or update the template to the latest version.

## Creating a new project with the template

In a terminal, run `dotnet new fable` to create a project in the current directory. Type `dotnet new fable -n MyApp` instead to create a subfolder named `MyApp` and put the new project there.

> The project will have the name of the directory. You may get some issues if the directory name contains some special characters like hyphens

## Building and running the app

> In the commands below, yarn is the tool of choice. If you want to use npm, just replace `yarn` by `npm` in the commands.

* Install JS dependencies: `yarn install`
* **Move to `src` folder**: `cd src`
* Install F# dependencies: `dotnet restore`
* Start Fable daemon and [Webpack](https://webpack.js.org/) dev server: `dotnet fable yarn-start`
* In your browser, open: http://localhost:8080/

> `dotnet fable yarn-start` (or `npm-start`) is used to start the Fable daemon and run a script in package.json concurrently. It's a shortcut of `yarn-run [SCRIPT_NAME]`, e.g. `dotnet fable yarn-run start`.

If you are using VS Code + [Ionide](http://ionide.io/), you can also use the key combination: Ctrl+Shift+B (Cmd+Shift+B on macOS) instead of typing the `dotnet fable yarn-start` command. This also has the advantage that Fable-specific errors will be highlighted in the editor along with other F# errors.

Any modification you do to the F# code will be reflected in the web page after saving. When you want to output the JS code to disk, run `dotnet fable yarn-build` and you'll get a minified JS bundle in the `public` folder.

## JS Output

This template uses [babel-preset-env](http://babeljs.io/env) to output JS code whose syntax is compatible with a wide range of browsers. Currently it's set to support browsers with at least 1% of market share. To change this (for example, if you don't need to support IE), [replace this line](https://github.com/fable-compiler/fable-templates/blob/7b9352cdaeb77ecd600b45ed4eab2f41c73b85e4/simple/Content/webpack.config.js#L13) with a query understood by [browserl.ist](http://browserl.ist/?q=%3E+1%25).

To replace objects and APIs that may be missing in old browsers, the `index.html` file [submits a request](https://github.com/fable-compiler/fable-templates/blob/7b9352cdaeb77ecd600b45ed4eab2f41c73b85e4/simple/Content/public/index.html#L8) to [cdn.polyfill.io](https://polyfill.io/v2/docs/) that tailors the polyfill according to the user's browser.

## Project structure

### Paket

[Paket](https://fsprojects.github.io/Paket/) is the package manager used for F# dependencies. It doesn't need a global installation, the binary is included in the `.paket` folder. Other Paket related files are:

- **paket.dependencies**: contains all the dependencies in the repository.
- **paket.references**: there should be one such a file next to each `.fsproj` file.
- **paket.lock**: automatically generated, but should be committed to source control, [see why](https://fsprojects.github.io/Paket/faq.html#Why-should-I-commit-the-lock-file).
- **Nuget.Config**: prevents conflicts with Paket in machines with some Nuget configuration.

> Paket dependencies will be installed in the `packages` directory. See [Paket website](https://fsprojects.github.io/Paket/) for more info.

### yarn/npm

- **package.json**: contains the JS dependencies together with other info, like development scripts.
- **yarn.lock**: is the lock file created by yarn.
- **package-lock.json**: is the lock file understood by npm 5, if you use it instead of yarn.

> JS dependencies will be installed in `node_modules`. See [yarn](https://yarnpkg.com) and/or [npm](http://npmjs.com/) websites for more info.

### Webpack

[Webpack](https://webpack.js.org) is a bundler, which links different JS sources into a single file making deployment much easier. It also offers other features, like a static dev server that can automatically refresh the browser upon changes in your code or a minifier for production release. Fable interacts with Webpack through the `fable-loader`.

- **webpack.config.js**: is the configuration file for Webpack. It allows you to set many things: like the path of the bundle, the port for the development server or [Babel](https://babeljs.io/) options. See [Webpack website](https://webpack.js.org) for more info.

> Make sure to resolve all the paths [as well as Babel options](https://github.com/fable-compiler/fable-templates/blob/7b9352cdaeb77ecd600b45ed4eab2f41c73b85e4/simple/Content/webpack.config.js#L9) to make sure all the files referenced by Fable will be found by Babel/Webpack.

### F# source files

The template only contains two F# source files: the project (.fsproj) and a source file (.fs) in `src` folder.

## Where to go from here

Check more [Fable samples](https://github.com/fable-compiler/samples-browser), use another template like `Fable.Template.Elmish.React` or `SAFE.Template`, and check the [awesome-fable](https://github.com/kunjee17/awesome-fable#-awesome-fable) for a curated list of resources provided by the community.