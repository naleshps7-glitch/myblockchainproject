/**
 * useBlockchain.js — React hook for MetaMask + ethers.js blockchain interactions
 *
 * Provides:
 *  - connectWallet()         → connect MetaMask
 *  - registerProduct(id)     → send registration transaction
 *  - verifyProduct(id)       → read-only verification call
 *  - checkAuthorization()    → check if connected wallet is authorized
 *  - account, isAuthorized, chainId, networkOk
 */

import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESS, CONTRACT_ABI, CHAIN_ID } from '../config/blockchain';

const PLACEHOLDER_ADDRESS = '0x0000000000000000000000000000000000000000';

export function useBlockchain() {
  const [account,      setAccount]      = useState(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [chainId,      setChainId]      = useState(null);
  const [networkOk,    setNetworkOk]    = useState(false);
  const [connecting,   setConnecting]   = useState(false);
  const [error,        setError]        = useState(null);

  // ── Detect MetaMask ───────────────────────────────────────────────────────

  const hasMetaMask = () =>
    typeof window !== 'undefined' && Boolean(window.ethereum);

  // ── Get contract instance ─────────────────────────────────────────────────

  const getContract = useCallback(async (withSigner = false) => {
    if (!hasMetaMask()) throw new Error('MetaMask is not installed.');
    if (CONTRACT_ADDRESS === PLACEHOLDER_ADDRESS) {
      throw new Error(
        'Contract not deployed. Please run the deployment steps in SETUP.md first.'
      );
    }

    const provider = new ethers.BrowserProvider(window.ethereum);
    if (withSigner) {
      const signer = await provider.getSigner();
      return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
    }
    return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
  }, []);

  // ── Connect wallet ────────────────────────────────────────────────────────

  const connectWallet = useCallback(async () => {
    setError(null);
    if (!hasMetaMask()) {
      setError('MetaMask is not installed. Please install it from metamask.io');
      return;
    }

    try {
      setConnecting(true);
      const provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send('eth_requestAccounts', []);
      const signer = await provider.getSigner();
      const addr   = await signer.getAddress();
      const net    = await provider.getNetwork();

      setAccount(addr);
      setChainId(Number(net.chainId));
      setNetworkOk(Number(net.chainId) === CHAIN_ID);

      // Check authorization
      if (CONTRACT_ADDRESS !== PLACEHOLDER_ADDRESS) {
        try {
          const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
          const auth     = await contract.isAuthorized(addr);
          setIsAuthorized(auth);
        } catch {
          setIsAuthorized(false);
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to connect wallet.');
    } finally {
      setConnecting(false);
    }
  }, []);

  // ── Register a product (write transaction) ────────────────────────────────

  const registerProduct = useCallback(async (productId) => {
    const contract = await getContract(true);
    const tx       = await contract.registerProduct(productId);
    const receipt  = await tx.wait();
    return receipt;
  }, [getContract]);

  // ── Verify a product (read-only) ──────────────────────────────────────────

  const verifyProduct = useCallback(async (productId) => {
    if (CONTRACT_ADDRESS === PLACEHOLDER_ADDRESS) {
      throw new Error(
        'Contract not deployed. See SETUP.md for deployment instructions.'
      );
    }

    // Use a read-only provider — no wallet needed for verification
    let provider;
    if (hasMetaMask()) {
      provider = new ethers.BrowserProvider(window.ethereum);
    } else {
      // Fallback to local RPC (Hardhat)
      provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');
    }

    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
    const [isOriginal, registeredBy, registeredAt] =
      await contract.verifyProduct(productId);

    return {
      isOriginal,
      registeredBy,
      registeredAt: isOriginal ? new Date(Number(registeredAt) * 1000) : null,
    };
  }, []);

  // ── Listen for account / chain changes ───────────────────────────────────

  useEffect(() => {
    if (!hasMetaMask()) return;

    const onAccountsChanged = (accounts) => {
      if (accounts.length === 0) {
        setAccount(null);
        setIsAuthorized(false);
      } else {
        setAccount(accounts[0]);
        // Re-check authorization
        connectWallet();
      }
    };

    const onChainChanged = () => {
      window.location.reload();
    };

    window.ethereum.on('accountsChanged', onAccountsChanged);
    window.ethereum.on('chainChanged', onChainChanged);

    return () => {
      window.ethereum.removeListener('accountsChanged', onAccountsChanged);
      window.ethereum.removeListener('chainChanged', onChainChanged);
    };
  }, [connectWallet]);

  return {
    account,
    isAuthorized,
    chainId,
    networkOk,
    connecting,
    error,
    hasMetaMask: hasMetaMask(),
    contractDeployed: CONTRACT_ADDRESS !== PLACEHOLDER_ADDRESS,
    connectWallet,
    registerProduct,
    verifyProduct,
  };
}
