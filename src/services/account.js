const tronWeb = require("../config/tronweb");

const createAccount = async () => {
  try {
    const account = await tronWeb.createAccount();

    if (!account.privateKey || !account.address.base58) {
      throw new Error("Account creation failed");
    }

    return {
      privateKey: account.privateKey,
      address: account.address,
    };
  } catch (error) {
    throw new Error(`Account creation failed: ${error.message}`);
  }
};

module.exports = { createAccount };
