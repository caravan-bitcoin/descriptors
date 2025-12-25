---
"@caravan/descriptors": minor
---

Add BIP389 multipath descriptor support for `<0;1>/*` tuples. This covers the primary wallet use case where a single descriptor represents both external (receive) and internal (change) derivation paths. Note: Only `<0;1>/*` tuples are supported; arbitrary tuples like `<1;2;3>/*` are not currently supported.
