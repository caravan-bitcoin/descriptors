import { MultisigWalletConfig } from "./descriptors";

// These test fixtures were generated with sparrow using a test multisig wallet.
interface DescriptorFixture {
  descriptor: string;
  checksum: string;
  keys: KeyOrigin[];
}

interface KeyOrigin {
  xfp: string;
  bip32Path: string;
  xpub: string;
}

interface MultipathDescriptorFixture {
  descriptor: string;
  checksum: string;
  keys: KeyOrigin[];
}

// This is slightly changed from the sparrow generated descriptor because
// sparrow does not seem to preserve key order. So the keys are kept consistent across
// all three fixtures which required a change in this fixture which impacts the checksum.
export const INTERNAL_BRAID: DescriptorFixture = {
  descriptor:
    "wsh(sortedmulti(2,[96cf6667/45h/1h/12h/2]tpubDEX9s9A6av9oHR89T9VArgrt4zg3zBGndMm6Q2LEaBiEF153K2yF2yewHWmfNicEUdBXzmaP7VBZvT5D3GG1m5cYy36qfsA9RQS1uYw3MGi/1/*,[611d202e/45h/1h/11h/2]tpubDEcXYgwH59Qbqs3qwFNkWLoWJ8zhJdY5bna4n5iUwWPouMuUXndbiFcf5X29Eq3SDBKc66mgACxDYMpjLPhucGLB33qdgCndKBGDmnZV9mU/1/*,[e0bbee43/0/0/0/0]tpubDEeGXbhQg9q8ZvPYs7GYiBXACgy4YYaew2CWSrs1u5auQwzuDhebd4m4ikBZ3KQKNvAtMhe5G6Nxek5QZw4gMqpywCuPvBHMrHPHBGgbDu7/1/*))",
  checksum: "53c6vhej",
  keys: [
    {
      xfp: "96cf6667",
      bip32Path: "m/45'/1'/12'/2",
      xpub: "tpubDEX9s9A6av9oHR89T9VArgrt4zg3zBGndMm6Q2LEaBiEF153K2yF2yewHWmfNicEUdBXzmaP7VBZvT5D3GG1m5cYy36qfsA9RQS1uYw3MGi",
    },
    {
      xfp: "e0bbee43",
      bip32Path: "m/0/0/0/0",
      xpub: "tpubDEeGXbhQg9q8ZvPYs7GYiBXACgy4YYaew2CWSrs1u5auQwzuDhebd4m4ikBZ3KQKNvAtMhe5G6Nxek5QZw4gMqpywCuPvBHMrHPHBGgbDu7",
    },
    {
      xfp: "611d202e",
      bip32Path: "m/45'/1'/11'/2",
      xpub: "tpubDEcXYgwH59Qbqs3qwFNkWLoWJ8zhJdY5bna4n5iUwWPouMuUXndbiFcf5X29Eq3SDBKc66mgACxDYMpjLPhucGLB33qdgCndKBGDmnZV9mU",
    },
  ],
};

export const EXTERNAL_BRAID: DescriptorFixture = {
  descriptor:
    "wsh(sortedmulti(2,[96cf6667/45h/1h/12h/2]tpubDEX9s9A6av9oHR89T9VArgrt4zg3zBGndMm6Q2LEaBiEF153K2yF2yewHWmfNicEUdBXzmaP7VBZvT5D3GG1m5cYy36qfsA9RQS1uYw3MGi/0/*,[611d202e/45h/1h/11h/2]tpubDEcXYgwH59Qbqs3qwFNkWLoWJ8zhJdY5bna4n5iUwWPouMuUXndbiFcf5X29Eq3SDBKc66mgACxDYMpjLPhucGLB33qdgCndKBGDmnZV9mU/0/*,[e0bbee43/0/0/0/0]tpubDEeGXbhQg9q8ZvPYs7GYiBXACgy4YYaew2CWSrs1u5auQwzuDhebd4m4ikBZ3KQKNvAtMhe5G6Nxek5QZw4gMqpywCuPvBHMrHPHBGgbDu7/0/*))",
  checksum: "jakhj6fe",
  keys: INTERNAL_BRAID.keys,
};

export const MULTIPATH: MultipathDescriptorFixture = {
  descriptor:
    "wsh(sortedmulti(2,[96cf6667/45h/1h/12h/2]tpubDEX9s9A6av9oHR89T9VArgrt4zg3zBGndMm6Q2LEaBiEF153K2yF2yewHWmfNicEUdBXzmaP7VBZvT5D3GG1m5cYy36qfsA9RQS1uYw3MGi/<0;1>/*,[611d202e/45h/1h/11h/2]tpubDEcXYgwH59Qbqs3qwFNkWLoWJ8zhJdY5bna4n5iUwWPouMuUXndbiFcf5X29Eq3SDBKc66mgACxDYMpjLPhucGLB33qdgCndKBGDmnZV9mU/<0;1>/*,[e0bbee43/0/0/0/0]tpubDEeGXbhQg9q8ZvPYs7GYiBXACgy4YYaew2CWSrs1u5auQwzuDhebd4m4ikBZ3KQKNvAtMhe5G6Nxek5QZw4gMqpywCuPvBHMrHPHBGgbDu7/<0;1>/*))",
  checksum: "9elkxhm0",
  keys: INTERNAL_BRAID.keys,
};

export const TEST_MULTISIG_CONFIG = {
  name: "Pam's Client Cosign Vault",
  addressType: "P2WSH",
  network: "testnet",
  client: {
    type: "public",
  },
  requiredSigners: 2,
  keyOrigins: INTERNAL_BRAID.keys,
} as MultisigWalletConfig;
