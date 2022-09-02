require("@nomiclabs/hardhat-waffle");
require("solidity-coverage"); 

const RINKEBY_API_KEY = "...";
const ETH_MAINNET_API_KEY = "...";
const POLYGON_API_KEY = "...";
const PRIVATE_KEY = "...";

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
    solidity: "0.8.4",
    networks: {
        rinkeby: {
            url: `https://eth-rinkeby.alchemyapi.io/v2/${RINKEBY_API_KEY}`,
            accounts: [`${PRIVATE_KEY}`]
        },
        mainnet: {
            url: `https://eth-mainnet.g.alchemy.com/v2/${ETH_MAINNET_API_KEY}`,
            accounts: [`${PRIVATE_KEY}`]
        },
        polygon: {
            url: `https://polygon-mainnet.g.alchemy.com/v2/${POLYGON_API_KEY}`,
            accounts: [`${PRIVATE_KEY}`]
        },
    }
};



