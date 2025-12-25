import { calculateDescriptorChecksum } from "./checksum";

// Regex pattern for matching multipath notation: <NUM;NUM> followed by /* or /NUM
// Supports hardened derivation indicators: h, H, or '
// Example matches: <0;1>/*, <0h;1h>/*, <2147483647h;0>/0
const MULTIPATH_REGEX =
  /<\s*([0-9]+[hH']?)\s*;\s*([0-9]+[hH']?)\s*>\s*\/(?:\*|[0-9]+)/g;

// Regex pattern for extracting numeric part from multipath value (without hardened indicator)
const NUMERIC_PART_REGEX = /^([0-9]+)([hH']?)$/;

// Regex pattern for matching descriptor checksums: # followed by 8 alphanumeric characters
export const CHECKSUM_REGEX = /#[0-9a-zA-Z]{8}/g;

/**
 * Validates a descriptor according to BIP389 constraints.
 * Throws errors for invalid multipath descriptors.
 *
 * BIP389 constraints:
 * - Only one multipath specifier allowed per Key Expression
 * - Multipath specifiers must have matching tuple lengths across all Key Expressions
 * - No duplicate values within a multipath tuple
 * - Multipath specifier cannot appear in origin [xfp/path]
 *
 * @param descriptor - Descriptor string to validate (without checksum)
 * @throws Error if descriptor violates BIP389 constraints
 */
function validateMultipathDescriptor(descriptor: string): void {
  // 1. Check for multipath in origin [xfp/path]
  // Origin pattern: [fingerprint/path]xpub...
  // Multipath should not appear inside the brackets
  const multipathInOriginRegex = /\[[^\]]*<[^>]+>[^\]]*\]/;
  if (multipathInOriginRegex.test(descriptor)) {
    throw new Error("Multipath specifier cannot appear in origin [xfp/path]");
  }

  // 2. Find all multipath specifiers
  // Pattern: <NUM;NUM> followed by /* or /NUM
  const multipathMatches: RegExpMatchArray[] = [];
  let match: RegExpMatchArray | null;
  // Create a new regex instance since we're using global flag
  const multipathRegex = new RegExp(
    MULTIPATH_REGEX.source,
    MULTIPATH_REGEX.flags,
  );
  // Use exec in a loop instead of matchAll for compatibility
  while ((match = multipathRegex.exec(descriptor)) !== null) {
    multipathMatches.push(match);
  }

  if (multipathMatches.length === 0) {
    // No multipath specifiers found, nothing to validate
    return;
  }

  // 3. Extract tuple values and validate
  const tuples: Array<[string, string]> = [];
  for (const match of multipathMatches) {
    const firstValue = match[1] as string;
    const secondValue = match[2] as string;

    // Extract numeric parts (without hardened indicators) for duplicate check
    // Use NUMERIC_PART_REGEX and extract just the numeric part (group 1)
    const firstMatch = NUMERIC_PART_REGEX.exec(firstValue);
    const secondMatch = NUMERIC_PART_REGEX.exec(secondValue);

    if (!firstMatch || !secondMatch) {
      throw new Error("Invalid multipath notation format in descriptor");
    }

    const firstNum = firstMatch[1];
    const secondNum = secondMatch[1];

    // Check for duplicates within tuple
    if (firstNum === secondNum) {
      throw new Error("Duplicate values not allowed in multipath tuple");
    }

    tuples.push([firstValue, secondValue]);
  }

  // 4. Validate matching tuple lengths (all should be length 2 for <NUM;NUM>)
  // Since we only support 2-value tuples, all tuples should have exactly 2 values
  const tupleLength = 2;
  for (const tuple of tuples) {
    if (tuple.length !== tupleLength) {
      throw new Error(
        "All multipath specifiers must have matching tuple lengths",
      );
    }
  }

  // 5. Validate single specifier per key expression
  // For multisig descriptors, keys are separated by commas at the top level
  // We need to ensure each key expression has at most one multipath specifier
  // Strategy: Check if any two multipath specifiers appear in the same key expression
  // (i.e., no comma between them at the top level)

  for (let i = 0; i < multipathMatches.length; i++) {
    for (let j = i + 1; j < multipathMatches.length; j++) {
      const match1 = multipathMatches[i];
      const match2 = multipathMatches[j];
      const start1 = (match1.index as number) || 0;
      const end1 = start1 + (match1[0] as string).length;
      const start2 = (match2.index as number) || 0;

      // Check the text between the two multipath specifiers
      const between = descriptor.substring(end1, start2);

      // Count parentheses/brackets depth to find top-level commas
      let depth = 0;
      let hasTopLevelComma = false;

      for (const char of between) {
        if (char === "(" || char === "[" || char === "{") {
          depth++;
        } else if (char === ")" || char === "]" || char === "}") {
          depth--;
        } else if (char === "," && depth === 0) {
          hasTopLevelComma = true;
          break;
        }
      }

      // If there's no top-level comma between two multipath specifiers,
      // they're in the same key expression, which violates BIP389
      if (!hasTopLevelComma) {
        throw new Error(
          "Only one multipath specifier allowed per Key Expression",
        );
      }
    }
  }
}

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
  let internal = "";
  let external = "";

  // Check for multipath notation like <0;1>/* or < 0 ; 1 >/* or <0h;1h>/* or <2147483647h;0>/0
  // Supports hardened derivation indicators: h, H, or '
  // The multipath can be followed by /* or /NUM (we convert /NUM to /* for wallet use)
  // Match pattern: <NUM;NUM> followed by /* or /NUM
  const multipathMatch = descriptor.match(MULTIPATH_REGEX);

  if (multipathMatch) {
    // Multipath notation detected (e.g., <0;1>/*, <0h;1h>/*, <0';1'>/*, <2147483647h;0>/0)
    // Remove checksum before expansion
    const descriptorWithoutChecksum = descriptor.replace(CHECKSUM_REGEX, "");

    // Validate multipath descriptor according to BIP389 constraints
    validateMultipathDescriptor(descriptorWithoutChecksum);

    // Extract the multipath values - we need to match again to get capture groups
    // This regex captures the full value including hardened indicators
    // Captures: <NUM;NUM> followed by /* or /NUM
    const matchRegex = new RegExp(MULTIPATH_REGEX.source);
    const match = matchRegex.exec(descriptorWithoutChecksum);

    if (!match) {
      throw new Error("Invalid multipath notation format in descriptor");
    }

    // match[0] is the full match, match[1] and match[2] are the capture groups
    // These include hardened indicators if present (e.g., "0h", "1'", "2147483647h")
    const [, firstValue, secondValue] = match;

    // Extract the numeric part and hardened indicator separately for proper expansion
    // First value goes to external, second to internal
    const firstMatch = NUMERIC_PART_REGEX.exec(firstValue);
    const secondMatch = NUMERIC_PART_REGEX.exec(secondValue);

    if (!firstMatch || !secondMatch) {
      throw new Error("Invalid multipath notation format in descriptor");
    }

    const [, firstNum, firstHardened] = firstMatch;
    const [, secondNum, secondHardened] = secondMatch;

    // Replace multipath notation with first value for external (preserving hardened indicator)
    // Convert any /NUM after multipath to /* for wallet descriptor use
    const replaceRegex = new RegExp(
      MULTIPATH_REGEX.source,
      MULTIPATH_REGEX.flags,
    );
    external = descriptorWithoutChecksum.replace(
      replaceRegex,
      `${firstNum}${firstHardened}/*`,
    );

    // Replace multipath notation with second value for internal (preserving hardened indicator)
    // Convert any /NUM after multipath to /* for wallet descriptor use
    internal = descriptorWithoutChecksum.replace(
      replaceRegex,
      `${secondNum}${secondHardened}/*`,
    );
  } else if (descriptor.includes("0/*")) {
    // Traditional notation with 0/*
    external = descriptor;
    internal = descriptor.replace(/0\/\*/g, "1/*").replace(CHECKSUM_REGEX, "");
  } else if (descriptor.includes("1/*")) {
    // Traditional notation with 1/*
    internal = descriptor;
    external = descriptor.replace(/1\/\*/g, "0/*").replace(CHECKSUM_REGEX, "");
  } else {
    throw new Error(
      "Descriptor must contain either multipath notation (<0;1>/* or <0;1>/NUM) or path notation (0/* or 1/*)",
    );
  }

  return { external, internal };
};

/**
 * Converts traditional separate descriptors to multipath notation format.
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
 * @returns Single descriptor string with multipath notation that covers both external and internal paths
 */
export const applyMultipathNotation = (
  externalDesc: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _internalDesc: string,
): string => {
  // Replace all /0/* with /<0;1>/* in the external descriptor
  const externalWithoutChecksum = externalDesc.split("#")[0];
  const multipathDescriptor = externalWithoutChecksum.replace(
    /\/0\/\*/g,
    "/<0;1>/*",
  );

  // Validate multipath descriptor according to BIP389 constraints
  validateMultipathDescriptor(multipathDescriptor);

  // Calculate checksum for the multipath descriptor
  const checksum = calculateDescriptorChecksum(multipathDescriptor);
  return `${multipathDescriptor}#${checksum}`;
};
