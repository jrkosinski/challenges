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
    
    
    /**
     * @dev Deposits ether and creates a deposit record. If an identical unpaid 
     * deposit already exists, adds balance to that record. 
     * 
     * @param receiver who will receive the deposit when released
     * @param releaser who can release the deposit to the receiver (must be different from
     * both payer and receiver)
     */
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
    
    /**
     * @dev Releases an escrow deposit to the authorized receiver, if found. Releases 
     * the most recent deposit which has the sender as the releaser.
     * 
     * Throws if deposit record not found. 
     * Throws if failed to send payment. 
     */
    function release() nonReentrant external {
        address releaser = msg.sender;
        (uint index, bool found) = getLastUnpaidDepositIndex(releaser);
        
        //checks: make sure entry exists 
        require(found, "Escrow deposit not found"); 
        
        Deposit memory dep = deposits[releaser][index]; 
        
        //effects: remove the entry
        deposits[releaser].pop();
        
        //interactions: send the ether to receiver 
        (bool sent,) = dep.receiver.call{value:dep.amount}("");
        require(sent, "Failed to send payment"); 
    }
    
    /**
     * @dev Finds and returns an existing deposit record with the given payer, 
     * receiver, and releaser. 
     * 
     * @return deposit The deposit record, or a default record if not found.
     */
    function getDeposit(address payer, address receiver, address releaser) external view returns (Deposit memory deposit) {
        (uint index, bool found) = getDepositIndex(releaser, payer, receiver);
        if (found) {
            deposit = deposits[releaser][index]; 
        }
        
        return deposit;
    }
    
    
    //NON-PUBLIC METHODS 
    
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