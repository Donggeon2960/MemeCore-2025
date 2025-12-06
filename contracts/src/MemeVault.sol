// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MemeVault is Ownable {
    using SafeERC20 for IERC20;
    IERC20 public immutable REWARD_TOKEN;

    constructor(address _rewardToken) Ownable(msg.sender) {
        REWARD_TOKEN = IERC20(_rewardToken);
    }

    // 보상 재원 예치
    function depositRewards(uint256 amount) external {
        REWARD_TOKEN.safeTransferFrom(msg.sender, address(this), amount);
    }

    // 보상 지급 (서버 전용)
    function distributePrizes(address[] calldata winners, uint256[] calldata amounts) external onlyOwner {
        require(winners.length == amounts.length, "Length mismatch");
        for (uint256 i = 0; i < winners.length; i++) {
            REWARD_TOKEN.safeTransfer(winners[i], amounts[i]);
        }
    }
}