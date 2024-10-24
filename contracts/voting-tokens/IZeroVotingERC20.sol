// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { IERC20Permit } from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Permit.sol";


interface IZeroVotingERC20 is IERC20, IERC20Permit {
    function PERCENTAGE_BASIS() external view returns (uint16);

    function nonces(address owner) external view returns (uint256);
    
    function burn(
        address from,
        address to,
        uint256 amount
    ) external;

    function getFee(
        uint256 amount,
        uint16 feePercentage
    ) external view returns (uint256);

    function transferFee(
        address to,
        uint256 amount,
        uint16 feePercentage
    ) external payable;
}
