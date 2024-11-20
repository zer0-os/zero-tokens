// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

/**
 * @title IZeroVotingERC721
 * @notice Interface for the ZeroVotingERC721 contract.
 */
interface IZeroVotingERC721 {

    /**
     * @notice Mints a new ERC721 token to a specified address.
     * @param to The address to receive the minted token.
     * @param tokenURI The URI associated with the minted token.
     */
    function mint(address to, string memory tokenURI) external;

    /**
     * @notice Burns a token.
     * @param tokenId The ID of the token to burn.
     */
    function burn(uint256 tokenId) external;

    /**
     * @notice Locks specific tokens for voting.
     * @param tokenIds The list of token IDs to lock for voting.
     */
    function lockTokensForVoting(uint256[] calldata tokenIds) external;

    /**
     * @notice Unlocks specific tokens after voting is completed.
     * @param tokenIds The list of token IDs to unlock.
     */
    function unlockTokens(uint256[] calldata tokenIds) external;

    /**
     * @notice Checks if a specific token is locked for voting.
     * @param tokenId The ID of the token to check.
     * @return True if the token is locked, false otherwise.
     */
    function isTokenLocked(uint256 tokenId) external view returns (bool);

    /**
     * @notice Get the current token count (tokenId counter).
     * @return The current token count.
     */
    function currentTokenCount() external view returns (uint256);

    /**
     * @notice Sets the address of the admin role.
     * @param admin The address of the new admin.
     */
    function setAdmin(address admin) external;

    /**
     * @notice Implements supportsInterface from ERC165.
     * @param interfaceId The interface identifier (EIP-165).
     * @return True if the contract implements the specified interface, otherwise false.
     */
    function supportsInterface(bytes4 interfaceId) external view returns (bool);
}
