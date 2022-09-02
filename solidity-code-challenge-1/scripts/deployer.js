const utils = require("./lib/utils");
const constants = require("./constants"); 


module.exports = {
    deployNFT: async () => {
        return await utils.deployContractSilent(constants.TOKEN_CONTRACT_ID, [ 
            constants.ZERO_ADDRESS, 
            constants.TOKEN_NAME,
            constants.TOKEN_SYMBOL,
            constants.MAX_SUPPLY, 
            constants.COLLECTION_SIZE,
            constants.BASE_URI
        ]); 
    }, 
    
    deployStore: async (nftAddr) => {
        return await utils.deployContractSilent(constants.STORE_CONTRACT_ID, [  
            nftAddr, 
            constants.MINT_PRICE
        ]); 
    }
};

