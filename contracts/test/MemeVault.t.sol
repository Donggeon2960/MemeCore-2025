// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {MyToken} from "../src/MyToken.sol";
import {MemeVault} from "../src/MemeVault.sol";

contract MemeVaultTest is Test {
    MyToken token;
    MemeVault vault;
    address alice = makeAddr("alice");
    address bob = makeAddr("bob");

    function setUp() public {
        token = new MyToken("MemeQuest", "MQ");
        vault = new MemeVault(address(token), 1000 ether);
        token.approve(address(vault), 10_000 ether);
        vault.depositRewards(10_000 ether);
    }

    function _one(address a, uint256 amt) internal pure returns (address[] memory w, uint256[] memory m) {
        w = new address[](1);
        m = new uint256[](1);
        w[0] = a;
        m[0] = amt;
    }

    function test_DistributePrizes() public {
        address[] memory w = new address[](2);
        uint256[] memory m = new uint256[](2);
        (w[0], w[1], m[0], m[1]) = (alice, bob, 100 ether, 50 ether);
        vault.distributePrizes(w, m);
        assertEq(token.balanceOf(alice), 100 ether);
        assertEq(token.balanceOf(bob), 50 ether);
        assertEq(token.balanceOf(address(vault)), 9_850 ether);
    }

    function test_RevertWhen_NotOwner() public {
        (address[] memory w, uint256[] memory m) = _one(alice, 1 ether);
        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, alice));
        vault.distributePrizes(w, m);
    }

    function test_RevertWhen_ExceedsMaxPayout() public {
        (address[] memory w, uint256[] memory m) = _one(alice, 1001 ether);
        vm.expectRevert("Exceeds max payout");
        vault.distributePrizes(w, m);
    }

    function test_RevertWhen_LengthMismatch() public {
        address[] memory w = new address[](2);
        uint256[] memory m = new uint256[](1);
        vm.expectRevert("Length mismatch");
        vault.distributePrizes(w, m);
    }

    function test_PauseBlocksPayoutAndAllowsEmergencyWithdraw() public {
        (address[] memory w, uint256[] memory m) = _one(alice, 1 ether);
        vm.expectRevert(Pausable.ExpectedPause.selector);
        vault.emergencyWithdraw(bob); // 일시정지 전엔 회수 불가

        vault.pause();
        vm.expectRevert(Pausable.EnforcedPause.selector);
        vault.distributePrizes(w, m);

        vault.emergencyWithdraw(bob);
        assertEq(token.balanceOf(bob), 10_000 ether);
        assertEq(token.balanceOf(address(vault)), 0);
    }

    function testFuzz_PayoutWithinCap(uint256 amt) public {
        amt = bound(amt, 0, 1000 ether);
        (address[] memory w, uint256[] memory m) = _one(alice, amt);
        vault.distributePrizes(w, m);
        assertEq(token.balanceOf(alice), amt);
    }
}
