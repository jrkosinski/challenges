const Deployer = require("./deployer");
const Runner = require("./lib/runner");
const constants = require("./constants"); 

/**
 * Deploys token contract with initial specified parameters, and sets royalty info. 
 * Does not deploy token mint store. 
 */
Runner.run(async (provider, owner) => {

    console.log(' * * * ');
    console.log("Deploying ", constants.TOKEN_CONTRACT_ID);
    console.log("");

    //deploy NFT contract 
    const nft = await Deployer.deployNFT();
    console.log(`NFT address is ${nft.address}`);

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
    
    //display royalty info 
    const royalties = await nft.getRoyaltyInfo();
    console.log(`royalties are set to [${royalties[1]}/${royalties[2]}], and will be paid to ${royalties[0]}`);
});

