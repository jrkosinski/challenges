// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "hardhat/console.sol";

contract Escrow is ReentrancyGuard {
    
    struct Entry {
        bytes32 hashKey;
        address payer; 
        address payable receiver;
        address releaser;
        uint256 amount;
    }
    
    //TODO: should be mapping of mappings or array 
    mapping(address => Entry) public _entries;
    mapping(address => Entry[]) entries;
    
    //TODO: comments 
    
    function depositFor(address receiver, address releaser) external payable {
        address payer = msg.sender; 
        
        //TODO: error msg 
        //releaser should be different from both payer & receiver 
        require(releaser != receiver && releaser != payer); 
        require(msg.value > 0);
        
        (uint256 index, bool found) = getEntryIndex(releaser, payer, receiver);
        
        //if identical entry already exists, add to it
        if (found) {
            entries[releaser][index].amount += msg.value;
        }
        else { //otherwise, create new one
            Entry memory newEntry; 
            newEntry.hashKey = keccak256(abi.encodePacked(payer, receiver));
            newEntry.payer = payer;
            newEntry.receiver = payable(receiver);
            newEntry.releaser = releaser; 
            newEntry.amount = msg.value;
            
            entries[releaser].push(newEntry);
        }
    }
    
    function release() nonReentrant external {
        address releaser = msg.sender;
        (uint index, bool found) = getLastUnpaidEntryIndex(releaser);
        
        //checks: make sure entry exists 
        require(found); 
        
        Entry storage entry = entries[releaser][index]; 
        
        //effects: remove the entry
        entries[releaser].pop();
        
        //interactions: send the ether to receiver 
        (bool sent,) = entry.receiver.call{value:entry.amount}("");
        require(sent); 
    }
    
    function getEntry(address payer, address receiver, address releaser) external view returns (Entry memory entry) {
        (uint index, bool found) = getEntryIndex(releaser, payer, receiver);
        if (found) {
            entry = entries[releaser][index]; 
        }
        
        return entry;
    }
    
    function getLastUnpaidEntryIndex(address releaser) internal view returns (uint256, bool) {
        Entry[] storage entryArray = entries[releaser]; 
        uint storageIndex = 0;
        bool exists = entryArray.length > 0; 
        if (exists) {
            storageIndex = entryArray.length-1;
        }
        
        return (storageIndex, exists);
    }
    
    function getEntryIndex(address releaser, address payer, address receiver) internal view returns (uint256, bool) {
        bytes32 hashKey = keccak256(abi.encodePacked(payer, receiver));
        Entry[] storage entryArray = entries[releaser]; 
        uint storageIndex = 0;
        bool exists = false;
        
        for(uint n=0; n<entryArray.length; n++) {
            if (hashKey == entryArray[n].hashKey) {
                exists = true;
                break;
            }
        }
        
        return (storageIndex, exists);
    }
}