// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {MyToken} from "../src/MyToken.sol";
import {MemeVault} from "../src/MemeVault.sol";

/// 배포: forge script script/Deploy.s.sol --rpc-url $RPC_URL --private-key $ADMIN_PRIVATE_KEY --broadcast
/// 배포한 지갑(= 백엔드 ADMIN_PRIVATE_KEY)이 MemeVault owner 가 된다.
contract DeployScript is Script {
    function run() external {
        uint256 maxPayout = vm.envOr("MAX_PAYOUT", uint256(100_000 ether));
        uint256 initialFunding = vm.envOr("INITIAL_FUNDING", uint256(500_000 ether));

        vm.startBroadcast();
        MyToken token = new MyToken("MemeQuest", "MQ");
        MemeVault vault = new MemeVault(address(token), maxPayout);
        token.approve(address(vault), initialFunding);
        vault.depositRewards(initialFunding);
        vm.stopBroadcast();

        console.log("MY_TOKEN_ADDRESS=", address(token));
        console.log("MEME_VAULT_ADDRESS=", address(vault));
    }
}
