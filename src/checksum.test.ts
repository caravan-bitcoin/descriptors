import { EXTERNAL_BRAID, INTERNAL_BRAID, MULTIPATH } from "./fixtures";
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

  const tests = [
    ["raw(deadbeef)", "raw(deadbeef)", "89f8spxm"],
    ["raw(cafebabe)", "raw(cafebabe)", "3h366858"],
    [
      "2-of-3 internal braid, wsh",
      INTERNAL_BRAID.descriptor,
      INTERNAL_BRAID.checksum,
    ],
    [
      "2-of-3 external braid, wsh",
      EXTERNAL_BRAID.descriptor,
      EXTERNAL_BRAID.checksum,
    ],
    ["2-of-3 multipath braid, wsh", MULTIPATH.descriptor, MULTIPATH.checksum],
  ];

  it.each(tests)(
    "should correctly checksum: %s",
    (name, descriptor, checksum) => {
      const calculatedChecksum = calculateDescriptorChecksum(descriptor);
      expect(calculatedChecksum).toBe(checksum);
    },
  );

  describe("BIP389 format descriptors", () => {
    it("should calculate checksum for hardened path descriptor", () => {
      // Test case following BIP389 format: pkh(xprv.../<2147483647h;0>/*)
      // Note: We use /* instead of /0 for wallet format
      const descriptor =
        "pkh(xprv9s21ZrQH143K31xYSDQpPDxsXRTUcvj2iNHm5NUtrGiGG5e2DtALGdso3pGz6ssrdK4PFmM8NSpSBHNqPqm55Qn3LqFtT2emdEXVYsCzC2U/<2147483647h;0>/*)";

      const checksum = calculateDescriptorChecksum(descriptor);
      // Verify checksum is valid (8 characters, bech32 charset)
      expect(checksum).toHaveLength(8);
      expect(checksum).toMatch(/^[qpzry9x8gf2tvdw0s3jn54khce6mua7l]{8}$/);
    });
  });
});
