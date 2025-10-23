/**
 * Calculate descriptor checksum according to BIP 380
 * https://github.com/bitcoin/bips/blob/master/bip-0380.mediawiki
 */
export const calculateDescriptorChecksum = (descriptor: string): string => {
  const CHECKSUM_CHARSET = "qpzry9x8gf2tvdw0s3jn54khce6mua7l";
  const GENERATOR = [0xf5dee51989, 0xa9fdca3312, 0x1bab10e32d, 0x3706b1677a, 0x644d626ffd];
  
  // Expand descriptor for checksum calculation
  const expanded: number[] = [];
  for (let i = 0; i < descriptor.length; i++) {
    const c = descriptor.charCodeAt(i);
    expanded.push(c >> 5);
    expanded.push(c & 31);
  }
  
  // Calculate checksum polynomial
  let poly = 1;
  for (const value of expanded) {
    const c0 = poly >> 35;
    poly = ((poly & 0x7ffffffff) << 5) ^ value;
    
    for (let j = 0; j < 5; j++) {
      if ((c0 >> j) & 1) {
        poly ^= GENERATOR[j];
      }
    }
  }
  
  // Generate checksum string
  let checksum = "";
  for (let i = 0; i < 8; i++) {
    checksum += CHECKSUM_CHARSET[(poly >> (5 * (7 - i))) & 31];
  }
  
  return checksum;
};

