// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "hardhat/console.sol";

contract Escrow is ReentrancyGuard {
    
    struct Deposit {
        bytes32 hashKey;
        address payer; 
        address payable receiver;
        address releaser;
        uint256 amount;
    }
    
    mapping(address => Deposit[]) deposits;
    
    //TODO: comments 
    
    function depositFor(address receiver, address releaser) external payable {
        address payer = msg.sender; 
        
        //releaser should be different from both payer & receiver 
        require(releaser != receiver && releaser != payer, "Releaser must be different"); 
        require(msg.value > 0, "Zero deposit not allowed");
        
        (uint256 index, bool found) = getDepositIndex(releaser, payer, receiver);
        
        //if identical entry already exists, add to it
        if (found) {
            deposits[releaser][index].amount += msg.value;
        }
        else { //otherwise, create new one
            Deposit memory newDeposit; 
            newDeposit.hashKey = keccak256(abi.encodePacked(payer, receiver));
            newDeposit.payer = payer;
            newDeposit.receiver = payable(receiver);
            newDeposit.releaser = releaser; 
            newDeposit.amount = msg.value;
            
            deposits[releaser].push(newDeposit);
        }
    }
    
    function release() nonReentrant external {
        address releaser = msg.sender;
        (uint index, bool found) = getLastUnpaidDepositIndex(releaser);
        
        //checks: make sure entry exists 
        require(found, "Escrow deposit not found"); 
        
        Deposit storage dep = deposits[releaser][index]; 
        
        //effects: remove the entry
        deposits[releaser].pop();
        
        //interactions: send the ether to receiver 
        (bool sent,) = dep.receiver.call{value:dep.amount}("");
        require(sent); 
    }
    
    function getDeposit(address payer, address receiver, address releaser) external view returns (Deposit memory deposit) {
        (uint index, bool found) = getDepositIndex(releaser, payer, receiver);
        if (found) {
            deposit = deposits[releaser][index]; 
        }
        
        return deposit;
    }
    
    function getLastUnpaidDepositIndex(address releaser) internal view returns (uint256, bool) {
        Deposit[] storage depArray = deposits[releaser]; 
        uint storageIndex = 0;
        bool exists = depArray.length > 0; 
        if (exists) {
            storageIndex = depArray.length-1;
        }
        
        return (storageIndex, exists);
    }
    
    function getDepositIndex(address releaser, address payer, address receiver) internal view returns (uint256, bool) {
        Deposit[] storage depArray = deposits[releaser]; 
        
        uint storageIndex = 0;
        bool exists = false;
        bytes32 hashKey = keccak256(abi.encodePacked(payer, receiver));
        
        for(uint n=0; n<depArray.length; n++) {
            if (hashKey == depArray[n].hashKey) {
                storageIndex = n;
                exists = true;
                break;
            }
        }
        
        return (storageIndex, exists);
    }
}