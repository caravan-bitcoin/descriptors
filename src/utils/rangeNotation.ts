import { calculateDescriptorChecksum } from "./checksum";

/**
 * Splits a descriptor into separate external and internal descriptors.
 * Handles three cases:
 * 1. Multipath notation (e.g., <0;1>/*, <0h;1h>/*) - expands to separate 0/* and 1/* descriptors
 *    Supports hardened derivation indicators: h, H, or ' (e.g., <0h;1h>/*, <0';1'>/*)
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

  // Check for multipath notation like <0;1>/* or < 0 ; 1 >/* or <0h;1h>/* or <2147483647h;0>/0
  // Supports hardened derivation indicators: h, H, or '
  // The multipath can be followed by /* or /NUM (we convert /NUM to /* for wallet use)
  // Match pattern: <NUM;NUM> followed by /* or /NUM
  const multipathRegex =
    /<\s*([0-9]+[hH']?)\s*;\s*([0-9]+[hH']?)\s*>\s*\/(?:\*|[0-9]+)/g;
  const multipathMatch = descriptor.match(multipathRegex);

  if (multipathMatch) {
    // Multipath notation detected (e.g., <0;1>/*, <0h;1h>/*, <0';1'>/*, <2147483647h;0>/0)
    // Remove checksum before expansion
    const descriptorWithoutChecksum = descriptor.replace(checksumRegex, "");

    // Extract the multipath values - we need to match again to get capture groups
    // This regex captures the full value including hardened indicators
    // Captures: <NUM;NUM> followed by /* or /NUM
    const match =
      /<\s*([0-9]+[hH']?)\s*;\s*([0-9]+[hH']?)\s*>\s*\/(?:\*|[0-9]+)/.exec(
        descriptorWithoutChecksum,
      );

    if (!match) {
      throw new Error("Invalid multipath notation format in descriptor");
    }

    // match[0] is the full match, match[1] and match[2] are the capture groups
    // These include hardened indicators if present (e.g., "0h", "1'", "2147483647h")
    const [, firstValue, secondValue] = match;

    // Extract the numeric part and hardened indicator separately for proper expansion
    // First value goes to external, second to internal
    const firstMatch = /^([0-9]+)([hH']?)$/.exec(firstValue);
    const secondMatch = /^([0-9]+)([hH']?)$/.exec(secondValue);

    if (!firstMatch || !secondMatch) {
      throw new Error("Invalid multipath notation format in descriptor");
    }

    const [, firstNum, firstHardened] = firstMatch;
    const [, secondNum, secondHardened] = secondMatch;

    // Replace multipath notation with first value for external (preserving hardened indicator)
    // Convert any /NUM after multipath to /* for wallet descriptor use
    external = descriptorWithoutChecksum.replace(
      multipathRegex,
      `${firstNum}${firstHardened}/*`,
    );

    // Replace multipath notation with second value for internal (preserving hardened indicator)
    // Convert any /NUM after multipath to /* for wallet descriptor use
    internal = descriptorWithoutChecksum.replace(
      multipathRegex,
      `${secondNum}${secondHardened}/*`,
    );
  } else if (descriptor.includes("0/*")) {
    // Traditional notation with 0/*
    external = descriptor;
    internal = descriptor.replace(/0\/\*/g, "1/*").replace(checksumRegex, "");
  } else if (descriptor.includes("1/*")) {
    // Traditional notation with 1/*
    internal = descriptor;
    external = descriptor.replace(/1\/\*/g, "0/*").replace(checksumRegex, "");
  } else {
    throw new Error(
      "Descriptor must contain either multipath notation (<0;1>/* or <0;1>/NUM) or path notation (0/* or 1/*)",
    );
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
 * The internalDesc parameter is kept for API consistency and potential
 * future validation use.
 *
 * @param externalDesc - External descriptor (with /0/* paths)
 * @param _internalDesc - Internal descriptor (with /1/* paths, reserved for future validation)
 * @returns Single descriptor string with range notation that covers both external and internal paths
 */
export const applyRangeNotation = (
  externalDesc: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _internalDesc: string,
): string => {
  // Replace all /0/* with /<0;1>/* in the external descriptor
  const externalWithoutChecksum = externalDesc.split("#")[0];
  const rangeDescriptor = externalWithoutChecksum.replace(
    /\/0\/\*/g,
    "/<0;1>/*",
  );

  // Calculate checksum for the range notation descriptor
  const checksum = calculateDescriptorChecksum(rangeDescriptor);
  return `${rangeDescriptor}#${checksum}`;
};
