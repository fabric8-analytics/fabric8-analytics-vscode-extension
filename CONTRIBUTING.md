# How to contribute

Contributions are essential for keeping this extension great.
We try to keep it as easy as possible to contribute changes and we are
open to suggestions for making it even easier.
There are only a few guidelines that we need contributors to follow.

## First Time Setup
1. Install prerequisites:
   * latest [Visual Studio Code](https://code.visualstudio.com/)
   * [Node.js](https://nodejs.org/) v4.0.0 or higher
2. Fork and clone the repository
3. `cd fabric8-analytics-vscode-extension`
4. Install the dependencies:

	```bash
	$ npm install
	```
5. Open the folder in VS Code

## Run the extension locally

1. Install `vsce` - A command line tool you'll use to publish extensions to the Extension Marketplace.
    ```bash
    $ npm install -g vsce
    ```
2. From root folder, run the below command.
    ```bash
    $ vsce package
    ```
3. `fabric8-analytics-<version>.vsix` file is created. Install it by following the instructions [here](https://code.visualstudio.com/docs/editor/extension-gallery#_install-from-a-vsix).

> If you have any questions or run into any problems, please post an issue - we'll be very happy to help.