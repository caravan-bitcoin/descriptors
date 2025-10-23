import { calculateDescriptorChecksum } from "./checksum";

/**
 * Splits a descriptor into separate external and internal descriptors.
 * Handles three cases:
 * 1. Range notation (e.g., <0;1>/*) - expands to separate 0/* and 1/* descriptors
 * 2. External notation (0/*) - generates corresponding internal descriptor (1/*)
 * 3. Internal notation (1/*) - generates corresponding external descriptor (0/*)
 *
 * @param descriptor - The descriptor string in any of the supported formats
 * @returns Object with external and internal descriptor strings (without checksums)
 */
export const parseDescriptorPaths = (
  descriptor: string,
): { external: string; internal: string } => {
  const checksumRegex = /#[0-9a-zA-Z]{8}/g;
  let internal = "";
  let external = "";

  // Check for range notation like <0;1>/* or < 0 ; 1 >/*
  // The range is followed by /* so we need to match the whole pattern
  const rangeRegex = /<\s*([0-9]+)\s*;\s*([0-9]+)\s*>\s*\/\*/g;
  const rangeMatch = descriptor.match(rangeRegex);

  if (rangeMatch) {
    // Range notation detected (e.g., <0;1>/*)
    // Remove checksum before expansion
    const descriptorWithoutChecksum = descriptor.replace(checksumRegex, "");

    // Extract the range values - we need to match again to get capture groups
    const match = /<\s*([0-9]+)\s*;\s*([0-9]+)\s*>\s*\/\*/.exec(
      descriptorWithoutChecksum,
    );
    if (match) {
      // match[0] is the full match, match[1] and match[2] are the capture groups
      const [, a, b] = match;

      // Replace <0;1>/* with 0/* for external
      external = descriptorWithoutChecksum.replace(rangeRegex, `${a}/*`);

      // Replace <0;1>/* with 1/* for internal
      internal = descriptorWithoutChecksum.replace(rangeRegex, `${b}/*`);
    }
  } else if (descriptor.includes("0/*")) {
    // Traditional notation with 0/*
    external = descriptor;
    internal = descriptor.replace(/0\/\*/g, "1/*").replace(checksumRegex, "");
  } else if (descriptor.includes("1/*")) {
    // Traditional notation with 1/*
    internal = descriptor;
    external = descriptor.replace(/1\/\*/g, "0/*").replace(checksumRegex, "");
  }

  return { external, internal };
};

/**
 * Converts traditional separate descriptors to range notation format.
 * Takes external and internal descriptors and combines them into a single
 * descriptor using <0;1> notation with proper checksum.
 * 
 * Note: This function assumes external and internal descriptors are generated
 * from the same wallet config and only differ in /0/* vs /1/* paths.
 * 
 * @param externalDesc - External descriptor (with /0/* paths)
 * @param internalDesc - Internal descriptor (with /1/* paths, currently unused) 
 * @returns Object with both receive and change set to the same range notation descriptor
 */
export const applyRangeNotation = (
  externalDesc: string,
  internalDesc: string,
): { receive: string; change: string } => {
  // Replace all /0/* with /<0;1>/* in the external descriptor
  const externalWithoutChecksum = externalDesc.split("#")[0];
  const rangeDescriptor = externalWithoutChecksum.replace(/\/0\/\*/g, "/<0;1>/*");
  
  // Calculate checksum for the range notation descriptor
  const checksum = calculateDescriptorChecksum(rangeDescriptor);
  const rangeDescriptorWithChecksum = `${rangeDescriptor}#${checksum}`;
  
  return {
    receive: rangeDescriptorWithChecksum,
    change: rangeDescriptorWithChecksum,
  };
};
