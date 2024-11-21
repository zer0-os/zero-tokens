// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import "@openzeppelin/contracts/utils/Nonces.sol";
import "./IZeroVotingERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";


contract ZeroVotingERC20 is ERC20Votes, ERC20Permit, IZeroVotingERC20, Ownable, AccessControl {

    address public governance;
    // Declare role constants
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    /**
    * @notice Tracks the number of tokens locked for voting by each account.
    * @dev The mapping associates an account address with the amount of tokens locked for voting.
    *      These tokens are excluded from the account's available balance until unlocked.
    */
    mapping(address => uint256) private lockedTokens;

    /**
    * Throw this error if someone submits a non-zero token burn address.
    * @param to address to send the transaction.
    */
    error InvalidBurnAddress(address to);

    /**
    * @notice Ensures that the function is called only by the Governance contract.
    * @dev Reverts if the caller is not the Governance contract.
    */
    modifier onlyGovernance() {
        require(msg.sender == governance, "Caller is not Governance");
        _;
    }

    constructor(
        string memory name,
        string memory symbol,
        address initialOwner
    ) 
        ERC20(name, symbol) 
        ERC20Permit(name)
        Ownable(initialOwner) {
            // Grant admin role to deployer
            // TODO: I'm not sure, we can do this. What would be better?
            _grantRole(DEFAULT_ADMIN_ROLE, initialOwner);
        }

    /**
     * @notice Mints new tokens to a specified address.
     * @dev Requires the caller to have the `MINTER_ROLE`.
     * @param to The address receiving the minted tokens.
     * @param amount The amount of tokens to mint.
     */
    function mint(address to, uint256 amount) external onlyRole(MINTER_ROLE) {
        _mint(to, amount);
    }

    /**
    * @dev See {ERC20-update}.
    * @dev This function overrides `_update` from both ERC20 and ERC20Votes.
    * @param from The address transferring tokens.
    * @param to The address receiving tokens.
    * @param value The amount of tokens being transferred.
    */
    function _update(
        address from, 
        address to, 
        uint256 value
    ) internal override (ERC20, ERC20Votes) {
        super._update(from, to, value);
    }

    /**
    * @notice Burns a specific amount of tokens from the given address.
    * @dev Ensures that the `to` address is zero; otherwise, it reverts.
    * @param from The address from which tokens are burned.
    * @param to The address where tokens are sent (must be the zero address).
    * @param amount The amount of tokens to burn.
    */
    function burn(
        address from,
        address to,
        uint256 amount
    ) public override (IZeroVotingERC20) {
        if (to == address(0)) {
            _update(from, to, amount);
        } else {
            revert InvalidBurnAddress(to);
        }
    }

    /**
    * @notice Retrieves the current nonce for the given address.
    * @dev This function combines logic from ERC20Permit, Nonces, and IZeroVotingERC20.
    * @param owner The address for which the nonce is retrieved.
    * @return The current nonce of the specified address.
    */
    function nonces(
        address owner
    ) public view override (ERC20Permit, Nonces, IZeroVotingERC20) returns (uint256) {
        return super.nonces(owner);
    }

    /**
     * @notice Locks definite amount of tokens for voting.
     * @param account The address of the account.
     * @param amount The amount of tokens to lock.
     */
    function lockTokens(address account, uint256 amount) external onlyGovernance {
        require(balanceOf(account) >= amount, "Insufficient balance");
        lockedTokens[account] += amount;
    }

    /**
     * @notice Unlocks tokens after voting.
     * @param account The address of the account.
     * @param amount The amount of tokens to unlock.
     */
    function unlockTokens(address account, uint256 amount) external onlyGovernance {
        require(lockedTokens[account] >= amount, "Not enough locked tokens");
        lockedTokens[account] -= amount;
    }

    /**
     * @notice Overrides the balanceOf function to account for locked tokens.
     */
    function balanceOf(address account) public view override (ERC20, IZeroVotingERC20) returns (uint256) {
        return super.balanceOf(account) - lockedTokens[account];
    }

    /**
    * @notice Sets the address of the Governance contract.
    * @dev This function can only be called by the contract owner.
    *      The governance address must not be the zero address.
    * @param _governance The address of the Governance contract to set.
    */
    function setGovernance(address _governance) external onlyOwner {
        require(_governance != address(0), "Invalid governance address");
        governance = _governance;
    }
}