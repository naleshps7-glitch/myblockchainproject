/**
 * blockchain.js — Blockchain configuration for BlockAuth frontend
 *
 * HOW TO CONFIGURE:
 * 1. Start your local Hardhat node:   cd contracts && npm run node
 * 2. Deploy the contract:             cd contracts && npm run deploy
 * 3. Copy the printed address below into CONTRACT_ADDRESS.
 * 4. Restart the frontend dev server.
 *
 * The ABI below is the compiled interface of ProductRegistry.sol.
 */

// ── Replace with your deployed contract address ───────────────────────────────
export const CONTRACT_ADDRESS = "0x0000000000000000000000000000000000000000";
// ^^ Placeholder — deployment required. The app will show a clear warning.

// ── Hardhat localhost chain ID ────────────────────────────────────────────────
export const CHAIN_ID = 31337; // Change to 11155111 for Sepolia testnet

export const NETWORK_NAME = "Hardhat Localhost";

// ── ProductRegistry ABI ───────────────────────────────────────────────────────
export const CONTRACT_ABI = [
  // Events
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true,  "internalType": "string",  "name": "productId",    "type": "string"  },
      { "indexed": true,  "internalType": "address", "name": "registeredBy", "type": "address" },
      { "indexed": false, "internalType": "uint256", "name": "registeredAt", "type": "uint256" }
    ],
    "name": "ProductRegistered",
    "type": "event"
  },
  // Read functions
  {
    "inputs": [{ "internalType": "address", "name": "_addr", "type": "address" }],
    "name": "isAuthorized",
    "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [{ "internalType": "address", "name": "", "type": "address" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "string", "name": "_productId", "type": "string" }],
    "name": "verifyProduct",
    "outputs": [
      { "internalType": "bool",    "name": "isOriginal",   "type": "bool"    },
      { "internalType": "address", "name": "registeredBy", "type": "address" },
      { "internalType": "uint256", "name": "registeredAt", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  // Write functions
  {
    "inputs": [{ "internalType": "string", "name": "_productId", "type": "string" }],
    "name": "registerProduct",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "address", "name": "_manufacturer", "type": "address" }],
    "name": "authorizeManufacturer",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "address", "name": "_manufacturer", "type": "address" }],
    "name": "revokeManufacturer",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];
