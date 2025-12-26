import { getRustAPI } from "./wasmLoader";
import {
  MultisigAddressType,
  Network,
  validateExtendedPublicKeyForNetwork,
} from "@caravan/bitcoin";
import { KeyOrigin } from "@caravan/wallets";
import {
  expandToMultipathWalletDescriptor,
  parseDescriptorPaths,
  CHECKSUM_REGEX,
} from "./utils/multipath";

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

/**
 * Decodes separate external and internal descriptors into a multisig wallet config.
 * Extracts wallet type, required signers, key origins, and validates network compatibility.
 *
 * @example
 * ```typescript
 * const external = "sh(sortedmulti(2,[f57ec65d/45'/0'/100']xpub.../0/*,...))#checksum";
 * const internal = "sh(sortedmulti(2,[f57ec65d/45'/0'/100']xpub.../1/*,...))#checksum";
 *
 * const config = await decodeDescriptors(internal, external);
 * // Returns: { requiredSigners: 2, addressType: "P2SH", keyOrigins: [...], network: "bitcoin" }
 *
 * // With network validation
 * const config2 = await decodeDescriptors(internal, external, "testnet");
 * ```
 *
 * @param internal - Internal (change) descriptor string
 * @param external - External (receive) descriptor string
 * @param network - Optional network for validation (defaults to "bitcoin"/mainnet)
 * @returns Promise resolving to multisig wallet configuration
 * @throws Error if descriptors are invalid or xpubs don't match network
 */
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

/**
 * Encodes a multisig wallet config into separate external (receive) and internal (change) descriptors.
 *
 * @example
 * ```typescript
 * const config = {
 *   requiredSigners: 2,
 *   addressType: "P2SH",
 *   keyOrigins: [
 *     { xfp: "f57ec65d", bip32Path: "m/45'/0'/100'", xpub: "xpub..." },
 *     { xfp: "efa5d916", bip32Path: "m/45'/0'/100'", xpub: "xpub..." }
 *   ],
 *   network: "bitcoin"
 * };
 *
 * const { receive, change } = await encodeDescriptors(config);
 * // receive: "sh(sortedmulti(2,[...]/0/*,...))#checksum"
 * // change: "sh(sortedmulti(2,[...]/1/*,...))#checksum"
 * ```
 *
 * @param config - Multisig wallet configuration
 * @returns Promise resolving to an object with `receive` (external) and `change` (internal) descriptor strings
 */
export const encodeDescriptors = async (
  config: MultisigWalletConfig,
): Promise<{ receive: string; change: string }> => {
  const bdk = await getRustAPI();
  const { MultisigWalletConfig: RsWalletConfig } = bdk;
  const wallet = RsWalletConfig.from_str(JSON.stringify(config));

  const externalDesc = wallet.external_descriptor().to_string();
  const internalDesc = wallet.internal_descriptor().to_string();

  return { receive: externalDesc, change: internalDesc };
};

/**
 * Encodes a multisig wallet config into a single BIP389 multipath descriptor.
 * The resulting descriptor uses `<0;1>/*` notation to represent both external
 * (receive) and internal (change) derivation paths in a single descriptor string.
 *
 * **Note:** This function supports the `<0;1>/*` tuple format specifically,
 * which covers the primary wallet use case. BIP389 allows arbitrary tuples,
 * but only `<0;1>` tuples are currently supported.
 *
 * @example
 * ```typescript
 * const config = {
 *   requiredSigners: 2,
 *   addressType: "P2WSH",
 *   keyOrigins: [
 *     { xfp: "d52d08fc", bip32Path: "m/48'/1'/0'/2'", xpub: "tpubXXX..." },
 *     { xfp: "85b4d568", bip32Path: "m/48'/1'/0'/2'", xpub: "tpubYYY..." }
 *   ],
 *   network: "testnet"
 * };
 *
 * const multipathDesc = await encodeDescriptorWithMultipath(config);
 * // Returns: "wsh(sortedmulti(2,[d52d08fc/48h/1h/0h/2h]tpubXXX/<0;1>/*,[85b4d568/48h/1h/0h/2h]tpubYYY/<0;1>/*))#checksum"
 * ```
 *
 * @param config - Multisig wallet configuration
 * @returns Promise resolving to a single descriptor string with BIP389 multipath notation (`<0;1>/*`)
 */
export const encodeDescriptorWithMultipath = async (
  config: MultisigWalletConfig,
): Promise<string> => {
  const bdk = await getRustAPI();
  const { MultisigWalletConfig: RsWalletConfig } = bdk;
  const wallet = RsWalletConfig.from_str(JSON.stringify(config));

  const externalDesc = wallet.external_descriptor().to_string();

  // Convert to multipath notation and return single descriptor
  const multipathDescriptor = expandToMultipathWalletDescriptor(externalDesc);
  return multipathDescriptor;
};

export const getChecksum = async (descriptor: string) => {
  // let's just check that the descriptor is valid
  try {
    await getWalletConfigFromDescriptor(descriptor);
  } catch (e) {
    if (e instanceof Error) {
      throw new Error(`Invalid descriptor: ${e.message}`);
    } else {
      throw e;
    }
  }
  const checksum = descriptor.match(CHECKSUM_REGEX);
  const pieces = descriptor.split("#");
  if (!checksum || pieces.length !== 2) {
    throw new Error("Could not find valid checksum");
  }
  return pieces[1];
};

/**
 * Parses a single descriptor (multipath or traditional) and converts it into a multisig wallet config.
 * Supports both BIP389 multipath notation (`/<0;1>/*`) and traditional notation (`/0/*` or `/1/*`).
 *
 * @example
 * ```typescript
 * // Multipath descriptor
 * const multipathDesc = "wsh(sortedmulti(2,[...]/<0;1>/*,...))#checksum";
 * const config = await getWalletConfigFromDescriptor(multipathDesc);
 *
 * // Traditional external descriptor
 * const externalDesc = "wsh(sortedmulti(2,[...]/0/*,...))#checksum";
 * const config2 = await getWalletConfigFromDescriptor(externalDesc);
 *
 * // With network specified
 * const config3 = await getWalletConfigFromDescriptor(multipathDesc, "testnet");
 * ```
 *
 * @param descriptor - Descriptor string (multipath or traditional notation)
 * @param network - Optional network specification
 * @returns Promise resolving to multisig wallet configuration
 */
export const getWalletConfigFromDescriptor = async (
  descriptor: string,
  network?: Network,
): Promise<MultisigWalletConfig> => {
  const { external, internal } = parseDescriptorPaths(descriptor);
  return await decodeDescriptors(internal, external, network);
};

export default {
  encodeDescriptors,
  encodeDescriptorWithMultipath,
  decodeDescriptors,
};
