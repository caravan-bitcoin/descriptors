import { Network } from "@caravan/bitcoin";
import {
  MultisigWalletConfig,
  decodeDescriptors,
  encodeDescriptors,
  encodeDescriptorWithMultipath,
  getChecksum,
  getWalletFromDescriptor,
} from "./descriptors";
import { KeyOrigin } from "@caravan/wallets";

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

const testConfig = (config: MultisigWalletConfig) => {
  expect(config.addressType).toEqual("P2SH");
  expect(config.requiredSigners).toEqual(2);
  const derivation1: KeyOrigin = config.keyOrigins[0];
  const derivation2: KeyOrigin = config.keyOrigins[1];
  expect(derivation1).toStrictEqual(expectedKeys[0]);
  expect(derivation2).toStrictEqual(expectedKeys[1]);
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
});

describe("getChecksum", () => {
  it("should return correct checksum", async () => {
    const internalChecksum = await getChecksum(internal);
    expect(internalChecksum).toEqual("3hxf9z66");
    const externalChecksum = await getChecksum(external);
    expect(externalChecksum).toEqual("uxj9xxul");
  });

  it("should throw if invalid or missing checksum", async () => {
    let passed = false;
    const invalids = [
      internal.split("#")[0],
      internal.concat("asdf"),
      internal.split("#")[0].concat("#123"),
      internal.split("#")[0].concat("#1234abcd"),
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
  // Descriptor with <0;1> multipath notation - combines external and internal into one descriptor
  const multipathDescriptor =
    "wsh(sortedmulti(2,[d52d08fc/48h/1h/0h/2h]tpubDEmdqnW7FVtXFej7WqNH6Wt92LKECvi2C326HHziBbfq8XCqS1qVoWYMpzPZcAMoD5n4YBDDdkRSToZsP3fgJSzMkLexZ6M3Vsuw7aXdZtz/<0;1>/*,[85b4d568/48h/1h/0h/2h]tpubDFg79ktERPWQb7L8BFJFhCWq3hrZfGKz393LmB9eXgAg9TLh1GgPSa6XD5TyWrKkSUkijwajoMHQc4yRNwUqsoyC7sW4tb1EutYBfEm1boX/<0;1>/*))#pjv8pr5k";

  const expectedMultipathKeys = [
    {
      xfp: "d52d08fc",
      bip32Path: "m/48h/1h/0h/2h",
      xpub: "tpubDEmdqnW7FVtXFej7WqNH6Wt92LKECvi2C326HHziBbfq8XCqS1qVoWYMpzPZcAMoD5n4YBDDdkRSToZsP3fgJSzMkLexZ6M3Vsuw7aXdZtz",
    },
    {
      xfp: "85b4d568",
      bip32Path: "m/48h/1h/0h/2h",
      xpub: "tpubDFg79ktERPWQb7L8BFJFhCWq3hrZfGKz393LmB9eXgAg9TLh1GgPSa6XD5TyWrKkSUkijwajoMHQc4yRNwUqsoyC7sW4tb1EutYBfEm1boX",
    },
  ];

  describe("getWalletFromDescriptor with multipath notation", () => {
    // Test vectors for multipath notation descriptors
    // Format: [description, descriptor]
    const multipathNotationVariants: [string, string][] = [
      [
        "standard <0;1> notation",
        "wsh(sortedmulti(2,[d52d08fc/48h/1h/0h/2h]tpubDEmdqnW7FVtXFej7WqNH6Wt92LKECvi2C326HHziBbfq8XCqS1qVoWYMpzPZcAMoD5n4YBDDdkRSToZsP3fgJSzMkLexZ6M3Vsuw7aXdZtz/<0;1>/*,[85b4d568/48h/1h/0h/2h]tpubDFg79ktERPWQb7L8BFJFhCWq3hrZfGKz393LmB9eXgAg9TLh1GgPSa6XD5TyWrKkSUkijwajoMHQc4yRNwUqsoyC7sW4tb1EutYBfEm1boX/<0;1>/*))#pjv8pr5k",
      ],
      [
        "spaces around multipath values < 0 ; 1 >",
        "wsh(sortedmulti(2,[d52d08fc/48h/1h/0h/2h]tpubDEmdqnW7FVtXFej7WqNH6Wt92LKECvi2C326HHziBbfq8XCqS1qVoWYMpzPZcAMoD5n4YBDDdkRSToZsP3fgJSzMkLexZ6M3Vsuw7aXdZtz/< 0 ; 1 >/*,[85b4d568/48h/1h/0h/2h]tpubDFg79ktERPWQb7L8BFJFhCWq3hrZfGKz393LmB9eXgAg9TLh1GgPSa6XD5TyWrKkSUkijwajoMHQc4yRNwUqsoyC7sW4tb1EutYBfEm1boX/< 0 ; 1 >/*))#pjv8pr5k",
      ],
    ];

    it.each(multipathNotationVariants)(
      "should decode descriptor with %s",
      async (_, descriptor) => {
        const config = await getWalletFromDescriptor(
          descriptor,
          Network.TESTNET,
        );

        expect(config.addressType).toEqual("P2WSH");
        expect(config.requiredSigners).toEqual(2);
        expect(config.network).toEqual(Network.TESTNET);
        expect(config.keyOrigins.length).toEqual(2);

        // Verify first key origin
        expect(config.keyOrigins[0].xfp).toEqual(expectedMultipathKeys[0].xfp);
        expect(config.keyOrigins[0].xpub).toEqual(
          expectedMultipathKeys[0].xpub,
        );

        // Verify second key origin
        expect(config.keyOrigins[1].xfp).toEqual(expectedMultipathKeys[1].xfp);
        expect(config.keyOrigins[1].xpub).toEqual(
          expectedMultipathKeys[1].xpub,
        );
      },
    );
  });

  describe("encodeDescriptorWithMultipath", () => {
    it("should encode config to a single multipath notation descriptor", async () => {
      const config: MultisigWalletConfig = {
        addressType: "P2WSH",
        network: Network.TESTNET,
        requiredSigners: 2,
        keyOrigins: expectedMultipathKeys,
      };

      const result = await encodeDescriptorWithMultipath(config);

      // Should be a single string, not an object
      expect(typeof result).toBe("string");

      // The result should contain <0;1> notation
      expect(result).toContain("<0;1>");

      // Verify checksum is present
      expect(result).toMatch(/#[0-9a-z]{8}$/);

      // Extract descriptor without checksum
      const descriptorWithoutChecksum = result.split("#")[0];

      // Verify the descriptor contains both keys with multipath notation
      // Note: BDK may use either ' or h for hardened derivation
      expect(descriptorWithoutChecksum).toContain("/<0;1>/*");
      expect(descriptorWithoutChecksum).toContain("[d52d08fc/48");
      expect(descriptorWithoutChecksum).toContain("[85b4d568/48");

      // Verify both keys have multipath notation
      const multipathNotationCount = (
        descriptorWithoutChecksum.match(/\/<0;1>\/\*/g) || []
      ).length;
      expect(multipathNotationCount).toBe(2); // Should have multipath notation for both keys
    });

    it("should generate valid checksum for range notation descriptor", async () => {
      const config: MultisigWalletConfig = {
        addressType: "P2WSH",
        network: Network.TESTNET,
        requiredSigners: 2,
        keyOrigins: expectedMultipathKeys,
      };

      const result = await encodeDescriptorWithMultipath(config);

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
      // Start with multipath descriptor
      const decoded = await getWalletFromDescriptor(
        multipathDescriptor,
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

  describe("getChecksum with multipath notation", () => {
    it("should extract checksum from multipath notation descriptor", async () => {
      const checksum = await getChecksum(multipathDescriptor);
      expect(checksum).toEqual("pjv8pr5k");
    });
  });

  describe("Different script types with multipath notation", () => {
    // Test vectors for different address/script types with multipath notation
    // Format: [addressType, descriptor, network?]
    const scriptTypeVectors: [string, string, Network | undefined][] = [
      [
        "P2SH",
        "sh(sortedmulti(2,[f57ec65d/45'/0'/100']xpub6CCHViYn5VzPfSR7baop9FtGcbm3UnqHwa54Z2eNvJnRFCJCdo9HtCYoLJKZCoATMLUowDDA1BMGfQGauY3fDYU3HyMzX4NDkoLYCSkLpbH/<0;1>/*,[efa5d916/45'/0'/100']xpub6Ca5CwTgRASgkXbXE5TeddTP9mPCbYHreCpmGt9dhz9y6femstHGCoFESHHKKRcm414xMKnuLjP9LDS7TwaJC9n5gxua6XB1rwPcC6hqDub/<0;1>/*))#jcq4kjz4",
        undefined,
      ],
      [
        "P2SH-P2WSH",
        "sh(wsh(sortedmulti(2,[f57ec65d/48'/0'/100'/1']xpub6EwJjKaiocGvo9f7XSGXGwzo1GLB1URxSZ5Ccp1wqdxNkhrSoqNQkC2CeMsU675urdmFJLHSX62xz56HGcnn6u21wRy6uipovmzaE65PfBp/<0;1>/*,[efa5d916/48'/0'/100'/1']xpub6DcqYQxnbefzEBJF6osEuT5yXoHVZu1YCCsS5YkATvqD2h7tdMBgdBrUXk26FrJwawDGX6fHKPvhhZxKc5b8dPAPb8uANDhsjAPMJqTFDjH/<0;1>/*)))#mkhtqmzj",
        undefined,
      ],
      ["P2WSH", multipathDescriptor, Network.TESTNET],
    ];

    it.each(scriptTypeVectors)(
      "should decode %s descriptor with multipath notation",
      async (expectedAddressType, descriptor, network) => {
        const config = await getWalletFromDescriptor(descriptor, network);
        expect(config.addressType).toEqual(expectedAddressType);
        expect(config.keyOrigins.length).toEqual(2);
      },
    );
  });
});
