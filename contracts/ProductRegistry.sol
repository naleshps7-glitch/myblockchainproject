// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ProductRegistry
 * @dev Blockchain-based product registration and verification smart contract.
 *      Only authorized manufacturers (admins) can register products.
 *      Anyone can verify whether a product is genuine.
 */
contract ProductRegistry {

    // ─── State Variables ────────────────────────────────────────────────────

    address public owner;

    struct Product {
        string  productId;       // e.g. "NK003"
        address registeredBy;    // wallet address of the registrar
        uint256 registeredAt;    // block timestamp
        bool    exists;          // guard flag
    }

    // productId (string) → Product
    mapping(string => Product) private products;

    // Authorised manufacturers / admins
    mapping(address => bool) public authorizedManufacturers;

    // ─── Events ─────────────────────────────────────────────────────────────

    event ProductRegistered(
        string  indexed productId,
        address indexed registeredBy,
        uint256         registeredAt
    );

    event ManufacturerAuthorized(address indexed manufacturer);
    event ManufacturerRevoked(address indexed manufacturer);

    // ─── Modifiers ───────────────────────────────────────────────────────────

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this");
        _;
    }

    modifier onlyAuthorized() {
        require(
            authorizedManufacturers[msg.sender] || msg.sender == owner,
            "Not authorized: only registered manufacturers can register products"
        );
        _;
    }

    // ─── Constructor ─────────────────────────────────────────────────────────

    constructor() {
        owner = msg.sender;
        // The deployer is automatically authorized
        authorizedManufacturers[msg.sender] = true;
        emit ManufacturerAuthorized(msg.sender);
    }

    // ─── Admin Functions ─────────────────────────────────────────────────────

    /**
     * @dev Grant manufacturer/admin rights to an address.
     */
    function authorizeManufacturer(address _manufacturer) external onlyOwner {
        authorizedManufacturers[_manufacturer] = true;
        emit ManufacturerAuthorized(_manufacturer);
    }

    /**
     * @dev Revoke manufacturer/admin rights.
     */
    function revokeManufacturer(address _manufacturer) external onlyOwner {
        authorizedManufacturers[_manufacturer] = false;
        emit ManufacturerRevoked(_manufacturer);
    }

    // ─── Core Functions ──────────────────────────────────────────────────────

    /**
     * @dev Register a new product on the blockchain.
     *      Reverts if the product already exists or the caller is not authorized.
     * @param _productId Unique product identifier (e.g. "NK003")
     */
    function registerProduct(string calldata _productId) external onlyAuthorized {
        require(bytes(_productId).length > 0, "Product ID cannot be empty");
        require(!products[_productId].exists, "Product ID already registered");

        products[_productId] = Product({
            productId:    _productId,
            registeredBy: msg.sender,
            registeredAt: block.timestamp,
            exists:       true
        });

        emit ProductRegistered(_productId, msg.sender, block.timestamp);
    }

    /**
     * @dev Verify whether a product ID is registered on the blockchain.
     * @param _productId Product ID to look up
     * @return isOriginal  true if the product exists in the registry
     * @return registeredBy  wallet address that registered the product
     * @return registeredAt  Unix timestamp of registration
     */
    function verifyProduct(string calldata _productId)
        external
        view
        returns (
            bool    isOriginal,
            address registeredBy,
            uint256 registeredAt
        )
    {
        Product storage p = products[_productId];
        if (p.exists) {
            return (true, p.registeredBy, p.registeredAt);
        }
        return (false, address(0), 0);
    }

    /**
     * @dev Check if the caller is an authorized manufacturer.
     */
    function isAuthorized(address _addr) external view returns (bool) {
        return authorizedManufacturers[_addr] || _addr == owner;
    }
}
