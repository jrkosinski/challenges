// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol"; 

/** 
 * @title Escrow
 */
contract Escrow is ReentrancyGuard {

    // a deposit record 
    struct Deposit {
        address payer;
        address payable receiver;
        address releaser;
        uint amount;
        bool paid;
    }

    //list of deposits per releaser 
    mapping(bytes32 => Deposit) public deposits;

    /**
     * @dev Deposits ether and creates a deposit record. If an identical unpaid 
     * deposit already exists, adds balance to that record. 
     * 
     * @param receiver who will receive the deposit when released
     * @param releaser who can release the deposit to the receiver (must be different from
     * both payer and receiver)
     */
    function depositFor(address receiver, address releaser) external payable returns (bytes32) {
        address payer = msg.sender; 
    
        //checks
        require(msg.value > 0, "Zero deposit not allowed"); 
        require(releaser != receiver && releaser != payer, "Releaser must be different"); 

        //get the deposit 
        bytes32 hash = keccak256(abi.encodePacked(payer, receiver, releaser)); 
        Deposit storage dep = deposits[hash]; 

        //if it does not exist, create it. If it's already been paid, overwrite it
        if (dep.paid == true || dep.amount == 0) {
            dep.amount = msg.value;
            dep.payer = payer;
            dep.receiver = payable(receiver); 
            dep.releaser = releaser;
            dep.paid = false;
        }
        else {
            //if it already exists, increase its value 
            dep.amount += msg.value;
        }

        return hash;
    }

    /**
     * @dev Releases an escrow deposit to the authorized receiver, if found. Releases 
     * the most recent deposit which has the sender as the releaser.
     * 
     * Throws if deposit record not found. 
     * Throws if failed to send payment. 
     * Throws if the caller is not the releaser.
     */
    function release(bytes32 hash) external nonReentrant {
        Deposit storage dep = deposits[hash];
        
        //checks 
        require(dep.amount > 0, "Escrow deposit not found");
        require(dep.paid == false, "Escrow deposit not found");
        require(dep.releaser == msg.sender, "Caller must be releaser"); 

        //effects
        dep.paid = true;

        //interactions
        (bool sent,) = dep.receiver.call{value:dep.amount}("");
        require(sent);
    }

    /**
     * @dev Finds and returns an existing deposit record with the given payer, 
     * receiver, and releaser. 
     * 
     * @return deposit The deposit record, or a default record if not found.
     */
    function getDeposit(address payer, address receiver, address releaser) external view returns (Deposit memory) {
        bytes32 hash = keccak256(abi.encodePacked(payer, receiver, releaser)); 
        return getDepositByHash(hash);
    }

    /**
     * @dev Finds and returns an existing deposit record with the given hash of payer, 
     * receiver, and releaser. 
     * 
     * @return deposit The deposit record, or a default record if not found.
     */
    function getDepositByHash(bytes32 hash) public view returns (Deposit memory) {
        return deposits[hash]; 
    }
}