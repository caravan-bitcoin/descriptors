# @caravan/descriptors

## 0.2.0

### Minor Changes

- 28545b6: Add BIP389 multipath descriptor support for `<0;1>/*` tuples. This covers the primary wallet use case where a single descriptor represents both external (receive) and internal (change) derivation paths. Note: Only `<0;1>/*` tuples are supported; arbitrary tuples like `<1;2;3>/*` are not currently supported.

## 0.1.1

### Patch Changes

- 05fded9: fix dependencies
- 1b6ebc2: Fix rust matcher with unreachable code

## 0.1.0

### Minor Changes

- 6ea86d3: add support for regtest network when encoding descriptors

## 0.0.6

### Patch Changes

- 521d899: ensure publication of right files

## 0.0.5

### Patch Changes

- e38d6f5: include more files for publish

## 0.0.4

### Patch Changes

- db86447: add npmignore to fix missing package

## 0.0.3

### Patch Changes

- afd4dd5: fix publication files

## 0.0.2

### Patch Changes

- 9b617c3: Update usage of types from caravan dependencies

## 0.0.1

### Patch Changes

- [#16](https://github.com/caravan-bitcoin/caravan/pull/16) [`fd35981`](https://github.com/caravan-bitcoin/caravan/commit/fd3598153b7c85a97f4cc281844e4aae8265c5b0) Thanks [@bucko13](https://github.com/bucko13)! - Add new package for encoding and decoding descriptors using bdk with wasm bindings.

- Updated dependencies [[`c8ac4d3`](https://github.com/caravan-bitcoin/caravan/commit/c8ac4d37f8e6e1c7e71010c7e7723468d63d8c75)]:
  - @caravan/bitcoin@0.0.3
