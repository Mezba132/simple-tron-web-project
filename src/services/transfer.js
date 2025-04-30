const tronWeb = require("../config/tronweb");
const { verifyTransactionFeasibility } = require("./validate_amount");

const transferTRX = async (fromPrivateKey, amount) => {
  try {
    const fromAddress = tronWeb.address.fromPrivateKey(fromPrivateKey);
    const sufficientAmount = await verifyTransactionFeasibility(
      fromAddress,
      amount
    );

    // Check balance
    if (!sufficientAmount.canProceed) {
      throw new Error("Insufficient balance for deposit + fees");
    }

    const transaction = await tronWeb.trx.sendTransaction(
      process.env.DEPOSIT_ADDRESS,
      tronWeb.toSun(amount),
      fromPrivateKey
    );

    return {
      success: true,
      txId: transaction.txid,
      fee: "0.1 TRX (estimated)",
    };
  } catch (error) {
    throw new Error(`Transfer failed: ${error.message}`);
  }
};

module.exports = { transferTRX };
