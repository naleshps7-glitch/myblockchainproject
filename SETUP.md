# BlockAuth — Setup Guide

A blockchain-based product authentication and PDF similarity verification system.

---

## Project Structure

```
blockauth/
├── index.html              
├── vite.config.js          
├── package.json            
├── src/
│   ├── main.jsx            
│   ├── App.jsx             
│   ├── index.css           
│   ├── config/
│   │   └── blockchain.js   (CONTRACT ADDRESS goes here)
│   ├── hooks/
│   │   └── useBlockchain.js
│   └── pages/
│       ├── HomePage.jsx
│       ├── ProductPage.jsx
│       ├── RegisterPage.jsx
│       ├── VerifyPage.jsx
│       └── PdfPage.jsx
├── backend/
│   ├── server.js           
│   └── package.json
└── contracts/
    ├── ProductRegistry.sol 
    ├── hardhat.config.js
    ├── package.json
    └── scripts/
        └── deploy.js       
```

---

## Prerequisites

- Node.js >= 18  (https://nodejs.org)
- npm >= 9
- MetaMask browser extension (https://metamask.io)

---

## Step 1 - Frontend Setup

```bash
# From the blockauth/ root directory:
npm install
npm run dev
# Opens http://localhost:5173
```

At this point the UI loads but blockchain features show a "Contract not deployed" warning. Continue with Steps 2 and 3.

---

## Step 2 - Deploy the Smart Contract

### 2a - Install Hardhat

```bash
cd contracts
npm install
```

### 2b - Start a local Ethereum node

Open a new terminal and run:

```bash
cd contracts
npm run node
```

This starts a local Hardhat node at http://127.0.0.1:8545.
It prints 20 test accounts with private keys. Keep this terminal open.

### 2c - Deploy the contract

In another terminal:

```bash
cd contracts
npm run deploy
```

You will see output like:

```
ProductRegistry deployed to: 0x5FbDB2315678afecb367f032d93F642f64180aa3

Copy this address into your frontend config:
src/config/blockchain.js  ->  CONTRACT_ADDRESS = "0x5FbDB..."
```

### 2d - Update the frontend config

Open src/config/blockchain.js and replace:

```js
export const CONTRACT_ADDRESS = "0x0000000000000000000000000000000000000000";
```

with the printed address:

```js
export const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
```

Save the file. Vite hot-reloads automatically.

---

## Step 3 - Connect MetaMask to Hardhat Localhost

1. Open MetaMask -> Settings -> Networks -> Add Network.
2. Fill in:
   - Network Name: Hardhat Localhost
   - RPC URL: http://127.0.0.1:8545
   - Chain ID: 31337
   - Currency Symbol: ETH
3. Click Save, then switch to this network.
4. Import a test account:
   - In the Hardhat node terminal, copy a private key (starts with 0xac094...).
   - MetaMask -> Import Account -> paste the private key.
   - This account is the contract owner and is pre-authorized to register products.

---

## Step 4 - Start the PDF Backend

```bash
cd backend
npm install
npm start
# Runs on http://localhost:5001
```

The frontend calls http://localhost:5001/api/compare-pdfs automatically.

---

## Testing the Full Flow

### Product Registration

1. Go to Product Verification -> Product Registration.
2. Enter a Product ID (e.g., NK003).
3. Click the Sign button to sign the product ID with MetaMask (proves you control the key).
4. Click Register Product.
5. Confirm in MetaMask -> transaction is mined -> success message appears.

### Product Verification

1. Go to Product Verification -> Verify Product.
2. Enter NK003.
3. Click Verify Product.
4. Result: "Product is Original" with on-chain registration details.
5. Try a random ID (e.g., FAKE999) -> "Not Registered / First Copy".

### PDF Similarity

1. Go to PDF Verification.
2. Upload 2 PDF files (drag and drop or click).
3. Click Check Similarity.
4. Result shows the similarity percentage and verdict.

---

## Authorization Model

- The contract deployer is automatically the owner and an authorized manufacturer.
- The owner can authorize other wallets by calling authorizeManufacturer(address) on-chain.
- Only authorized wallets can successfully call registerProduct().
- Anyone can call verifyProduct(). No wallet required for verification.

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "Contract not deployed" warning | Complete Steps 2c and 2d |
| MetaMask shows wrong network | Switch to Hardhat Localhost (Chain ID 31337) |
| "Not authorized" on registration | Use the imported Hardhat test account |
| "Cannot connect to blockchain node" on verify | Start npm run node in contracts/ |
| PDF backend error | Start npm start in backend/ |
| "Nonce too high" in MetaMask | Settings -> Advanced -> Reset Account |

---

## Security Notes (Educational Context)

- This project runs on a local development blockchain.
- The digital signature field uses EIP-191 personal_sign to prove wallet ownership.
- PDF files are processed in memory on the local backend and are never stored.
