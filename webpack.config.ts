//@ts-check

'use strict';

import * as webpack from 'webpack';
import * as path from 'path';
// eslint-disable-next-line @typescript-eslint/no-require-imports
import CopyPlugin = require('copy-webpack-plugin');

module.exports = () => {
  const config: webpack.Configuration = {
    target: 'node', // vscode extensions run in a Node.js-context 📖 -> https://webpack.js.org/configuration/node/
    entry: './src/extension.ts', // the entry point of this extension, 📖 -> https://webpack.js.org/configuration/entry-context/
    output: {
      // the bundle is stored in the 'out' folder (check package.json), 📖 -> https://webpack.js.org/configuration/output/
      path: path.resolve(__dirname, 'dist'),
      filename: 'extension.js',
      libraryTarget: 'commonjs2',
      devtoolModuleFilenameTemplate: '../[resource-path]'
    },
    devtool: 'inline-source-map',
    externals: {
      vscode: 'commonjs vscode' // the vscode-module is created on-the-fly and must be excluded. Add other modules that cannot be webpack'ed, 📖 -> https://webpack.js.org/configuration/externals/
    },
    resolve: {
      // support reading TypeScript and JavaScript files, 📖 -> https://github.com/TypeStrong/ts-loader
      extensions: ['.ts', '.js'],
      alias: {
        // The JavaScript client is ESM, so webpack resolves web-tree-sitter through
        // its `import` export condition and bundles the ESM build. That build's Node
        // loader calls createRequire(import.meta.url); webpack inlines the build
        // machine's file URL, which is invalid on Windows. The package's
        // CommonJS build derives its location from the runtime module (__dirname)
        // instead, so pin both the extension and the client to it. Resolving through
        // require picks the package's `require` export condition (web-tree-sitter.cjs).
        // eslint-disable-next-line @typescript-eslint/naming-convention
        'web-tree-sitter$': require.resolve('web-tree-sitter')
      }
    },
    module: {
      rules: [{
        test: /\.js$/,
        enforce: 'pre',
        use: ['source-map-loader'],
      }, {
        test: /\.ts$/,
        use: [{
          loader: 'ts-loader',
        }]
      }]
    },
    ignoreWarnings: [/Failed to parse source map/],
    plugins: [
      new webpack.ProvidePlugin({
        fetch: ['node-fetch', 'default'],
      }),
      new CopyPlugin({
        patterns: [{
          from: 'src/llmAnalysisReport.hbs'
        }, {
          from: 'node_modules/web-tree-sitter/web-tree-sitter.wasm',
          to: 'web-tree-sitter/[name][ext]'
        }, {
          // The CommonJS web-tree-sitter build resolves its runtime WASM relative to
          // the emitted bundle (__dirname) when Parser.init() is called without an
          // explicit locateFile, which is what the JavaScript client does. Keep a
          // copy next to the bundle so that path resolves inside the installed VSIX.
          from: 'node_modules/web-tree-sitter/web-tree-sitter.wasm',
          to: '[name][ext]'
        }, {
          from: 'node_modules/tree-sitter-python/tree-sitter-python.wasm',
          to: 'tree-sitter-python/[name][ext]'
        }]
      })
    ]
  };
  return config;
};
