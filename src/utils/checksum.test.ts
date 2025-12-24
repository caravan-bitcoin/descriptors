import { calculateDescriptorChecksum } from "./checksum";

describe("calculateDescriptorChecksum", () => {
  // BIP-380 test vector: raw(deadbeef)#89f8spxm
  it("should calculate correct checksum for raw(deadbeef)", () => {
    const checksum = calculateDescriptorChecksum("raw(deadbeef)");
    expect(checksum).toBe("89f8spxm");
  });

  it("should produce 8-character checksums", () => {
    const checksum = calculateDescriptorChecksum("raw(deadbeef)");
    expect(checksum).toHaveLength(8);
  });

  it("should only use valid bech32 characters in checksum", () => {
    const checksum = calculateDescriptorChecksum("raw(deadbeef)");
    expect(checksum).toMatch(/^[qpzry9x8gf2tvdw0s3jn54khce6mua7l]{8}$/);
  });

  it("should produce different checksums for different descriptors", () => {
    const checksum1 = calculateDescriptorChecksum("raw(deadbeef)");
    const checksum2 = calculateDescriptorChecksum("raw(cafebabe)");
    expect(checksum1).not.toBe(checksum2);
  });

  it("should handle descriptors with BIP-389 multipath syntax", () => {
    const descriptor =
      "wsh(sortedmulti(2,[d52d08fc/48h/1h/0h/2h]tpubDEmdqnW7FVtXFej7WqNH6Wt92LKECvi2C326HHziBbfq8XCqS1qVoWYMpzPZcAMoD5n4YBDDdkRSToZsP3fgJSzMkLexZ6M3Vsuw7aXdZtz/<0;1>/*,[85b4d568/48h/1h/0h/2h]tpubDFg79ktERPWQb7L8BFJFhCWq3hrZfGKz393LmB9eXgAg9TLh1GgPSa6XD5TyWrKkSUkijwajoMHQc4yRNwUqsoyC7sW4tb1EutYBfEm1boX/<0;1>/*))";

    const checksum = calculateDescriptorChecksum(descriptor);
    expect(checksum).toBe("pjv8pr5k");
  });
});
