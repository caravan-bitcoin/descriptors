import { getRustAPI } from "./wasmLoader";
import {
  MultisigAddressType,
  Network,
  validateExtendedPublicKeyForNetwork,
} from "@caravan/bitcoin";
import { KeyOrigin } from "@caravan/wallets";

// should be a 32 byte hex string
export type PolicyHmac = string;
// should be an 8 byte hex string
export type RootFingerprint = string;

// This interface is different from the one that is
// exported from the `@caravan/wallets` package, which
// is primarily built for the original caravan config
// and has some unnecessary config fields (e.g. quorum).
export interface MultisigWalletConfig {
  requiredSigners: number;
  addressType: MultisigAddressType;
  keyOrigins: KeyOrigin[];
  network: Network | "bitcoin";
}

export const decodeDescriptors = async (
  internal: string,
  external: string,
  network?: Network | "bitcoin",
): Promise<MultisigWalletConfig> => {
  const { ExtendedDescriptor, CaravanConfig, Network } = await getRustAPI();
  const external_descriptor = ExtendedDescriptor.from_str(external);
  const internal_descriptor = ExtendedDescriptor.from_str(internal);
  let _network: Network | "bitcoin";
  if (network === "mainnet" || !network) {
    _network = "bitcoin";
  } else {
    _network = network;
  }
  const config = CaravanConfig.new(
    Network.from_str(_network),
    external_descriptor,
    internal_descriptor,
    "test1",
    "public",
  );
  const configObj = JSON.parse(config.to_string_pretty());
  const requiredSigners = configObj.quorum.requiredSigners;
  const keyOrigins = configObj.extendedPublicKeys.map(
    ({ bip32Path, xpub, xfp }: KeyOrigin): KeyOrigin => {
      if (network) {
        const error = validateExtendedPublicKeyForNetwork(xpub, network);
        if (error) {
          throw new Error(
            `xpubs do not match expected network ${network}: ${error}`,
          );
        }
      }
      return {
        bip32Path,
        xpub,
        xfp,
      };
    },
  );

  return {
    addressType: config.address_type() as MultisigAddressType,
    requiredSigners,
    keyOrigins,
    network: _network,
  };
};

export const encodeDescriptors = async (
  config: MultisigWalletConfig,
): Promise<{ receive: string; change: string }> => {
  const bdk = await getRustAPI();
  const { MultisigWalletConfig: RsWalletConfig } = bdk;
  const wallet = RsWalletConfig.from_str(JSON.stringify(config));

  return {
    receive: wallet.external_descriptor().to_string(),
    change: wallet.internal_descriptor().to_string(),
  };
};

const checksumRegex = /#[0-9a-zA-Z]{8}/g;

/**
 * Expands a descriptor with range notation (e.g., <0;1>) into separate external and internal descriptors.
 * If the descriptor doesn't contain range notation, falls back to traditional 0/* or 1/* detection.
 *
 * @param descriptor - The descriptor string, potentially containing <0;1> range notation
 * @returns Object with external and internal descriptor strings (without checksums)
 */
const expandRangeNotation = (
  descriptor: string,
): { external: string; internal: string } => {
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

export const getChecksum = async (descriptor: string) => {
  // let's just check that the descriptor is valid
  try {
    await getWalletFromDescriptor(descriptor);
  } catch (e) {
    if (e instanceof Error) {
      throw new Error(`Invalid descriptor: ${e.message}`);
    } else {
      throw e;
    }
  }
  const checksum = descriptor.match(checksumRegex);
  const pieces = descriptor.split("#");
  if (!checksum || pieces.length !== 2) {
    throw new Error("Could not find valid checksum");
  }
  return pieces[1];
};

export const getWalletFromDescriptor = async (
  descriptor: string,
  network?: Network,
): Promise<MultisigWalletConfig> => {
  const { external, internal } = expandRangeNotation(descriptor);
  return await decodeDescriptors(internal, external, network);
};

export default { encodeDescriptors, decodeDescriptors };
