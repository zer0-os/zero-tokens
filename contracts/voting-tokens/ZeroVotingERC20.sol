// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import { ERC20Permit } from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import { ERC20Votes } from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import { Nonces } from "@openzeppelin/contracts/utils/Nonces.sol";
import { IZeroVotingERC20 } from "./IZeroVotingERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
* Throw this error if someone submits a non-zero token burn address.
* @param to address to send the transaction.
*/
error InvalidBurnAddress(address to);


contract ZeroVotingERC20 is ERC20Votes, ERC20Permit, IZeroVotingERC20, Ownable {
    constructor(
        string memory name,
        string memory symbol,
        address initialOwner
    ) 
        ERC20(name, symbol) 
        ERC20Permit(name)
        Ownable(initialOwner) {}

    uint16 public constant PERCENTAGE_BASIS = 10000;

    function _update(
        address from, 
        address to, 
        uint256 value
    ) internal override (ERC20, ERC20Votes) {
        super._update(from, to, value);
    }

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

    function nonces(
        address owner
    ) public view override (ERC20Permit, Nonces, IZeroVotingERC20) returns (uint256) {
        return super.nonces(owner);
    }

    /**
     * @notice calculates fee for voting.
     * @return fee amount.
     * @param amount of voting tokens.
     * @param feePercentage percent of fee.
     */
    function getFee(
        uint256 amount,
        uint16 feePercentage
    ) public pure override (IZeroVotingERC20) returns (uint256) {
        return (amount * feePercentage) / PERCENTAGE_BASIS;
    }

    /**
     * @notice sends fee to our wallet.
     * @param to address of our wallet.
     * @param amount of voting tokens.
     * @param feePercentage percent of fee.
     */
    function transferFee(
        address to,
        uint256 amount,
        uint16 feePercentage
    ) external payable override (IZeroVotingERC20) {
        uint256 fee = getFee(amount, feePercentage);

        transfer(to, fee);
    }
}