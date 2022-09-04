const constants = require("./constants");
const utils = require("../../scripts/lib/utils");
const { ethers, waffle } = require("hardhat");

module.exports = {
    deployContract : async () => {
        const libContract = await utils.deployContractSilent("PercentageBasis");
        const contractFactory = await ethers.getContractFactory(constants.CONTRACT_NAME, {
            libraries: {
                PercentageBasis: libContract.address,
            },
        });
        return await contractFactory.deploy(); 
    }, 
    
    deployLibrary: async () => {
        return await utils.deployContractSilent("PercentageBasis");
    }, 
    
    deployUnpayable: async () => {
        return await utils.deployContractSilent("Unpayable");
    }
};