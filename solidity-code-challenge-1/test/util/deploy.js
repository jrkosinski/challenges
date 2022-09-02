const constants = require("./constants");
const utils = require("../../scripts/lib/utils");

module.exports = {
    deployContract : async () => {
        return await utils.deployContractSilent(constants.CONTRACT_NAME); 
    }, 
    
    deployUnpayable: async () => {
        return await utils.deployContractSilent("Unpayable"); 
    }
};