import { ethers } from "ethers";
import * as fs from 'fs';



async function claimAirdrop(privateKey, provider, caddr) {
    try {

        const wallet = new ethers.Wallet(privateKey, provider);

        const airdropContractAddress = caddr;

        const airdropContractABI = JSON.parse(fs.readFileSync("./src/json/abi.json"));

        const airdropContract = new ethers.Contract(airdropContractAddress, airdropContractABI, wallet);

        const tx = await airdropContract.claim();

        console.log("sending:", tx.hash);

        const receipt = await tx.wait();

        console.log("airdrop claimed success:", receipt);
    } catch (error) {
        console.error("airdrop  claimed failed:", error);
    }
}

// 执行领取空投函数
claimAirdrop();