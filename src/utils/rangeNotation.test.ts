import { parseDescriptorPaths, applyRangeNotation } from "./rangeNotation";

describe("parseDescriptorPaths", () => {
  describe("multipath notation parsing", () => {
    // BIP389 test vectors from https://bips.dev/389/
    const multipathTestVectors: Array<
      [
        description: string,
        descriptor: string,
        expectedExternal: string,
        expectedInternal: string,
      ]
    > = [
      [
        "BIP389: pk with <0;1>/* (wallet format)",
        "pk(xpub68NZiKmJWnxxS6aaHmn81bvJeTESw724CRDs6HbuccFQN9Ku14VQrADWgqbhhTHBaohPX4CjNLf9fq9MYo6oDaPPLPxSb7gwQN3ih19Zm4Y/<0;1>/*)",
        "pk(xpub68NZiKmJWnxxS6aaHmn81bvJeTESw724CRDs6HbuccFQN9Ku14VQrADWgqbhhTHBaohPX4CjNLf9fq9MYo6oDaPPLPxSb7gwQN3ih19Zm4Y/0/*)",
        "pk(xpub68NZiKmJWnxxS6aaHmn81bvJeTESw724CRDs6HbuccFQN9Ku14VQrADWgqbhhTHBaohPX4CjNLf9fq9MYo6oDaPPLPxSb7gwQN3ih19Zm4Y/1/*)",
      ],
      [
        "BIP389: pkh with <2147483647h;0>/0",
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

describe("applyRangeNotation", () => {
  it("should convert /0/* to /<0;1>/* and add checksum", () => {
    const externalDesc =
      "wsh(sortedmulti(2,[d52d08fc/48h]tpubXXX/0/*,[85b4d568/48h]tpubYYY/0/*))#oldcheck";
    const internalDesc =
      "wsh(sortedmulti(2,[d52d08fc/48h]tpubXXX/1/*,[85b4d568/48h]tpubYYY/1/*))#oldcheck";

    const result = applyRangeNotation(externalDesc, internalDesc);

    expect(result).toContain("/<0;1>/*");
    expect(result).not.toContain("/0/*");
    expect(result).toMatch(/#[qpzry9x8gf2tvdw0s3jn54khce6mua7l]{8}$/);
  });

  it("should handle multiple keys with /0/* paths", () => {
    const externalDesc =
      "wsh(sortedmulti(2,[aaa]tpubA/0/*,[bbb]tpubB/0/*,[ccc]tpubC/0/*))#check";
    const internalDesc =
      "wsh(sortedmulti(2,[aaa]tpubA/1/*,[bbb]tpubB/1/*,[ccc]tpubC/1/*))#check";

    const result = applyRangeNotation(externalDesc, internalDesc);

    // Should have 3 instances of range notation
    const matches = result.match(/\/<0;1>\/\*/g);
    expect(matches).toHaveLength(3);
  });
});
