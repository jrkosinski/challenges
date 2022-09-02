// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract Escrow is ReentrancyGuard {
    struct Entry {
        address payer; 
        address payable receiver;
        address releaser;
        uint256 amount;
        bool paidOut;
    }
    
    //TODO: should be mapping of mappings or array 
    mapping(address => Entry) internal entries;
    
    //TODO: comments 
    
    function depositFor(address receiver, address releaser) external payable {
        address payer = msg.sender; 
        
        //TODO: error msg 
        //releaser should be different from both payer & receiver 
        require(releaser != receiver && releaser != payer); 
        require(msg.value > 0);
        
        Entry storage newEntry = entries[releaser]; 
        newEntry.payer = payer;
        newEntry.receiver = payable(receiver);
        newEntry.releaser = releaser; 
        newEntry.amount = msg.value;
        newEntry.paidOut = false;
    }
    
    function release() nonReentrant external {
        Entry memory entry = entries[msg.sender]; 
        
        //checks: make sure entry exists && amount is > 0
        require(entry.amount > 0); 
        
        //effects: set the entry as paid out already 
        entry.paidOut = true;
        
        //interactions: send the ether to receiver 
        (bool sent,) = entry.receiver.call{value:entry.amount}("");
        require(sent); 
    }
}