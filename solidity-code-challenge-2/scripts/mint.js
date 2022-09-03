const { ethers } = require("hardhat");
const Runner = require("./lib/runner");
const constants = require("./constants"); 

//deployed token address goes here 
const NFT_ADDR = constants.NFT_ADDRESS;

/**
 * Runs the initialMint function directly on the token contract. 
 */
Runner.run(async (provider, owner) => {
    
    console.log(' * * * '); 
    console.log("Minting ", constants.TOKEN_CONTRACT_ID); 
    console.log(""); 
    
    //get NFT contract 
    const nft = await ethers.getContractAt(constants.TOKEN_CONTRACT_ID, NFT_ADDR);   
    
    //run initial mint
    await nft.initialMint(); 
    
    //verify 
    console.log(`supply belonging to contract admin is ${await nft.balanceOf(owner.address)}`);
});

