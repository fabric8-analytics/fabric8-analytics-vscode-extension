//@ts-check

'use strict';

import * as webpack from 'webpack';

const path = require('path');
const glob = require('glob');

module.exports = (env, argv) => {

  let entry = {
    'extension': './src/extension.ts',
    'server': './node_modules/@fabric8-analytics/fabric8-analytics-lsp-server/dist/server.js',
  };
  /**@type {import('webpack').Configuration}*/
  const config = {
    target: 'node', // vscode extensions run in a Node.js-context 📖 -> https://webpack.js.org/configuration/node/

    entry: entry, // the entry point of this extension, 📖 -> https://webpack.js.org/configuration/entry-context/
    output: {
      // the bundle is stored in the 'out' folder (check package.json), 📖 -> https://webpack.js.org/configuration/output/
      path: path.resolve(__dirname, 'dist'),
      filename: '[name].js',
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
      },
      {
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
