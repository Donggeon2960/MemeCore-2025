import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ethers, Contract, Wallet, JsonRpcProvider } from 'ethers';

@Injectable()
export class BlockchainService implements OnModuleInit {
  private readonly logger = new Logger(BlockchainService.name);
  private provider: JsonRpcProvider;
  private adminWallet: Wallet;
  private memeVaultContract: Contract;

  // Inline ABI (파일 없이 직접 정의)
  private readonly MEME_VAULT_ABI = [
    "function distributePrizes(address[] winners, uint256[] amounts) external",
    "function depositRewards(uint256 amount) external",
    "function owner() view returns (address)"
  ];

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    this.initializeBlockchain();
  }

  private initializeBlockchain() {
    try {
      const rpcUrl = this.configService.get<string>('RPC_URL');
      const privateKey = this.configService.get<string>('ADMIN_PRIVATE_KEY');
      const vaultAddress = this.configService.get<string>('MEME_VAULT_ADDRESS');

      if (!rpcUrl || !privateKey || !vaultAddress) return;

      this.provider = new ethers.JsonRpcProvider(rpcUrl);
      this.adminWallet = new ethers.Wallet(privateKey, this.provider);
      this.memeVaultContract = new ethers.Contract(vaultAddress, this.MEME_VAULT_ABI, this.adminWallet);

      this.logger.log(`✅ Blockchain Module Ready! Admin: ${this.adminWallet.address}`);
      this.logger.log(`🏦 Vault Contract: ${vaultAddress}`);
    } catch (error) {
      this.logger.error('❌ Blockchain Init Failed', error);
    }
  }

  async rewardUser(userAddress: string, amount: string): Promise<string> {
    try {
      this.logger.log(`💸 Sending ${amount} tokens to ${userAddress}...`);
      const amountWei = ethers.parseUnits(amount, 18);
      // 배열 형태로 전달
      const tx = await this.memeVaultContract.distributePrizes([userAddress], [amountWei]);
      this.logger.log(`⏳ Tx Sent: ${tx.hash}`);
      await tx.wait(1);
      return tx.hash;
    } catch (error) {
      this.logger.error(`❌ Reward failed`, error);
      throw new Error('Blockchain transaction failed');
    }
  }
}