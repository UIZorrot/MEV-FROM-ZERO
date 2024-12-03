import axios from "axios";
import * as fs from 'fs';

const url_list = "https://tokens.uniswap.org/"
const url_id = "https://github.com/DefiLlama/chainlist/blob/main/constants/chainIds.json"
const url_rpc = "https://github.com/DefiLlama/chainlist/blob/main/constants/extraRpcs.js"

async function get_uni_list() {
    await axios.get(url_list).then(
        async res => {
            fs.writeFileSync('./json/token_list.json', JSON.stringify(res.data.tokens))
        }
    )
}

export function get_token_list_by_condition(chainid, symbols) {
    const json = JSON.parse(fs.readFileSync('./src/json/token_list.json', 'utf-8'))
    const res = []
    for (const token of json) {
        if (token.chainId == chainid && is_token_include(token.symbol, symbols)) {
            res.push(token)
        }
    }
    console.log(res)
    return res
}

function is_token_include(flag, symbols) {
    for (const symbol of symbols) {
        if (flag == symbol) {
            return true
        }
    }
    return false
}

get_token_list_by_condition(1, ["UNI", "AAVE"])