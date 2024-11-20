// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

interface IZeroVotingERC20 {
    /**
     * @notice Mints new tokens to a specified address.
     * @param to The address receiving the minted tokens.
     * @param amount The amount of tokens to mint.
     */
    function mint(address to, uint256 amount) external;

    /**
     * @notice Burns a specific amount of tokens from the given address.
     * @param from The address from which tokens are burned.
     * @param to The address where tokens are sent (must be the zero address).
     * @param amount The amount of tokens to burn.
     */
    function burn(address from, address to, uint256 amount) external;

    /**
     * @notice Retrieves the current nonce for the given address.
     * @param owner The address for which the nonce is retrieved.
     * @return The current nonce of the specified address.
     */
    function nonces(address owner) external view returns (uint256);

    /**
     * @notice Locks a specific amount of tokens for voting.
     * @param account The address of the account.
     * @param amount The amount of tokens to lock.
     */
    function lockTokens(address account, uint256 amount) external;

    /**
     * @notice Unlocks tokens after voting.
     * @param account The address of the account.
     * @param amount The amount of tokens to unlock.
     */
    function unlockTokens(address account, uint256 amount) external;

    /**
     * @notice Sets the address of the Governance contract.
     * @param _governance The address of the Governance contract to set.
     */
    function setGovernance(address _governance) external;

    /**
     * @notice Returns the current balance of an account, excluding locked tokens.
     * @param account The address of the account.
     * @return The balance of the account excluding locked tokens.
     */
    function balanceOf(address account) external view returns (uint256);

    /**
     * @notice Returns the amount of tokens locked for voting by an account.
     * @param account The address of the account.
     * @return The amount of locked tokens.
     */
    function lockedTokens(address account) external view returns (uint256);
}
