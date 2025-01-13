import { Network } from "@caravan/bitcoin";
import {
  MultisigWalletConfig,
  decodeDescriptors,
  encodeDescriptors,
  encodeDescriptorWithMultipath,
  getChecksum,
  getWalletFromDescriptor,
  getFingerprintFromBip380Descriptor,
} from "./descriptors";
import {
  EXTERNAL_BRAID,
  INTERNAL_BRAID,
  MULTIPATH,
  TEST_MULTISIG_CONFIG,
} from "./fixtures";

const external =
  "sh(sortedmulti(2,[f57ec65d/45'/0'/100']xpub6CCHViYn5VzPfSR7baop9FtGcbm3UnqHwa54Z2eNvJnRFCJCdo9HtCYoLJKZCoATMLUowDDA1BMGfQGauY3fDYU3HyMzX4NDkoLYCSkLpbH/0/*,[efa5d916/45'/0'/100']xpub6Ca5CwTgRASgkXbXE5TeddTP9mPCbYHreCpmGt9dhz9y6femstHGCoFESHHKKRcm414xMKnuLjP9LDS7TwaJC9n5gxua6XB1rwPcC6hqDub/0/*))#uxj9xxul";
const internal =
  "sh(sortedmulti(2,[f57ec65d/45'/0'/100']xpub6CCHViYn5VzPfSR7baop9FtGcbm3UnqHwa54Z2eNvJnRFCJCdo9HtCYoLJKZCoATMLUowDDA1BMGfQGauY3fDYU3HyMzX4NDkoLYCSkLpbH/1/*,[efa5d916/45'/0'/100']xpub6Ca5CwTgRASgkXbXE5TeddTP9mPCbYHreCpmGt9dhz9y6femstHGCoFESHHKKRcm414xMKnuLjP9LDS7TwaJC9n5gxua6XB1rwPcC6hqDub/1/*))#3hxf9z66";

const expectedKeys = [
  {
    xfp: "f57ec65d",
    bip32Path: "m/45'/0'/100'",
    xpub: "xpub6CCHViYn5VzPfSR7baop9FtGcbm3UnqHwa54Z2eNvJnRFCJCdo9HtCYoLJKZCoATMLUowDDA1BMGfQGauY3fDYU3HyMzX4NDkoLYCSkLpbH",
  },
  {
    xfp: "efa5d916",
    bip32Path: "m/45'/0'/100'",
    xpub: "xpub6Ca5CwTgRASgkXbXE5TeddTP9mPCbYHreCpmGt9dhz9y6femstHGCoFESHHKKRcm414xMKnuLjP9LDS7TwaJC9n5gxua6XB1rwPcC6hqDub",
  },
];

const expectedConfig = {
  addressType: "P2SH",
  requiredSigners: 2,
  keyOrigins: expectedKeys,
  network: "mainnet",
} as MultisigWalletConfig;

const testInternal =
  "sh(sortedmulti(2,[611d202e/45'/1'/11'/3]tpubDEcXYgwH59QbtaS1q7CNskaL23oXnePHiU5zQuVDTDbSfM2xx5WYKaqgpfKnjAzgrHymmA7rZYmgtLKpugFq4dWJEC6HPpeUrMjFprLx8fW/1/*,[3e191e15/0/0/0/0]tpubDEeGXbhQg9q8ch8RvufnqvK4FPTRxidayvdb4Z24eyGUBSHsEBhQ8jaGZ4acKUzfP3FgVChNEPB47KzMHJbaL2WzvQqijrFTbSUqoHvXuoE/1/*,[96cf6667/45'/1'/12'/2]tpubDEX9s9A6av9oHR89T9VArgrt4zg3zBGndMm6Q2LEaBiEF153K2yF2yewHWmfNicEUdBXzmaP7VBZvT5D3GG1m5cYy36qfsA9RQS1uYw3MGi/1/*))#j8hgkfxv";
const testExternal =
  "sh(sortedmulti(2,[611d202e/45'/1'/11'/3]tpubDEcXYgwH59QbtaS1q7CNskaL23oXnePHiU5zQuVDTDbSfM2xx5WYKaqgpfKnjAzgrHymmA7rZYmgtLKpugFq4dWJEC6HPpeUrMjFprLx8fW/0/*,[3e191e15/0/0/0/0]tpubDEeGXbhQg9q8ch8RvufnqvK4FPTRxidayvdb4Z24eyGUBSHsEBhQ8jaGZ4acKUzfP3FgVChNEPB47KzMHJbaL2WzvQqijrFTbSUqoHvXuoE/0/*,[96cf6667/45'/1'/12'/2]tpubDEX9s9A6av9oHR89T9VArgrt4zg3zBGndMm6Q2LEaBiEF153K2yF2yewHWmfNicEUdBXzmaP7VBZvT5D3GG1m5cYy36qfsA9RQS1uYw3MGi/0/*))#medls6ae";

const testKeys = [
  {
    xfp: "611d202e",
    bip32Path: "m/45'/1'/11'/3",
    xpub: "tpubDEcXYgwH59QbtaS1q7CNskaL23oXnePHiU5zQuVDTDbSfM2xx5WYKaqgpfKnjAzgrHymmA7rZYmgtLKpugFq4dWJEC6HPpeUrMjFprLx8fW",
  },
  {
    xfp: "3e191e15",
    bip32Path: "m/0/0/0/0",
    xpub: "tpubDEeGXbhQg9q8ch8RvufnqvK4FPTRxidayvdb4Z24eyGUBSHsEBhQ8jaGZ4acKUzfP3FgVChNEPB47KzMHJbaL2WzvQqijrFTbSUqoHvXuoE",
  },
  {
    xfp: "96cf6667",
    bip32Path: "m/45'/1'/12'/2",
    xpub: "tpubDEX9s9A6av9oHR89T9VArgrt4zg3zBGndMm6Q2LEaBiEF153K2yF2yewHWmfNicEUdBXzmaP7VBZvT5D3GG1m5cYy36qfsA9RQS1uYw3MGi",
  },
];

const testConfig = (
  config: MultisigWalletConfig,
  expected: MultisigWalletConfig = expectedConfig,
) => {
  expect(config.addressType).toEqual(expected.addressType);
  expect(config.requiredSigners).toEqual(expected.requiredSigners);

  for (const expectedKey of expected.keyOrigins) {
    expect(config.keyOrigins).toContainEqual(expectedKey);
  }
};

describe("decodeDescriptors", () => {
  it("works", async () => {
    const config = await decodeDescriptors(internal, external);
    testConfig(config);
  });

  it("should throw if called with inconsistent network", async () => {
    // Jest's "expect...toThrowError" doesn't work for some reason here
    let passed = false;
    try {
      await decodeDescriptors(testInternal, testExternal, Network.MAINNET);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      if (e instanceof Error) {
        passed = true;
        expect(e.message).toMatch("xpubs do not match expected network");
      }
    }
    expect(passed).toBeTruthy();
    passed = false;
    try {
      await decodeDescriptors(internal, external, Network.TESTNET);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      if (e instanceof Error) {
        passed = true;
        expect(e.message).toMatch("xpubs do not match expected network");
      }
    }
    expect(passed).toBeTruthy();
  });
});

describe("encodeDescriptors", () => {
  let config;

  beforeEach(() => {
    config = {
      addressType: "P2SH",
      keyOrigins: expectedKeys,
      requiredSigners: 2,
      network: "mainnet",
    } as MultisigWalletConfig;
  });

  it("should convert a config to descriptors", async () => {
    const actual = await encodeDescriptors(config);
    expect(actual.receive).toEqual(external);
    expect(actual.change).toEqual(internal);
  });

  it("should support test networks", async () => {
    for (const network of [Network.TESTNET, Network.REGTEST]) {
      config.network = network;
      config.keyOrigins = testKeys;
      const actual = await encodeDescriptors(config);
      expect(actual.receive).toEqual(testExternal);
      expect(actual.change).toEqual(testInternal);
    }
  });
});

describe("getWalletFromDescriptor", () => {
  it("should convert a receive descriptor to a wallet", async () => {
    const config = await getWalletFromDescriptor(external);
    testConfig(config);
  });
  it("should convert a change descriptor to a wallet", async () => {
    const config = await getWalletFromDescriptor(internal);
    testConfig(config);
  });
  it("should fail if passed with inconsistent network", async () => {
    let passed = false;
    try {
      await getWalletFromDescriptor(internal, Network.TESTNET);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      if (e instanceof Error) {
        passed = true;
        expect(e.message).toMatch("xpubs do not match expected network");
      }
    }
    expect(passed).toBeTruthy();
  });

  it("should convert a multipath descriptor to a wallet", async () => {
    const config = await getWalletFromDescriptor(MULTIPATH.descriptor);
    testConfig(config, TEST_MULTISIG_CONFIG);
  });
});

describe("getChecksum", () => {
  const checksumTests = [
    [
      "internal braid descriptor",
      `${INTERNAL_BRAID.descriptor}#${INTERNAL_BRAID.checksum}`,
      INTERNAL_BRAID.checksum,
    ],
    [
      "external braid descriptor",
      `${EXTERNAL_BRAID.descriptor}#${EXTERNAL_BRAID.checksum}`,
      EXTERNAL_BRAID.checksum,
    ],
    [
      "multipath descriptor",
      `${MULTIPATH.descriptor}#${MULTIPATH.checksum}`,
      MULTIPATH.checksum,
    ],
  ];

  it.each(checksumTests)(
    "should return correct checksum for %s",
    async (_, descriptor, expectedChecksum) => {
      const checksum = await getChecksum(descriptor);
      expect(checksum).toEqual(expectedChecksum);
    },
  );

  it("should throw if invalid or missing checksum", async () => {
    let passed = false;
    const descriptorWithoutChecksum = INTERNAL_BRAID.descriptor;
    const invalids = [
      descriptorWithoutChecksum,
      `${INTERNAL_BRAID.descriptor}#${INTERNAL_BRAID.checksum}asdf`,
      `${descriptorWithoutChecksum}#123`,
      `${descriptorWithoutChecksum}#1234abcd`,
    ];
    for (const test of invalids) {
      try {
        await getChecksum(test);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (e: any) {
        if (e instanceof Error) {
          passed = true;
        }
      }
      expect(passed).toBeTruthy();
    }
  });
});

// New tests for <0;1> multipath notation support
describe("Multipath Notation Support (<0;1>)", () => {
  describe("getWalletFromDescriptor with multipath notation", () => {
    it("should decode descriptor with standard <0;1> notation", async () => {
      const descriptor = `${MULTIPATH.descriptor}#${MULTIPATH.checksum}`;
      const config = await getWalletFromDescriptor(descriptor, Network.TESTNET);

      testConfig(config, TEST_MULTISIG_CONFIG);
    });
  });

  describe("encodeDescriptorWithMultipath", () => {
    it("should encode config to a single multipath notation descriptor", async () => {
      // NOTE: the keys can come in in different orders and the paths can be indicate hardening
      // with `'` or `h` or `H` so the checksums and the paths are harder to check for equality.
      const result = await encodeDescriptorWithMultipath(TEST_MULTISIG_CONFIG);

      // Should be a single string, not an object
      expect(typeof result).toBe("string");

      // The result should contain <0;1> notation
      expect(result).toContain("<0;1>");

      // Verify checksum is present
      expect(result).toMatch(/#[0-9a-z]{8}$/);

      // Extract descriptor without checksum
      const descriptorWithoutChecksum = result.split("#")[0];

      // Verify the descriptor contains keys with multipath notation
      // Note: BDK may use either ' or h for hardened derivation
      expect(descriptorWithoutChecksum).toContain("/<0;1>/*");

      // Verify all keys have multipath notation
      const multipathNotationCount = (
        descriptorWithoutChecksum.match(/\/<0;1>\/\*/g) || []
      ).length;
      expect(multipathNotationCount).toBe(MULTIPATH.keys.length);

      for (const key of MULTIPATH.keys) {
        expect(result).toContain(key.xpub);
        expect(result).toContain(key.xfp);
      }
    });

    it("should generate valid checksum for range notation descriptor", async () => {
      const result = await encodeDescriptorWithMultipath(TEST_MULTISIG_CONFIG);

      // Extract the checksum from the result
      const parts = result.split("#");
      expect(parts).toHaveLength(2);
      const generatedChecksum = parts[1];

      // The checksum should be 8 characters long
      expect(generatedChecksum).toHaveLength(8);

      // The checksum should only contain valid bech32 characters
      expect(generatedChecksum).toMatch(
        /^[qpzry9x8gf2tvdw0s3jn54khce6mua7l]{8}$/,
      );

      // Verify we can decode the descriptor (validates checksum is correct)
      await expect(
        getWalletFromDescriptor(result, Network.TESTNET),
      ).resolves.toBeDefined();
    });
  });

  describe("Round-trip with multipath notation", () => {
    it("should successfully round-trip encode and decode with multipath notation", async () => {
      // Start with multipath descriptor from fixture
      const multipathDescriptorWithChecksum = `${MULTIPATH.descriptor}#${MULTIPATH.checksum}`;
      const decoded = await getWalletFromDescriptor(
        multipathDescriptorWithChecksum,
        Network.TESTNET,
      );

      // Encode it back (should use multipath notation if flag is set)
      const encoded = await encodeDescriptors(decoded);

      // Decode again
      const reDecoded = await getWalletFromDescriptor(
        encoded.receive,
        Network.TESTNET,
      );

      // Verify the config remains consistent
      expect(reDecoded.addressType).toEqual(decoded.addressType);
      expect(reDecoded.requiredSigners).toEqual(decoded.requiredSigners);
      expect(reDecoded.keyOrigins.length).toEqual(decoded.keyOrigins.length);

      for (let i = 0; i < decoded.keyOrigins.length; i++) {
        expect(reDecoded.keyOrigins[i].xfp).toEqual(decoded.keyOrigins[i].xfp);
        expect(reDecoded.keyOrigins[i].xpub).toEqual(
          decoded.keyOrigins[i].xpub,
        );
      }
    });
  });

  describe("Different script types with multipath notation", () => {
    it("should decode P2WSH descriptor with multipath notation", async () => {
      const descriptor = `${MULTIPATH.descriptor}#${MULTIPATH.checksum}`;
      const config = await getWalletFromDescriptor(descriptor, Network.TESTNET);
      expect(config.addressType).toEqual("P2WSH");
      expect(config.keyOrigins.length).toEqual(MULTIPATH.keys.length);
    });
  });
});

describe("getFingerprintFromBip380Descriptor", () => {
  it("should extract fingerprint from BIP380 descriptor with key origin", () => {
    // Test vector from BIP380: wpkh with key origin
    const descriptor =
      "wpkh([d34db33f/44'/0'/0']xpub6ERApfZwUNrhLCkDtcHTcxd75RbzS1ed54G1LkBUHQVHQKqhMkhgbmJbZRkrgZw4koxb5JaHWkY4ALHY2grBGRjaDMzQLcgJvLJuZZvRcEL/1/*)";
    const result = getFingerprintFromBip380Descriptor(descriptor);
    expect(result).toBe("d34db33f");
  });

  it("should extract fingerprint from BIP380 descriptor with sh(wpkh) and key origin", () => {
    // Test vector from BIP380: sh(wpkh) with key origin
    const descriptor =
      "sh(wpkh([d34db33f/44'/0'/0']xpub6ERApfZwUNrhLCkDtcHTcxd75RbzS1ed54G1LkBUHQVHQKqhMkhgbmJbZRkrgZw4koxb5JaHWkY4ALHY2grBGRjaDMzQLcgJvLJuZZvRcEL/1/*))";
    const result = getFingerprintFromBip380Descriptor(descriptor);
    expect(result).toBe("d34db33f");
  });

  it("should return null for BIP380 descriptor without key origin", () => {
    // Test vector from BIP380: wpkh without key origin
    const descriptor =
      "wpkh(xpub661MyMwAqRbcFW31YEwpkMuc5THy2PSt5bDMsktWQcFF8syAmRUapSCGu8ED9W6oDMSgv6Zz8idoc4a6mr8BDzTJY47LJhkJ8UB7WEGuduB/1/0)";
    const result = getFingerprintFromBip380Descriptor(descriptor);
    expect(result).toBeNull();
  });

  it("should return null for invalid descriptor", () => {
    const descriptor = "invalid";
    const result = getFingerprintFromBip380Descriptor(descriptor);
    expect(result).toBeNull();
  });

  it("should handle uppercase fingerprint and return lowercase", () => {
    const descriptor = "wpkh([D34DB33F/44'/0'/0']xpub...)";
    const result = getFingerprintFromBip380Descriptor(descriptor);
    expect(result).toBe("d34db33f");
  });
});
