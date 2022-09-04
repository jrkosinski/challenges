// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.4;

library PercentageBasis {
    function XisWhatPercentageOfY(uint x, uint y, uint8 precision) public pure returns (uint256 result, uint256 whole, uint256 decimal) {
        require(precision >= 1);
        
        if (y == 0) 
            return (0, 0, 0);
            
        uint multiplier = 10**(precision-1); 
        result = ((x * multiplier) / y * 100); 
        whole = result / multiplier; 
        decimal = result - (whole * multiplier); 
    }
    
    function whatIsXPercentOfY(uint x, uint y, uint8 precision) public pure returns (uint256 result, uint256 whole, uint256 decimal) {
        require(precision >= 1);
        
        if (y == 0) 
            return (0, 0, 0);
            
        uint multiplier = 10**(precision-1); 
        result = (x * multiplier)/100 * y; 
        whole = result/multiplier; 
        decimal = result - (whole * multiplier);
    }
}