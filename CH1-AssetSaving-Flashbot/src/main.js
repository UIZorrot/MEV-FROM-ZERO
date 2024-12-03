import { ethers, Wallet } from "ethers";
import {
    FlashbotsBundleProvider,
    FlashbotsBundleResolution,
} from "@flashbots/ethers-provider-bundle";
import { exit } from "process";
import * as fs from 'fs';

const FLASHBOTS_URL_MAIN = "https://rpc.flashbots.net/fast";
const FLASHBOTS_URL = "https://relay-sepolia.flashbots.net";
const TOKEN_ADDRESS = "0x2AB045a5A421b46A805Cd4d41A9804AA541CA7C2";
const SPONSOR_KEY = "0x58d7f03806b02bbf6a062de1739913b07777a17d90436777881d4b94619e74b1"
const VICTIM_KEY = "0xd68e75c6f8cb24352151e242bc80c28004492727e34260e33eaf4e6b78a38cd0"
const PATH_KEY = "0xf2b6929ca4ae7c8a055b164c815cbd2925459e8966687fe12b242bdff42fa90e"
const SAVE_ADDRESS = "0x26202f062912f183B0D7aeE8fBB76B67354aEAe1"

const ETHER_AMOUNT = "0.01"
const ERC20_AMOUNT = 1000000n
const PRIORITY_FEE = ethers.parseUnits("31", "gwei")
const LEGACY_GAS_PRICE = ethers.parseUnits("31", "gwei")
const BLOCKS_IN_THE_FUTURE = 2

async function main() {
    const provider = new ethers.JsonRpcProvider(
        "https://eth.llamarpc.com"
    );

    const authSigner = new Wallet(PATH_KEY).connect(provider);

    console.log("mainnet good")

    const flashbotsProvider = await FlashbotsBundleProvider.create(
        provider,
        authSigner,
        FLASHBOTS_URL
    );

    console.log("flashbot good")

    const sponsor = new Wallet(SPONSOR_KEY).connect(provider);
    const victim = new Wallet(VICTIM_KEY).connect(provider);

    console.log("ready to send from" + victim + "to" + sponsor)

    provider.on("block", async (blockNumber) => {
        console.log(blockNumber);
        const targetBlockNumber = blockNumber + 1;

        const block = await provider.getBlock(blockNumber)

        let trans;

        const maxBaseFeeInFutureBlock = FlashbotsBundleProvider.getMaxBaseFeeInFutureBlock(block.baseFeePerGas, BLOCKS_IN_THE_FUTURE)
        trans = [
            {
                signer: sponsor,
                transaction: {
                    chainId: 11155111,
                    type: 2,
                    to: victim.address,
                    value: ethers.parseEther(ETHER_AMOUNT),
                    maxFeePerGas: PRIORITY_FEE + maxBaseFeeInFutureBlock,
                    maxPriorityFeePerGas: PRIORITY_FEE,
                },
            },
            {
                signer: victim,
                transaction: {
                    chainId: 11155111,
                    type: 2,
                    to: TOKEN_ADDRESS,
                    data: iface.encodeFunctionData("transfer", [
                        SAVE_ADDRESS,
                        ERC20_AMOUNT,
                    ]),
                    maxFeePerGas: PRIORITY_FEE + maxBaseFeeInFutureBlock,
                    maxPriorityFeePerGas: PRIORITY_FEE,
                },
            },
        ]

        console.log(trans)

        //test

        const signedTransactions =
            await flashbotsProvider.signBundle(trans);
        const simulation = await flashbotsProvider.simulate(
            signedTransactions,
            targetBlockNumber
        );
        console.log(simulation);

        const resp = await flashbotsProvider.sendRawBundle(
            signedTransactions,
            targetBlockNumber
        );

        if ("error" in resp) {
            console.log(resp.error.message);
            return;
        }

        const resolution = await resp.wait();
        if (resolution === FlashbotsBundleResolution.BundleIncluded) {
            console.log(`Congrats, included in ${targetBlockNumber}`);
            exit(0);
        } else if (
            resolution === FlashbotsBundleResolution.BlockPassedWithoutInclusion
        ) {
            console.log(`Not included in ${targetBlockNumber}`);
        } else if (resolution === FlashbotsBundleResolution.AccountNonceTooHigh) {
            console.log("Nonce too high, bailing");
            exit(1);
        }
    });
};


async function test() {
    const provider = new ethers.getDefaultProvider("sepolia")

    const authSigner = new ethers.Wallet(
        "0x2000000000000000000000000000000000000000000000000000000000000000"
    );

    console.log("testnet good")

    const flashbotsProvider = await FlashbotsBundleProvider.create(
        provider,
        authSigner,
        FLASHBOTS_URL,
        "sepolia"
    );

    console.log("flashbot good")

    const sponsor = new Wallet(SPONSOR_KEY, provider);
    const victim = new Wallet(VICTIM_KEY, provider);

    const abi = ["function transfer(address,uint256) external"];
    const iface = new ethers.Interface(abi);

    console.log("ready to send from" + victim + "to" + sponsor)

    provider.on("block", async (blockNumber) => {
        console.log(blockNumber);
        const targetBlockNumber = blockNumber + 1;
        const block = await provider.getBlock(blockNumber)

        let trans;

        const maxBaseFeeInFutureBlock = FlashbotsBundleProvider.getMaxBaseFeeInFutureBlock(block.baseFeePerGas, BLOCKS_IN_THE_FUTURE)

        const resp = await flashbotsProvider.sendBundle(
            [{
                signer: sponsor,
                transaction: {
                    chainId: 11155111,
                    type: 2,
                    to: victim.address,
                    value: ethers.parseEther("0.1"),
                    gasLimit: 51000,
                    maxFeePerGas: PRIORITY_FEE + maxBaseFeeInFutureBlock,
                    maxPriorityFeePerGas: PRIORITY_FEE,
                }
            },
            {
                signer: victim,
                transaction: {
                    chainId: 11155111,
                    type: 2,
                    to: sponsor.address,
                    value: ethers.parseEther("0.09"),
                    gasLimit: 51000,
                    maxFeePerGas: PRIORITY_FEE + maxBaseFeeInFutureBlock,
                    maxPriorityFeePerGas: PRIORITY_FEE,
                }
            }],
            targetBlockNumber
        )

        if ("error" in resp) {
            console.log(resp.error.message);
            return;
        }

        const resolution = await resp.wait();
        if (resolution === FlashbotsBundleResolution.BundleIncluded) {
            console.log(`Congrats, included in ${targetBlockNumber}`);
            exit(0);
        } else if (
            resolution === FlashbotsBundleResolution.BlockPassedWithoutInclusion
        ) {
            console.log(`Not included in ${targetBlockNumber}`);
        } else if (resolution === FlashbotsBundleResolution.AccountNonceTooHigh) {
            console.log("Nonce too high, bailing");
            exit(1);
        }
    });
};

function build_trans(maxBaseFeeInFutureBlock, sponsor, victim, ethamount) {
    const all_assets = JSON.parse(fs.readFileSync("./src/json/TEMP_ASSETS_LIST.json", 'utf-8'))
    const abi = ["function transfer(address,uint256) external"];
    const iface = new ethers.Interface(abi);

    let trans = [
        {
            signer: sponsor,
            transaction: {
                chainId: 11155111,
                type: 2,
                to: victim.address,
                value: ethers.parseEther(ethamount),
                maxFeePerGas: PRIORITY_FEE + maxBaseFeeInFutureBlock,
                maxPriorityFeePerGas: PRIORITY_FEE,
            },
        }
    ]

    for (const asset of all_assets) {
        trans.push(
            {
                signer: victim,
                transaction: {
                    chainId: 11155111,
                    type: 2,
                    to: asset.address,
                    data: iface.encodeFunctionData("transfer", [
                        sponsor.address,
                        asset.amount - 1,
                    ]),
                    maxFeePerGas: PRIORITY_FEE + maxBaseFeeInFutureBlock,
                    maxPriorityFeePerGas: PRIORITY_FEE,
                },
            })
    }

    return trans
}

test();