[![Test](https://github.com/caravan-bitcoin/descriptors/actions/workflows/ci.yml/badge.svg)](https://github.com/caravan-bitcoin/descriptors/actions/workflows/ci.yml)

# Caravan Descriptors

## Installation
@caravan/descriptors is built on top of bdk which is written in Rust. In order to leverage
bdk as the reference code, there are wasm bindings provided.

In order to build these, you will need Rust and wasm-pack. You may also need to install llvm/clang

```shell
$ curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh # https://www.rust-lang.org/tools/install
$ cargo install wasm-pack
```

You may also need to export some paths to build libsecp:

```shell
$ $ export PATH="/opt/homebrew/opt/llvm/bin:$PATH" \
# for older homebrew installs \
# export PATH="/usr/local/opt/llvm/bin:$PATH"
export CC=/opt/homebrew/opt/llvm/bin/clang \
export AR=/opt/homebrew/opt/llvm/bin/llvm-ar
```

## Usage
You can use npm scripts from the main directory to do all building

```shell
$ npm run build
```
This will cd into the rust directory, build packages for web and node
targets, and then build the artifacts for the js library to be packaged
and used.

```shell
$ npm run test
```
This will run the TypeScript tests only.

### Web
You'll need to make sure that the web environment this is used in
supports wasm. For example, if you're using in a vite.js project
you'll need the `vite-plugin-wasm` plugin.

Also note that all functions exported are async and need to be awaited
since they will load up the wasm modules to be used (this way consumers
of the library don't have to worry about loading up the modules themselves)

## Development
Make sure any PRs pass linting and tests. Changes that impact the API
will require a [changeset](https://github.com/changesets/changesets/blob/main/docs/adding-a-changeset.md)
in order to be merged.

The following command will launch the changeset cli:

```shell
$ npm run changeset
```

## API
NOTE: This is subject to change as this is still very much alpha

The two main functions available for import are:

### encodeDescriptors
Takes a config for a multisig wallet and encodes it into
the two corresponding descriptors

### decodeDescriptors
Take two descriptors and convert them into a multisig wallet
config object. This will make it possible to determine and parse the wallet type
(e.g. P2SH) and the key origins.

