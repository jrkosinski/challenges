const { ethers } = require("hardhat");

module.exports = {
    //general utility
    STORE_CONTRACT_ID: "TokenMintStore",
    TOKEN_CONTRACT_ID: "Template721",
    MINTER_ROLE: "0xf0887ba65ee2024ea881d91b74c2450ef19e1557f03bed3ea9f16b037cbe2dc9",
    ZERO_ADDRESS: "0x0000000000000000000000000000000000000000", 

    //if NFT is already deployed, put its address here 
    NFT_ADDRESS: "<INSERT_NFT_ADDRESS_HERE>",
    
    //token details 
    TOKEN_NAME: "<INSERT_TOKEN_NAME>",
    TOKEN_SYMBOL: "<INSERT_TOKEN_SYMBOL>", 
    BASE_URI: "<INSERT_URI>/",
    
    //supply params 
    MAX_SUPPLY: 0,
    COLLECTION_SIZE: 0,
    
    //minting info 
    MINT_PRICE: ethers.utils.parseEther("<INSERT_BASE_MINT_PRICE_IN_ETHER>"),
    
    //royalties
    ROYALTY_NUMERATOR: 0,
    ROYALTY_DENOMINATOR: 1000
}; 