import Web3 from "Web3";
// 初始化Web3连接
const web3 = new Web3('https://bsc-dataseed.binance.org/'); // 连接到Binance Smart Chain主网

// 设置账户和交易细节
const account = '你的钱包地址'; // 从这个地址发送交易
const privateKey = '你的私钥'; // 你的钱包私钥，小心保管，不要泄露

// 被钓鱼的交易哈希
const transactionHash = '0x8167ab96c09b633c38abd30558f79a9fb390bedb4af6af487646a46d41c31fba';

// 新交易的目标地址和金额（可以是原交易的相同目标和金额，也可以是不同的）
const toAddress = '目标地址';
const amount = web3.utils.toWei('金额', 'ether'); // 以ETH为单位的转账金额

// 获取当前的Gas价格，并增加以提高交易被接受的可能性
web3.eth.getTransaction(transactionHash)
    .then(transaction => {
        const nonce = transaction.nonce; // 获取原交易的Nonce
        const originalAmount = transaction.value; // 原始交易金额
        const senderAddress = transaction.from; // 发送者地址，也是接收地址

        // 获取当前的Gas价格，并且适当提高
        web3.eth.getGasPrice().then(async (currentGasPrice) => {
            const gasPrice = web3.utils.toBN(currentGasPrice).mul(web3.utils.toBN(2)); // 将Gas价格设置为当前价格的两倍
            const gasLimit = await web3.eth.estimateGas({ from: senderAddress, to: senderAddress, value: originalAmount });

            // 计算手续费
            const fee = gasPrice.mul(web3.utils.toBN(gasLimit));
            const amountToSend = web3.utils.toBN(originalAmount).sub(fee); // 减去预计手续费后的金额

            const rawTransaction = {
                'from': senderAddress,
                'to': senderAddress,
                'value': amountToSend.toString(),
                'gasPrice': gasPrice.toString(),
                'gas': gasLimit,
                'nonce': nonce
            };

            // 签署交易
            web3.eth.accounts.signTransaction(rawTransaction, privateKey)
                .then(signedTx => web3.eth.sendSignedTransaction(signedTx.rawTransaction))
                .then(receipt => console.log('Transaction receipt:', receipt))
                .catch(err => console.error('Error sending transaction:', err));
        });
    })
    .catch(err => console.error('Error retrieving transaction:', err));