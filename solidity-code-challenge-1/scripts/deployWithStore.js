const Deployer = require("./deployer");
const Runner = require("./lib/runner");
const constants = require("./constants"); 

/**
 * Deploys token contract with initial specified parameters, and sets royalty info. 
 * Deploys the token mint store contract, and gives it minter role permission. 
 */
Runner.run(async (provider, owner) => {
    
    //TODO: combine this into function with deployTokenOnly
    console.log(' * * * '); 
    console.log("Deploying ", constants.TOKEN_CONTRACT_ID); 
    console.log(""); 
    
    //deploy NFT contract 
    const nft = await Deployer.deployNFT();
    console.log(`NFT address is ${nft.address}`);
    
    //deploy store contract 
    const store = await Deployer.deployStore(nft.address); 
    console.log(`NFT store address is ${store.address}`);
    
    console.log(' * * * '); 
    console.log(""); 

    //display details 
    console.log(`base uri: ${await nft.baseUri()}`);
    console.log(`max supply: ${await nft.maxSupply()}`);
    console.log(`collection size: ${await nft.collectionSize()}`);
    console.log(""); 

    //set royalty info
    await nft.setRoyaltyInfo(
        owner.address,
        constants.ROYALTY_NUMERATOR,
        constants.ROYALTY_DENOMINATOR
    ); 
    
    //set the store as a minter 
    await nft.grantRole(constants.MINTER_ROLE, store.address); 
});

