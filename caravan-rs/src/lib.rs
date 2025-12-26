pub mod config;
pub mod utils;

use bdk::bitcoin::Network as BdkNetwork;
use bdk::descriptor::ExtendedDescriptor as BdkExtendedDescriptor;
use bdk::descriptor::checksum;
use bdk::KeychainKind::{External, Internal};
use std::str::FromStr;
use wasm_bindgen::prelude::*;

#[derive(Debug)]
#[wasm_bindgen]
pub struct Network(BdkNetwork);

#[wasm_bindgen]
impl Network {
    pub fn from_str(network: &str) -> Result<Network, JsError> {
        let network = BdkNetwork::from_str(network)?;
        Ok(Network(network))
    }

    pub fn to_string(&self) -> String {
        self.0.to_string()
    }
}

#[wasm_bindgen(start)]
pub fn init() {
    // initialization code
}

#[derive(Debug)]
#[wasm_bindgen]
pub struct ExtendedDescriptor(BdkExtendedDescriptor);

#[wasm_bindgen]
impl ExtendedDescriptor {
    pub fn from_str(descriptor: &str) -> Result<ExtendedDescriptor, JsError> {
        let descriptor = BdkExtendedDescriptor::from_str(descriptor)?;
        Ok(ExtendedDescriptor(descriptor))
    }

    pub fn to_string(&self) -> String {
        self.0.to_string()
    }

    pub fn get_address(&self, index: u32, network: Network) -> Result<String, JsError> {
        Ok(self
            .0
            .at_derivation_index(index)
            .address(network.0)?
            .to_string())
    }
}

#[derive(Debug)]
#[wasm_bindgen]
pub struct MultisigWalletConfig(config::MultisigWalletConfig);

#[wasm_bindgen]
impl MultisigWalletConfig {
    pub fn from_str(config: &str) -> Result<MultisigWalletConfig, JsError> {
        let config = config::MultisigWalletConfig::from_str(config)?;
        Ok(MultisigWalletConfig(config))
    }

    pub fn to_string(&self) -> String {
        self.0.to_string()
    }

    pub fn to_string_pretty(&self) -> String {
        self.0.to_string_pretty()
    }

    pub fn external_descriptor(&self) -> Result<ExtendedDescriptor, JsError> {
        let descriptor = self.0.descriptor(External)?;
        Ok(ExtendedDescriptor(descriptor))
    }

    pub fn external_address(&self, index: u32) -> Result<String, JsError> {
        let network = self.network();
        let external_descriptor = self.external_descriptor()?;
        Ok(external_descriptor.get_address(index, network)?)
    }

    pub fn internal_descriptor(&self) -> Result<ExtendedDescriptor, JsError> {
        let descriptor = self.0.descriptor(Internal)?;
        Ok(ExtendedDescriptor(descriptor))
    }

    pub fn internal_address(&self, index: u32) -> Result<String, JsError> {
        let network = self.network();
        let internal_descriptor = self.internal_descriptor()?;
        Ok(internal_descriptor.get_address(index, network)?)
    }

    pub fn network(&self) -> Network {
        Network(self.0.network())
    }
}

#[derive(Debug)]
#[wasm_bindgen]
pub struct CaravanConfig(config::CaravanConfig);

#[wasm_bindgen]
impl CaravanConfig {
    pub fn from_str(config: &str) -> Result<CaravanConfig, JsError> {
        let config = config::CaravanConfig::from_str(config)?;
        Ok(CaravanConfig(config))
    }

    pub fn new(
        network: Network,
        external_descriptor: ExtendedDescriptor,
        internal_descriptor: ExtendedDescriptor,
        name: String,
        client_type: String,
    ) -> Result<CaravanConfig, JsError> {
        let network = network.0;
        let external_descriptor = external_descriptor.0;
        let internal_descriptor = internal_descriptor.0;
        let config = config::CaravanConfig::new(
            network,
            external_descriptor,
            internal_descriptor,
            name,
            client_type,
        )?;
        Ok(CaravanConfig(config))
    }

    pub fn to_string(&self) -> String {
        self.0.to_string()
    }

    pub fn to_string_pretty(&self) -> String {
        self.0.to_string_pretty()
    }

    pub fn name(&self) -> String {
        self.0.name.clone()
    }

    pub fn address_type(&self) -> String {
        self.0.address_type.to_string()
    }

    pub fn external_descriptor(&self) -> Result<ExtendedDescriptor, JsError> {
        let descriptor = self.0.descriptor(External)?;
        Ok(ExtendedDescriptor(descriptor))
    }

    pub fn external_address(&self, index: u32) -> Result<String, JsError> {
        let network = self.network();
        let external_descriptor = self.external_descriptor()?;
        Ok(external_descriptor.get_address(index, network)?)
    }

    pub fn internal_descriptor(&self) -> Result<ExtendedDescriptor, JsError> {
        let descriptor = self.0.descriptor(Internal)?;
        Ok(ExtendedDescriptor(descriptor))
    }

    pub fn internal_address(&self, index: u32) -> Result<String, JsError> {
        let network = self.network();
        let internal_descriptor = self.internal_descriptor()?;
        Ok(internal_descriptor.get_address(index, network)?)
    }

    pub fn network(&self) -> Network {
        Network(self.0.network())
    }
}

/// Calculate the checksum for a descriptor string.
///
/// This function uses BDK's checksum calculation which follows BIP-380.
/// The descriptor string should not include a checksum (it will be ignored if present).
///
/// # Arguments
/// * `descriptor` - The descriptor string (with or without existing checksum)
///
/// # Returns
/// The 8-character checksum string
#[wasm_bindgen]
pub fn calc_descriptor_checksum(descriptor: &str) -> Result<String, JsError> {
    let checksum = checksum::calc_checksum(descriptor)
        .map_err(|e| JsError::new(&format!("Failed to calculate checksum: {}", e)))?;
    Ok(checksum)
}
