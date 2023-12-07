# MultiSig Contract

## Overview

The **MultiSig (Multi-Signature)** contract is a Solidity smart contract that implements multi-signature wallet functionality. In a multi-signature wallet, multiple parties must agree on a transaction before it can be executed. This contract supports both transaction execution and the addition of new members to the list of authorized owners.

## Features

1. **Multi-Signature Transactions:**
   - Multiple owners can submit transactions to the contract.
   - Transactions require a predefined number of confirmations from owners before they can be executed.
   - Owners can confirm transactions to meet the required confirmation threshold.

2. **Member Management:**
   - Owners can propose to add new members to the list of authorized owners.
   - New member addition requires confirmation from a predefined number of existing owners.
   - The contract owner has the ability to add new members directly without confirmation if the total number of owners is below a certain threshold.

3. **Funds Management:**
   - The contract can receive funds, and the amount and depositor's address are tracked.
   - Owners can submit transactions to transfer funds from the contract to a specified destination.

## How It Works

### Contract Deployment

- The contract is deployed with an initial set of owners and configuration parameters.
- If no owners are specified during deployment, the deployer becomes the sole owner.
- Sole Owner Can Add Members Without ocnfrimations Till The Add member Thresholds Is Met.

### Transaction Submission and Confirmation

1. Owners can submit transactions using the `submitTransaction` function, specifying the destination, value, and data.
2. Owners confirm their own transactions using the `confirmTransaction` function.
3. Once a transaction receives the required number of confirmations, any owner can execute it using the `executeTransaction` function.

### Member Addition

1. Owners can propose to add new members using the `submitAddRequest` function.
2. Existing owners confirm the addition request using the `confirmAdding` function.
3. If the confirmation threshold is met, the new member is added to the list of owners.

### Additional Information

- Owners can query the list of current owners using the `getOwners` function (for testing purposes).

## Run The Test Locally 

1. Clone the repository: `git clone https://github.com/mdasifahamed/Multi-Signature-Wallet.git`
2. Move To Project Directory: `cd Multi-Signature-Wallet`
3. Install test dependencies from project root: `npm i --save-dev`
4. Run tests: `npx hardhat test`





