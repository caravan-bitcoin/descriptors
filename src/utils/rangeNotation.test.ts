import { parseDescriptorPaths, applyRangeNotation } from "./rangeNotation";

describe("parseDescriptorPaths", () => {
  describe("range notation parsing", () => {
    it("should parse <0;1> range notation into external and internal", () => {
      const descriptor =
        "wsh(sortedmulti(2,[d52d08fc/48h/1h/0h/2h]tpubXXX/<0;1>/*))#checksum";

      const { external, internal } = parseDescriptorPaths(descriptor);

      expect(external).toContain("/0/*");
      expect(external).not.toContain("<0;1>");
      expect(internal).toContain("/1/*");
      expect(internal).not.toContain("<0;1>");
    });

    it("should parse <0;1> with spaces", () => {
      const descriptor =
        "wsh(sortedmulti(2,[d52d08fc/48h/1h/0h/2h]tpubXXX/< 0 ; 1 >/*))#checksum";

      const { external, internal } = parseDescriptorPaths(descriptor);

      expect(external).toContain("/0/*");
      expect(internal).toContain("/1/*");
    });
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
    it("should throw for descriptor without path notation", () => {
      const invalidDescriptor =
        "wsh(sortedmulti(2,[d52d08fc]tpubXXX))#checksum";

      expect(() => parseDescriptorPaths(invalidDescriptor)).toThrow(
        "Descriptor must contain either range notation (<0;1>/*) or path notation (0/* or 1/*)",
      );
    });

    it("should throw for descriptor with only wildcard (no path index)", () => {
      const invalidDescriptor =
        "wsh(sortedmulti(2,[d52d08fc]tpubXXX/*))#checksum";

      expect(() => parseDescriptorPaths(invalidDescriptor)).toThrow(
        "Descriptor must contain either range notation (<0;1>/*) or path notation (0/* or 1/*)",
      );
    });

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
