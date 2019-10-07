//@ts-check

'use strict';

const path = require('path');
const glob = require('glob');

/**@type {import('webpack').Configuration}*/
const config = {
  target: 'node', // vscode extensions run in a Node.js-context 📖 -> https://webpack.js.org/configuration/node/

  entry: {
    'src/extension': './src/extension.ts',
    'src/server': './node_modules/fabric8-analytics-lsp-server/server.js',
    /* 'test/all.test': glob.sync('./test/*.test.ts') */
    'test/all.test': ['./test/extension.test.ts', './test/ProjectDataProvider.test.ts']
  }, // the entry point of this extension, 📖 -> https://webpack.js.org/configuration/entry-context/
  output: {
    // the bundle is stored in the 'out' folder (check package.json), 📖 -> https://webpack.js.org/configuration/output/
    path: path.resolve(__dirname, 'out'),
    filename: '[name].js',
    libraryTarget: 'commonjs2',
    devtoolModuleFilenameTemplate: '../../[resource-path]'
  },
  devtool: 'source-map',
  externals: {
    vscode: 'commonjs vscode' // the vscode-module is created on-the-fly and must be excluded. Add other modules that cannot be webpack'ed, 📖 -> https://webpack.js.org/configuration/externals/
  },
  resolve: {
    // support reading TypeScript and JavaScript files, 📖 -> https://github.com/TypeStrong/ts-loader
    extensions: ['.ts', '.js']
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'ts-loader'
          }
        ]
      },
      {
        test: /\test.ts$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'ts-loader'
          },
          {
            loader: 'mocha-loader'
          }
        ]
      }
    ]
  }
};
module.exports = config;
