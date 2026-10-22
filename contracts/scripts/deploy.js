/**
 * deploy.js — Hardhat deployment script for ProductRegistry
 *
 * Usage:
 *   npm run deploy        (uses localhost network by default)
 *
 * After deploying, copy the printed contract address into the
 * frontend's src/config/blockchain.js file.
 */

const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("\n📦  Deploying ProductRegistry with account:", deployer.address);
  console.log(
    "    Balance:",
    ethers.formatEther(await ethers.provider.getBalance(deployer.address)),
    "ETH\n"
  );

  const ProductRegistry = await ethers.getContractFactory("ProductRegistry");
  const registry        = await ProductRegistry.deploy();

  await registry.waitForDeployment();

  const address = await registry.getAddress();

  console.log("✅  ProductRegistry deployed to:", address);
  console.log("\n─────────────────────────────────────────────────────────");
  console.log("  Copy this address into your frontend config:");
  console.log(`  src/config/blockchain.js  →  CONTRACT_ADDRESS = "${address}"`);
  console.log("─────────────────────────────────────────────────────────\n");
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
