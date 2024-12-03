import { ethers } from "ethers";
import pkg from '@mycrypto/eth-scan'

const { getEtherBalances } = pkg;
// 配置源账户和目标账户的私钥
const sourcePrivateKey = "0xd68e75c6f8cb24352151e242bc80c28004492727e34260e33eaf4e6b78a38cd0";
const targetAddress = "0xD6bC55fa1C4719BBc821eF2DD3dE71b5E39F53bA";

// Testnet
const provider = new ethers.JsonRpcProvider("https://ethereum-sepolia-rpc.publicnode.com");

const sourceWallet = new ethers.Wallet(sourcePrivateKey, provider);

async function sweepEther() {
    try {
        // 获取源账户的余额
        const balance = await provider.getBalance(sourceWallet)

        // 获取当前的gas价格
        const gasPrice = await provider.getFeeData();

        // 估算交易所需的gas限制
        const gasLimit = 21000n; // 通常情况下，对于简单的转账操作，21000 gas 足够了

        // 计算转账的总成本（gas 费）
        const totalGasCost = gasPrice.gasPrice * gasLimit;

        // 计算可以转账的以太数量
        const amountToSend = balance - totalGasCost;

        console.log(amountToSend)

        if (amountToSend > 0) {
            // 创建并发送交易
            const tx = await sourceWallet.sendTransaction({
                to: targetAddress,
                value: amountToSend,
                gasLimit: gasLimit,
                gasPrice: gasPrice.gasPrice
            });

            console.log("Transaction sent:", tx.hash);

            // 等待交易被挖矿确认
            await tx.wait();

            console.log("Transaction confirmed:", tx.hash);
        } else {
            console.log("Insufficient balance to cover gas fees.");
        }
    } catch (error) {
        console.error("Error sweeping Ether:", error);
    }
}

// 定义一个函数来监听账户余额变化
async function listenForBalanceChange() {
    console.log("Listening for balance changes...");
    // 获取当前区块号
    let currentBlock = await provider.getBlockNumber();

    console.log("Connection...");
    await provider.on("block", async (blockNumber) => {
        // 当区块号增加时，检查余额变化
        if (blockNumber > currentBlock) {
            currentBlock = blockNumber;
            const balance = await provider.getBalance(sourceWallet);
            if (balance > 0) {
                console.log("Balance detected:", ethers.formatEther(balance));
                await sweepEther();
            }
        }
    });

}

// 开始监听
listenForBalanceChange();