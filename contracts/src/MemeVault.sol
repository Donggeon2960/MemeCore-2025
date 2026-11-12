// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

contract MemeVault is Ownable, Pausable {
    using SafeERC20 for IERC20;

    IERC20 public immutable REWARD_TOKEN;
    // 1회 지급 상한: 서버 키가 유출돼도 한 번에 금고 전체가 털리지 않도록
    uint256 public maxPayout;

    event RewardsDeposited(address indexed from, uint256 amount);
    event PrizeDistributed(address indexed to, uint256 amount);
    event MaxPayoutChanged(uint256 maxPayout);
    event EmergencyWithdraw(address indexed to, uint256 amount);

    constructor(address _rewardToken, uint256 _maxPayout) Ownable(msg.sender) {
        REWARD_TOKEN = IERC20(_rewardToken);
        maxPayout = _maxPayout;
    }

    // 보상 재원 예치
    function depositRewards(uint256 amount) external {
        REWARD_TOKEN.safeTransferFrom(msg.sender, address(this), amount);
        emit RewardsDeposited(msg.sender, amount);
    }

    // 보상 지급 (서버 전용)
    function distributePrizes(address[] calldata winners, uint256[] calldata amounts) external onlyOwner whenNotPaused {
        require(winners.length == amounts.length, "Length mismatch");
        for (uint256 i = 0; i < winners.length; i++) {
            require(winners[i] != address(0), "Zero address");
            require(amounts[i] <= maxPayout, "Exceeds max payout");
            REWARD_TOKEN.safeTransfer(winners[i], amounts[i]);
            emit PrizeDistributed(winners[i], amounts[i]);
        }
    }

    function setMaxPayout(uint256 _maxPayout) external onlyOwner {
        maxPayout = _maxPayout;
        emit MaxPayoutChanged(_maxPayout);
    }

    // 서버 키 유출 등 사고 시 지급 중단
    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    // 금고 잔액 회수 (일시정지 상태에서만)
    function emergencyWithdraw(address to) external onlyOwner whenPaused {
        uint256 amount = REWARD_TOKEN.balanceOf(address(this));
        REWARD_TOKEN.safeTransfer(to, amount);
        emit EmergencyWithdraw(to, amount);
    }
}
