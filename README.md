[![tests](https://github.com/caravan-bitcoin/descriptors/actions/workflows/ci.yml/badge.svg)](https://github.com/caravan-bitcoin/descriptors/actions/workflows/ci.yml)
[![Release](https://github.com/caravan-bitcoin/descriptors/actions/workflows/release.yml/badge.svg)](https://github.com/caravan-bitcoin/descriptors/actions/workflows/release.yml)
[![npm](https://img.shields.io/npm/v/@caravan/descriptors)](https://www.npmjs.com/package/@caravan/descriptors)

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

### encodeDescriptors

Takes a config for a multisig wallet and encodes it into
the two corresponding descriptors (external/receive and internal/change).

```typescript
import { encodeDescriptors } from "@caravan/descriptors";

const config = {
  requiredSigners: 2,
  addressType: "P2SH",
  keyOrigins: [...],
  network: "bitcoin"
};

const { receive, change } = await encodeDescriptors(config);
// receive: "sh(sortedmulti(2,[...]/0/*,...))#checksum"
// change: "sh(sortedmulti(2,[...]/1/*,...))#checksum"
```

### encodeDescriptorWithMultipath

Takes a config for a multisig wallet and encodes it into a single
BIP389 multipath descriptor that covers both external and internal paths.

**Note:** Only `<0;1>/*` tuples are supported (not arbitrary tuples like `<1;2;3>/*`).

```typescript
import { encodeDescriptorWithMultipath } from "@caravan/descriptors";

const config = {
  requiredSigners: 2,
  addressType: "P2WSH",
  keyOrigins: [...],
  network: "bitcoin"
};

const multipathDescriptor = await encodeDescriptorWithMultipath(config);
// "wsh(sortedmulti(2,[...]/<0;1>/*,...))#checksum"
// This single descriptor represents both receive (0/*) and change (1/*) paths
```

### decodeDescriptors

Take two descriptors and convert them into a multisig wallet
config object. This will make it possible to determine and parse the wallet type
(e.g. P2SH) and the key origins.

```typescript
import { decodeDescriptors } from "@caravan/descriptors";

const external = "sh(sortedmulti(2,[...]/0/*,...))#checksum";
const internal = "sh(sortedmulti(2,[...]/1/*,...))#checksum";

const config = await decodeDescriptors(internal, external);
// Returns: { requiredSigners, addressType, keyOrigins, network }
```

### getWalletFromDescriptor

Takes a single descriptor (multipath or traditional) and converts it
into a multisig wallet config. Supports BIP389 multipath notation
(`/<0;1>/*`) and traditional notation (`/0/*` or `/1/*`).

**Note:** Only `<0;1>/*` multipath tuples are supported (not arbitrary tuples).

```typescript
import { getWalletFromDescriptor } from "@caravan/descriptors";

// Multipath descriptor (<0;1>/* only)
const multipathDesc = "wsh(sortedmulti(2,[...]/<0;1>/*,...))#checksum";
const config = await getWalletFromDescriptor(multipathDesc);

// Traditional descriptor
const traditionalDesc = "wsh(sortedmulti(2,[...]/0/*,...))#checksum";
const config2 = await getWalletFromDescriptor(traditionalDesc);
```

## BIP389 Multipath Descriptor Support

This library supports [BIP389](https://bips.dev/389/) multipath descriptor notation
for the `<0;1>/*` tuple case, which allows a single descriptor to represent both
external (receive) and internal (change) derivation paths.

**Note:** This implementation supports the `<0;1>/*` tuple format specifically,
which covers the primary wallet use case. BIP389 allows arbitrary tuples like
`<1;2;3>/*` or `<2147483647h;0;5>/*`, but those are not currently supported.

### Features

- ✅ **BIP389 Subset Compliant**: Full support for `<0;1>/*` multipath notation
- ✅ **Hardened Paths**: Supports hardened derivation indicators (`h`, `H`, `'`)
- ✅ **Validation**: Comprehensive BIP389 constraint validation for `<0;1>` tuples
- ✅ **Backwards Compatible**: Still supports traditional `/0/*` and `/1/*` notation

### Example: Multipath Descriptor

```typescript
// Single descriptor covering both receive and change paths
const multipathDescriptor =
  "wsh(sortedmulti(2,[d52d08fc/48h/1h/0h/2h]tpubXXX/<0;1>/*,[85b4d568/48h/1h/0h/2h]tpubYYY/<0;1>/*))#checksum";

// Parse into separate external and internal descriptors
import { getWalletFromDescriptor } from "@caravan/descriptors";
const config = await getWalletFromDescriptor(multipathDescriptor);
```

### Example: Creating Multipath Descriptor

```typescript
import { encodeDescriptorWithMultipath } from "@caravan/descriptors";

const walletConfig = {
  requiredSigners: 2,
  addressType: "P2WSH",
  keyOrigins: [
    {
      xfp: "d52d08fc",
      bip32Path: "m/48'/1'/0'/2'",
      xpub: "tpubXXX...",
    },
    {
      xfp: "85b4d568",
      bip32Path: "m/48'/1'/0'/2'",
      xpub: "tpubYYY...",
    },
  ],
  network: "testnet",
};

// Creates: "wsh(sortedmulti(2,[...]/<0;1>/*,...))#checksum"
const multipathDesc = await encodeDescriptorWithMultipath(walletConfig);
```

### Supported Hardened Path Formats

The library supports all BIP389 hardened path formats:

- `<0h;1h>/*` - Lowercase 'h'
- `<0H;1H>/*` - Uppercase 'H'
- `<0';1'>/*` - Apostrophe
- `<2147483647h;0>/*` - Large hardened values
- `<0;1h>/*` - Mixed hardened/unhardened
