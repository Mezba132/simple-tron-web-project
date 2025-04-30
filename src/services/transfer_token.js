const tronWeb = require("../config/tronweb");
require("dotenv").config();

async function transferTRC20(fromAddress, toAddress, amount) {
  try {
    const amountInSun = (
      BigInt(Number(amount)) *
      BigInt(10) ** BigInt(18)
    ).toString();

    const parameter = [
      { type: "address", value: toAddress },
      { type: "uint256", value: amountInSun },
    ];

    // Build the transaction
    const response = await tronWeb.transactionBuilder.triggerSmartContract(
      process.env.CONTRACT_ADDRESS_SHASTA,
      "transfer(address,uint256)",
      {
        feeLimit: 100_000_000, // 100 TRX
        callValue: 0,
      },
      parameter,
      fromAddress
    );

    if (!response.result || !response.result.result) {
      throw new Error("Failed to build transaction");
    }
    const transaction = response.transaction;

    // Sign the transaction
    const signedTx = await tronWeb.trx.sign(transaction);

    // Broadcast the transaction
    const receipt = await tronWeb.trx.sendRawTransaction(signedTx);

    return receipt;
  } catch (error) {
    console.error("TRC20 transfer failed:", error);
    throw error;
  }
}

module.exports = { transferTRC20 };
