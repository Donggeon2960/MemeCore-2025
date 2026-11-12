import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Contract, JsonRpcProvider, Wallet, parseUnits } from 'ethers';

/** 트랜잭션은 전송됐지만 확정 확인에 실패 → 환불하면 안 됨 (이중 지급 위험) */
export class TxUnconfirmedError extends Error {
  constructor(public readonly txHash: string) {
    super(`Tx ${txHash} sent but not confirmed`);
  }
}

@Injectable()
export class BlockchainService implements OnModuleInit {
  private readonly logger = new Logger(BlockchainService.name);
  private memeVaultContract?: Contract;

  private readonly MEME_VAULT_ABI = [
    'function distributePrizes(address[] winners, uint256[] amounts) external',
    'function depositRewards(uint256 amount) external',
    'function owner() view returns (address)',
  ];

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    const rpcUrl = this.configService.get<string>('RPC_URL');
    const privateKey = this.configService.get<string>('ADMIN_PRIVATE_KEY');
    const vaultAddress = this.configService.get<string>('MEME_VAULT_ADDRESS');
    if (!rpcUrl || !privateKey || !vaultAddress) {
      this.logger.warn(
        '⚠️ 블록체인 환경변수가 없어 환전 기능이 비활성화됩니다.',
      );
      return;
    }
    try {
      const adminWallet = new Wallet(privateKey, new JsonRpcProvider(rpcUrl));
      this.memeVaultContract = new Contract(
        vaultAddress,
        this.MEME_VAULT_ABI,
        adminWallet,
      );
      this.logger.log(
        `✅ Blockchain Module Ready! Admin: ${adminWallet.address}, Vault: ${vaultAddress}`,
      );
    } catch (error) {
      this.logger.error('❌ Blockchain Init Failed', error);
    }
  }

  async rewardUser(userAddress: string, amount: string): Promise<string> {
    if (!this.memeVaultContract) throw new Error('Blockchain not configured');
    this.logger.log(`💸 Sending ${amount} tokens to ${userAddress}...`);
    const tx = await this.memeVaultContract
      .getFunction('distributePrizes')
      .send([userAddress], [parseUnits(amount, 18)]);
    this.logger.log(`⏳ Tx Sent: ${tx.hash}`);
    try {
      await tx.wait(1);
    } catch (error) {
      this.logger.error(`❌ Tx ${tx.hash} not confirmed`, error);
      throw new TxUnconfirmedError(tx.hash);
    }
    return tx.hash;
  }
}
