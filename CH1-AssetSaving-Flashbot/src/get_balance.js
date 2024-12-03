import pkg from '@mycrypto/eth-scan'
import RPCs from './json/rpc.js'
import * as fs from 'fs';
import axios from "axios";

const { getTokenBalances, getEtherBalances } = pkg;

export async function get_assets_list(address, name, customlist = null) {
    let chainId;
    if (typeof param === 'string') {
        chainId = get_chainId_from_raw(name)
    }
    else {
        chainId = name
    }
    const endpoint = RPCs[chainId].rpcs
    console.log(endpoint)
    //fetch
    const provider = await findFirstWorkingEndpoint(endpoint);
    console.log(provider)
    //list
    let list;
    if (customlist == null) { list = get_list_from_raw(chainId); }
    else { list = customlist }
    const res = await get_all_assets_balance(provider, address, list);
    console.log(res)
    return res
}

async function testEndpoint(url) {
    const response = await axios.get(url);
    if (response.status === 200) {
        return url;
    }
    else {
        return null;
    }
}

async function findFirstWorkingEndpoint(endpoints) {
    for (const endpoint of endpoints) {
        const url = endpoint.url;
        const workingUrl = await testEndpoint(url);
        if (workingUrl) {
            return workingUrl;
        }
    }
    return null;
}

async function get_all_assets_balance(provider, address, list) {
    let res = []
    // const eth_res = await getEtherBalances(provider, [address]);
    // eth_res["name"] = "ETH"
    // res.push(eth_res)
    for (let i = 0; i < list.length; i++) {
        const temp_res = await getTokenBalances(provider, [address], list[i].address)
        if (temp_res[address] != 0n) {
            temp_res["symbol"] = list[i].symbol;
            temp_res["address"] = list[i].address;
            temp_res["name"] = list[i].name;
            temp_res["amount"] = temp_res[address]; res.push(temp_res)
        }
        // console.log(list[i].symbol)
        // console.log(temp_res)
        // else { console.log("not include") }
    }
    fs.writeFileSync("./src/json/TEMP_ASSETS_LIST.json", JSON.stringify(res, (key, value) =>
        typeof value === 'bigint'
            ? value.toString()
            : value))
    return res;
}

function get_list_from_raw(chainId) {
    const list_raw = JSON.parse(fs.readFileSync("./src/json/token_list.json", 'utf-8'))
    const res = [];
    for (let i = 0; i < list_raw.length; i++) {
        if (list_raw[i].chainId == chainId) { res.push(list_raw[i]) }
    }
    return res;
}

function get_chainId_from_raw(name) {
    const chain_raw = JSON.parse(fs.readFileSync("./src/json/chainid.json"))
    for (let i = 0; i < chain_raw.length; i++) {
        if (list_raw[i] == name) { return i }
    }
    return -1;
}

async function run() {
    await get_assets_list("0x26202f062912f183B0D7aeE8fBB76B67354aEAe1", 1) //"ethereum"
}

run()

const CUSTOMLIST = [
    {
        "chainId": 1,
        "address": "0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9",
        "name": "Aave",
        "symbol": "AAVE",
        "decimals": 18,
        "logoURI": "https://assets.coingecko.com/coins/images/12645/thumb/AAVE.png?1601374110",
    },
    {
        "chainId": 1,
        "address": "0xB98d4C97425d9908E66E53A6fDf673ACcA0BE986",
        "name": "Arcblock",
        "symbol": "ABT",
        "decimals": 18,
        "logoURI": "https://assets.coingecko.com/coins/images/2341/thumb/arcblock.png?1547036543"
    },
]