const Runner = require("./lib/runner");
const constants = require("./constants"); 

//deployed token address goes here 
const NFT_ADDR = constants.NFT_ADDRESS;

/**
 * Displays some information about the token contract. 
 */
Runner.run(async (provider, owner) => {

    console.log(' * * * ');
    console.log("Getting ", constants.TOKEN_CONTRACT_ID); 
    console.log("");

    //get NFT contract 
    const nft = await ethers.getContractAt(constants.TOKEN_CONTRACT_ID, NFT_ADDR);    

    console.log(' * * * ');
    console.log("");

    //display general details  
    console.log(`base uri: ${await nft.baseUri()}`);
    console.log(`max supply: ${await nft.maxSupply()}`);
    console.log(`collection size: ${await nft.collectionSize()}`);
    console.log("");

    //display royalty info 
    const royalties = await nft.getRoyaltyInfo();
    console.log(`royalties are set to [${royalties[1]}/${royalties[2]}], and will be paid to ${royalties[0]}`);
});

