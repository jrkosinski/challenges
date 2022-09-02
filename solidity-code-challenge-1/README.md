# Instructions

- You should work on a private GitHub copy of this task
- Clone the repository for local development
- Setup your dev environment. It's recommended you use yarn as a package manager and hardhat as your Blockchain framework. It's ok to use truffle if you prefer it here.
- Complete the escrow smart contract described below
- Write Javascript unit tests for each function
- Push your work to your private GitHub repository copy when done
- Confirm that the GitHub test workflow action runs your unit tests and they pass

This should probably take you less than 2 hours to complete

## Acceptance Criteria
- The Escrow smart contract has the depositFor() and release() functions specified below and they work
- There's 100% code coverage
- All smart contract tests are run by GitHub actions CI on each push to GitHub and they are all passing
- Code shouuld be readable and maintainable

## Escrow Smart Contract Functionality

### Has a depositFor(...) function
- When the function is called it takes the deposited amount of ETH from the payer account that called depositFor().
- Sets the payee address.
- The ETH is held by the smart contract in "escrow" for the payee.
- Sets a separate releaser account that will release the transfer to the receiver. This third account will be a different account than the depositing account or the receiver.
- This function can be called by anyone to create their own escrow. The contract can manage multiple escrows for different payer, payee and releaser accounts with separate ETH deposit amounts.
- Write tests for each of thes conditions.

### Has an release(...) function
- Transfers the tokens to the receiver address that was specified when the escrow was created with the depositFor function call
- release can only be called by the releaser account that was specified when the escrow was created with the depositFor function call
- Write tests for each of thes conditions.
