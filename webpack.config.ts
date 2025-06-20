//@ts-check

'use strict';

import * as webpack from 'webpack';
import * as path from 'path';

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
      extensions: ['.ts', '.js']
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
    ]
  };
  return config;
};
