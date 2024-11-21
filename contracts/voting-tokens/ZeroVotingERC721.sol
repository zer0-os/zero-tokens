// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import { ERC721 } from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import { ERC721Burnable } from "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import { AccessControl } from "@openzeppelin/contracts/access/AccessControl.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @notice Custom ERC721 contract with AccessControl for role management and minting.
 * @dev The contract allows minting and burning of ERC721 tokens.
 *      Roles are managed using AccessControl.
 */
contract ZeroVotingERC721 is ERC721, ERC721Burnable, AccessControl, Ownable {

    // Declare role constants
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant ADMIN_ROLE = DEFAULT_ADMIN_ROLE; // Default admin role

    // Counter for token IDs
    uint256 private _tokenIdCounter;

    // Mapping to track locked tokens for voting
    mapping(uint256 => bool) private _lockedTokens;

    // Modifier to restrict access to only the Governance address
    modifier onlyGovernance() {
        require(hasRole(ADMIN_ROLE, msg.sender), "Caller is not Governance");
        _;
    }

    // Constructor
    constructor(
        string memory name,
        string memory symbol,
        address initialOwner
    ) ERC721(name, symbol) Ownable(initialOwner) {
        // Grant initialOwner role to the specified admin
        _grantRole(ADMIN_ROLE, initialOwner);
        // Grant minter role to the owner (or other roles as needed)
        _grantRole(MINTER_ROLE, initialOwner);
    }

    /**
     * @notice Mints a new ERC721 token to a specified address.
     * @dev Can only be called by the account with the MINTER_ROLE.
     * @param to The address to receive the minted token.
     * @param tokenURI The URI associated with the minted token.
     */
    function mint(address to, string memory tokenURI) external onlyRole(MINTER_ROLE) {
        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;

        _safeMint(to, tokenId);
        _setTokenURI(tokenId, tokenURI);
    }

    /**
     * @notice Sets the URI for a specific token.
     * @dev This function is used to set or update the metadata URI for a token.
     * @param tokenId The token ID whose URI is being set.
     * @param tokenURI The URI associated with the token.
     */
    function _setTokenURI(uint256 tokenId, string memory tokenURI) internal virtual {
        // Here we assume an ERC721URIStorage extension is available.
        // You can use ERC721URIStorage's internal _setTokenURI function to store the URI.
        _setTokenURI(tokenId, tokenURI);
    }

    /**
     * @notice Sets the address of the admin role.
     * @dev Can only be called by the contract owner.
     * @param admin The address of the new admin.
     */
    function setAdmin(address admin) external onlyOwner {
        require(admin != address(0), "Invalid admin address");
        _grantRole(ADMIN_ROLE, admin);
    }

    /**
     * @notice Burns a token.
     * @dev This function allows an account to burn their own token or an authorized account to burn on behalf of the owner.
     * @param tokenId The ID of the token to burn.
     */
    function burn(uint256 tokenId) public override(ERC721Burnable) {
        super.burn(tokenId);
    }

    /**
     * @notice Get the current token count (tokenId counter).
     * @dev This returns the current value of the tokenId counter, which is incremented after each mint.
     * @return The current token count.
     */
    function currentTokenCount() public view returns (uint256) {
        return _tokenIdCounter;
    }

     /**
     * @notice Locks specific tokens for voting.
     * @dev Only token owner can lock their tokens for voting.
     * @param tokenIds The list of token IDs to lock for voting.
     */
    function lockTokensForVoting(uint256[] calldata tokenIds) external {
        for (uint256 i = 0; i < tokenIds.length; i++) {
            uint256 tokenId = tokenIds[i];
            require(ownerOf(tokenId) == msg.sender, "Not the owner of the token");
            require(!_lockedTokens[tokenId], "Token already locked");

            _lockedTokens[tokenId] = true;
        }
    }

    /**
     * @notice Unlocks specific tokens after voting is completed.
     * @dev Only the original owner can unlock their tokens.
     * @param tokenIds The list of token IDs to unlock.
     */
    function unlockTokens(uint256[] calldata tokenIds) external {
        for (uint256 i = 0; i < tokenIds.length; i++) {
            uint256 tokenId = tokenIds[i];
            require(ownerOf(tokenId) == msg.sender, "Not the owner of the token");
            require(_lockedTokens[tokenId], "Token is not locked");

            _lockedTokens[tokenId] = false;
        }
    }

    /**
     * @notice Checks if a specific token is locked for voting.
     * @param tokenId The ID of the token to check.
     * @return True if the token is locked, false otherwise.
     */
    function isTokenLocked(uint256 tokenId) external view returns (bool) {
        return _lockedTokens[tokenId];
    }

    /**
    * @notice Implements _beforeTokenTransfer to prevent the transfer of locked tokens.
    * @dev This function is called before any token transfer and checks if the token is locked for voting.
    *      If the token is locked, the transfer will be reverted.
    * @param tokenId The ID of the token being transferred.
    */
    function _beforeTokenTransfer(
        uint256 tokenId
    ) internal view {
        require(!_lockedTokens[tokenId], "Token is locked for voting");
    }

    /**
    * @notice Implements transferFrom to prevent the transfer of locked tokens.
    * @dev This function allows transferring tokens but ensures the token is not locked for voting.
    *      If the token is locked, the transfer will be reverted.
    * @param from The address of the current owner of the token.
    * @param to The address to which the token is being transferred.
    * @param tokenId The ID of the token being transferred.
    */
    function transferFrom(
        address from,
        address to,
        uint256 tokenId
    ) public override {
        _beforeTokenTransfer(tokenId);
        super.transferFrom(from, to, tokenId);
    }

    /**
    * @notice Implements safeTransferFrom to prevent the transfer of locked tokens.
    * @dev This function allows safely transferring tokens with data, but ensures the token is not locked for voting.
    *      If the token is locked, the transfer will be reverted.
    * @param from The address of the current owner of the token.
    * @param to The address to which the token is being transferred.
    * @param tokenId The ID of the token being transferred.
    * @param data Additional data sent along with the transfer.
    */
    function safeTransferFrom(
        address from,
        address to,
        uint256 tokenId,
        bytes memory data
    ) public override {
        _beforeTokenTransfer(tokenId);
        super.safeTransferFrom(from, to, tokenId, data);
    }

    /**
     * @notice Implements supportsInterface from ERC165.
     * @dev This function is required to avoid conflicts when inheriting from multiple contracts that implement `supportsInterface`.
     * @param interfaceId The interface identifier (EIP-165).
     * @return True if the contract implements the specified interface, otherwise false.
     */
    function supportsInterface(bytes4 interfaceId) public view override(ERC721, AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
