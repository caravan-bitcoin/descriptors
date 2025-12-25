import {
  parseDescriptorPaths,
  expandToMultipathWalletDescriptor,
} from "./multipath";

describe("parseDescriptorPaths", () => {
  describe("multipath notation parsing", () => {
    // Test cases following BIP389 format (https://bips.dev/389/)
    // Note: These are not official BIP389 test vectors, but test cases that validate
    // BIP389-compliant multipath notation for <0;1>/* tuples
    const multipathTestVectors: Array<
      [
        description: string,
        descriptor: string,
        expectedExternal: string,
        expectedInternal: string,
      ]
    > = [
      [
        "pk with <0;1>/* (wallet format)",
        "pk(xpub68NZiKmJWnxxS6aaHmn81bvJeTESw724CRDs6HbuccFQN9Ku14VQrADWgqbhhTHBaohPX4CjNLf9fq9MYo6oDaPPLPxSb7gwQN3ih19Zm4Y/<0;1>/*)",
        "pk(xpub68NZiKmJWnxxS6aaHmn81bvJeTESw724CRDs6HbuccFQN9Ku14VQrADWgqbhhTHBaohPX4CjNLf9fq9MYo6oDaPPLPxSb7gwQN3ih19Zm4Y/0/*)",
        "pk(xpub68NZiKmJWnxxS6aaHmn81bvJeTESw724CRDs6HbuccFQN9Ku14VQrADWgqbhhTHBaohPX4CjNLf9fq9MYo6oDaPPLPxSb7gwQN3ih19Zm4Y/1/*)",
      ],
      [
        "pkh with hardened path <2147483647h;0>/0",
        "pkh(xprv9s21ZrQH143K31xYSDQpPDxsXRTUcvj2iNHm5NUtrGiGG5e2DtALGdso3pGz6ssrdK4PFmM8NSpSBHNqPqm55Qn3LqFtT2emdEXVYsCzC2U/<2147483647h;0>/0)",
        "pkh(xprv9s21ZrQH143K31xYSDQpPDxsXRTUcvj2iNHm5NUtrGiGG5e2DtALGdso3pGz6ssrdK4PFmM8NSpSBHNqPqm55Qn3LqFtT2emdEXVYsCzC2U/2147483647h/*)",
        "pkh(xprv9s21ZrQH143K31xYSDQpPDxsXRTUcvj2iNHm5NUtrGiGG5e2DtALGdso3pGz6ssrdK4PFmM8NSpSBHNqPqm55Qn3LqFtT2emdEXVYsCzC2U/0/*)",
      ],
      [
        "multipath with <0;1>/*",
        "wsh(sortedmulti(2,[d52d08fc/48h/1h/0h/2h]tpubXXX/<0;1>/*))",
        "wsh(sortedmulti(2,[d52d08fc/48h/1h/0h/2h]tpubXXX/0/*))",
        "wsh(sortedmulti(2,[d52d08fc/48h/1h/0h/2h]tpubXXX/1/*))",
      ],
      [
        "multipath with spaces < 0 ; 1 >/*",
        "wsh(sortedmulti(2,[d52d08fc/48h/1h/0h/2h]tpubXXX/< 0 ; 1 >/*))",
        "wsh(sortedmulti(2,[d52d08fc/48h/1h/0h/2h]tpubXXX/0/*))",
        "wsh(sortedmulti(2,[d52d08fc/48h/1h/0h/2h]tpubXXX/1/*))",
      ],
      [
        "multipath with hardened h <0h;1h>/*",
        "wsh(sortedmulti(2,[d52d08fc/48h/1h/0h/2h]tpubXXX/<0h;1h>/*))",
        "wsh(sortedmulti(2,[d52d08fc/48h/1h/0h/2h]tpubXXX/0h/*))",
        "wsh(sortedmulti(2,[d52d08fc/48h/1h/0h/2h]tpubXXX/1h/*))",
      ],
      [
        "multipath with hardened apostrophe <0';1'>/*",
        "wsh(sortedmulti(2,[d52d08fc/48h/1h/0h/2h]tpubXXX/<0';1'>/*))",
        "wsh(sortedmulti(2,[d52d08fc/48h/1h/0h/2h]tpubXXX/0'/*))",
        "wsh(sortedmulti(2,[d52d08fc/48h/1h/0h/2h]tpubXXX/1'/*))",
      ],
      [
        "multipath with hardened uppercase H <0H;1H>/*",
        "wsh(sortedmulti(2,[d52d08fc/48h/1h/0h/2h]tpubXXX/<0H;1H>/*))",
        "wsh(sortedmulti(2,[d52d08fc/48h/1h/0h/2h]tpubXXX/0H/*))",
        "wsh(sortedmulti(2,[d52d08fc/48h/1h/0h/2h]tpubXXX/1H/*))",
      ],
      [
        "multipath mixed hardened/unhardened <0;1h>/*",
        "wsh(sortedmulti(2,[d52d08fc/48h/1h/0h/2h]tpubXXX/<0;1h>/*))",
        "wsh(sortedmulti(2,[d52d08fc/48h/1h/0h/2h]tpubXXX/0/*))",
        "wsh(sortedmulti(2,[d52d08fc/48h/1h/0h/2h]tpubXXX/1h/*))",
      ],
      [
        "multipath first hardened <0h;1>/*",
        "wsh(sortedmulti(2,[d52d08fc/48h/1h/0h/2h]tpubXXX/<0h;1>/*))",
        "wsh(sortedmulti(2,[d52d08fc/48h/1h/0h/2h]tpubXXX/0h/*))",
        "wsh(sortedmulti(2,[d52d08fc/48h/1h/0h/2h]tpubXXX/1/*))",
      ],
    ];

    it.each(multipathTestVectors)(
      "should parse %s",
      (_, descriptor, expectedExternal, expectedInternal) => {
        const { external, internal } = parseDescriptorPaths(descriptor);

        expect(external).toBe(expectedExternal);
        expect(internal).toBe(expectedInternal);
        // Verify multipath notation is removed
        expect(external).not.toMatch(/<[^>]+>/);
        expect(internal).not.toMatch(/<[^>]+>/);
      },
    );
  });

  describe("traditional notation parsing", () => {
    it("should parse external descriptor (0/*) and generate internal", () => {
      const descriptor =
        "wsh(sortedmulti(2,[d52d08fc/48h/1h/0h/2h]tpubXXX/0/*))#checksum";

      const { external, internal } = parseDescriptorPaths(descriptor);

      expect(external).toBe(descriptor);
      expect(internal).toContain("/1/*");
      expect(internal).not.toContain("#checksum"); // Checksum removed for internal
    });

    it("should parse internal descriptor (1/*) and generate external", () => {
      const descriptor =
        "wsh(sortedmulti(2,[d52d08fc/48h/1h/0h/2h]tpubXXX/1/*))#checksum";

      const { external, internal } = parseDescriptorPaths(descriptor);

      expect(internal).toBe(descriptor);
      expect(external).toContain("/0/*");
      expect(external).not.toContain("#checksum"); // Checksum removed for external
    });
  });

  describe("error cases", () => {
    const errorTestVectors: Array<
      [description: string, descriptor: string, expectedError: string]
    > = [
      [
        "descriptor without path notation",
        "wsh(sortedmulti(2,[d52d08fc]tpubXXX))#checksum",
        "Descriptor must contain either multipath notation (<0;1>/* or <0;1>/NUM) or path notation (0/* or 1/*)",
      ],
      [
        "descriptor with only wildcard (no path index)",
        "wsh(sortedmulti(2,[d52d08fc]tpubXXX/*))#checksum",
        "Descriptor must contain either multipath notation (<0;1>/* or <0;1>/NUM) or path notation (0/* or 1/*)",
      ],
    ];

    it.each(errorTestVectors)(
      "should throw for %s",
      (_, invalidDescriptor, expectedError) => {
        expect(() => parseDescriptorPaths(invalidDescriptor)).toThrow(
          expectedError,
        );
      },
    );

    it("should throw for empty descriptor", () => {
      expect(() => parseDescriptorPaths("")).toThrow();
    });
  });
});

describe("BIP389 Validation", () => {
  // Import the validation function (it's not exported, so we test via parseDescriptorPaths)
  describe("validateMultipathDescriptor (via parseDescriptorPaths)", () => {
    const invalidMultipathVectors: Array<
      [description: string, descriptor: string, expectedError: string]
    > = [
      [
        "multipath in origin [xfp/path]",
        "pkh([deadbeef/<0;1>]xpub661MyMwAqRbcFW31YEwpkMuc5THy2PSt5bDMsktWQcFF8syAmRUapSCGu8ED9W6oDMSgv6Zz8idoc4a6mr8BDzTJY47LJhkJ8UB7WEGuduB/<0;1>/*)",
        "Multipath specifier cannot appear in origin",
      ],
      [
        "duplicate values in tuple <0;0>",
        "pk(xpub68NZiKmJWnxxS6aaHmn81bvJeTESw724CRDs6HbuccFQN9Ku14VQrADWgqbhhTHBaohPX4CjNLf9fq9MYo6oDaPPLPxSb7gwQN3ih19Zm4Y/<0;0>/*)",
        "Duplicate values not allowed in multipath tuple",
      ],
      [
        "multiple multipath specifiers in one key",
        "pk(xpub68NZiKmJWnxxS6aaHmn81bvJeTESw724CRDs6HbuccFQN9Ku14VQrADWgqbhhTHBaohPX4CjNLf9fq9MYo6oDaPPLPxSb7gwQN3ih19Zm4Y/<0;1>/*/<2;3>/*)",
        "Only one multipath specifier allowed per Key Expression",
      ],
      [
        "duplicate values in tuple <1;1>",
        "pk(xpub68NZiKmJWnxxS6aaHmn81bvJeTESw724CRDs6HbuccFQN9Ku14VQrADWgqbhhTHBaohPX4CjNLf9fq9MYo6oDaPPLPxSb7gwQN3ih19Zm4Y/<1;1>/*)",
        "Duplicate values not allowed in multipath tuple",
      ],
    ];

    it.each(invalidMultipathVectors)(
      "should throw for %s",
      (_, invalidDescriptor, expectedError) => {
        expect(() => parseDescriptorPaths(invalidDescriptor)).toThrow(
          expectedError,
        );
      },
    );

    it("should accept valid multipath descriptors", () => {
      const validDescriptors = [
        "pk(xpub68NZiKmJWnxxS6aaHmn81bvJeTESw724CRDs6HbuccFQN9Ku14VQrADWgqbhhTHBaohPX4CjNLf9fq9MYo6oDaPPLPxSb7gwQN3ih19Zm4Y/<0;1>/*)",
        "wsh(sortedmulti(2,[d52d08fc/48h/1h/0h/2h]tpubXXX/<0;1>/*,[85b4d568/48h/1h/0h/2h]tpubYYY/<0;1>/*))",
      ];

      for (const descriptor of validDescriptors) {
        expect(() => parseDescriptorPaths(descriptor)).not.toThrow();
      }
    });
  });
});

describe("expandToMultipathWalletDescriptor", () => {
  describe("with single descriptor", () => {
    const validSingleDescriptorVectors: Array<
      [description: string, descriptor: string, shouldNotContain: string]
    > = [
      [
        "convert single descriptor with /0/* paths to multipath",
        "wsh(sortedmulti(2,[d52d08fc/48h]tpubXXX/0/*,[85b4d568/48h]tpubYYY/0/*))#oldcheck",
        "/0/*",
      ],
      [
        "convert single descriptor with /1/* paths to multipath",
        "wsh(sortedmulti(2,[d52d08fc/48h]tpubXXX/1/*,[85b4d568/48h]tpubYYY/1/*))#oldcheck",
        "/1/*",
      ],
    ];

    it.each(validSingleDescriptorVectors)(
      "should %s",
      (_, descriptor, shouldNotContain) => {
        const result = expandToMultipathWalletDescriptor(descriptor);

        expect(result).toContain("/<0;1>/*");
        expect(result).not.toContain(shouldNotContain);
        expect(result).toMatch(/#[qpzry9x8gf2tvdw0s3jn54khce6mua7l]{8}$/);
      },
    );

    it("should throw if single descriptor has no /0/* or /1/* paths", () => {
      const descriptor =
        "wsh(sortedmulti(2,[d52d08fc/48h]tpubXXX/*,[85b4d568/48h]tpubYYY/*))#oldcheck";

      expect(() => expandToMultipathWalletDescriptor(descriptor)).toThrow(
        "Descriptor must contain /0/* or /1/* paths to expand to multipath notation",
      );
    });

    it("should handle multiple keys with /0/* paths", () => {
      const descriptor =
        "wsh(sortedmulti(2,[aaa]tpubA/0/*,[bbb]tpubB/0/*,[ccc]tpubC/0/*))#check";

      const result = expandToMultipathWalletDescriptor(descriptor);

      const matches = result.match(/\/<0;1>\/\*/g);
      expect(matches).toHaveLength(3);
      expect(result).toContain("/<0;1>/*");
      expect(result).not.toContain("/0/*");
      expect(result).toMatch(/#[qpzry9x8gf2tvdw0s3jn54khce6mua7l]{8}$/);
    });
  });

  describe("BIP389 validation", () => {
    it("should validate multipath descriptor after conversion", () => {
      const descriptor =
        "wsh(sortedmulti(2,[d52d08fc/48h]tpubXXX/0/*,[85b4d568/48h]tpubYYY/0/*))#oldcheck";

      const result = expandToMultipathWalletDescriptor(descriptor);
      expect(result).toContain("/<0;1>/*");
      expect(result).toMatch(/#[qpzry9x8gf2tvdw0s3jn54khce6mua7l]{8}$/);
    });
  });
});
