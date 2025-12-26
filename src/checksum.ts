import { getRustAPI } from "./wasmLoader";

/**
 * Calculate descriptor checksum according to BIP 380
 * https://github.com/bitcoin/bips/blob/master/bip-0380.mediawiki
 *
 * The checksum uses a BCH code for error detection.
 * Reference: Bitcoin Core src/script/descriptor.cpp
 */
export const calculateDescriptorChecksum = (descriptor: string): string => {
  const CHECKSUM_CHARSET = "qpzry9x8gf2tvdw0s3jn54khce6mua7l";

  // Input charset for BIP-380 - maps characters to their positions
  // This specific ordering is required by the BIP-380 specification
  const INPUT_CHARSET =
    "0123456789()[],'/*abcdefgh@:$%{}" +
    "IJKLMNOPQRSTUVWXYZ&+-.;<=>?!^_|~" +
    'ijklmnopqrstuvwxyzABCDEFGH`#"\\ ';

  // Use an array of 8 5-bit values to represent the 40-bit state
  // This avoids 64-bit arithmetic issues in JavaScript
  // c[0] is the most significant 5 bits, c[7] is the least significant 5 bits
  const polymod = (c: number[], val: number): number[] => {
    const c0 = c[0];
    const result = [c[1], c[2], c[3], c[4], c[5], c[6], c[7], val];

    // Generator values in 5-bit chunks (MSB first):
    // 0xf5dee51989, 0xa9fdca3312, 0x1bab10e32d, 0x3706b1677a, 0x644d626ffd
    const GENERATORS = [
      [0x1e, 0x17, 0x0f, 0x0e, 0x0a, 0x06, 0x0c, 0x09],
      [0x15, 0x07, 0x1e, 0x1c, 0x14, 0x0c, 0x18, 0x12],
      [0x03, 0x0e, 0x15, 0x11, 0x01, 0x18, 0x19, 0x0d],
      [0x06, 0x1c, 0x03, 0x0b, 0x02, 0x19, 0x1b, 0x1a],
      [0x0c, 0x11, 0x06, 0x16, 0x04, 0x1b, 0x1f, 0x1d],
    ];

    for (let i = 0; i < 5; i++) {
      if ((c0 >> i) & 1) {
        for (let j = 0; j < 8; j++) {
          result[j] ^= GENERATORS[i][j];
        }
      }
    }

    return result;
  };

  let c = [0, 0, 0, 0, 0, 0, 0, 1];
  let cls = 0;
  let clscount = 0;

  for (let i = 0; i < descriptor.length; i++) {
    const ch = descriptor[i];
    const pos = INPUT_CHARSET.indexOf(ch);

    if (pos === -1) {
      throw new Error(`Invalid character '${ch}' in descriptor`);
    }

    // Feed the lower 5 bits of the position into the checksum
    c = polymod(c, pos & 31);

    // Track character class (upper 2 bits of position)
    cls = cls * 3 + (pos >> 5);
    clscount++;

    if (clscount === 3) {
      c = polymod(c, cls);
      cls = 0;
      clscount = 0;
    }
  }

  // Finalize any remaining character class data
  if (clscount > 0) {
    c = polymod(c, cls);
  }

  // Expand the checksum with 8 zeros
  for (let i = 0; i < 8; i++) {
    c = polymod(c, 0);
  }

  // XOR with final constant (1 in the last position)
  c[7] ^= 1;

  // Convert to checksum string - each element is already a 5-bit value
  return c.map((v) => CHECKSUM_CHARSET[v]).join("");
};

/**
 * Calculate descriptor checksum using BDK's Rust implementation via WASM.
 * This function uses BDK's checksum calculation which follows BIP-380.
 *
 * @param descriptor - The descriptor string (with or without existing checksum)
 * @returns Promise resolving to the 8-character checksum string
 * @throws Error if BDK checksum calculation is not available or fails
 */
export const calculateChecksum = async (
  descriptor: string,
): Promise<string> => {
  const bdk = await getRustAPI();
  if (!bdk.calc_descriptor_checksum) {
    throw new Error("BDK checksum calculation not available");
  }
  return bdk.calc_descriptor_checksum(descriptor);
};
