// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "./EthPool.sol";

//for testing only
contract Unpayable { 
    function stakeTo(address payable poolAddress) external payable {
        EthPool pool = EthPool(poolAddress); 
        pool.stake{value:msg.value}();
    }
    
    function withdrawFrom(address payable poolAddress, uint amount) external {
        EthPool pool = EthPool(poolAddress); 
        pool.withdraw(amount);
    }
}