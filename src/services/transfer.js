const { TronWeb } = require("tronweb");
const tronWeb = require("../config/tronweb");

const transferTRX = async (fromPrivateKey, amount) => {
  try {
    const depositAddress = process.env.DEPOSIT_ADDRESS;
    const userTronWeb = new TronWeb({
      fullHost: "https://api.shasta.trongrid.io",
      privateKey: fromPrivateKey,
    });

    const transaction = await userTronWeb.trx.sendTransaction(
      depositAddress,
      tronWeb.toSun(amount)
    );

    return transaction;
  } catch (error) {
    throw new Error(`Transfer failed: ${error.message}`);
  }
};

module.exports = { transferTRX };
