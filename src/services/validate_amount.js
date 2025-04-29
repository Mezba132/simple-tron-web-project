const tronWeb = require("../config/tronweb");

const getBalance = async (address) => {
  try {
    const balanceSun = await tronWeb.trx.getBalance(address);
    return tronWeb.fromSun(balanceSun);
  } catch (error) {
    throw new Error(`Balance check failed: ${error.message}`);
  }
};

const checkResources = async (address) => {
  const account = await tronWeb.trx.getAccount(address);
  return {
    bandwidth: account.bandwidth || 0,
    energy:
      account.account_resource?.frozen_balance_for_energy?.frozen_balance || 0,
    freeNetLimit: account.free_net_limit || 0,
  };
};

const verifyTransactionFeasibility = async (senderAddress, amountTRX) => {
  const [balance, resources] = await Promise.all([
    getBalance(senderAddress),
    checkResources(senderAddress),
  ]);

  const feeEstimate = resources.bandwidth > 0 ? 0 : 0.1;
  const totalCost = Number(amountTRX) + feeEstimate;

  return {
    canProceed: balance >= totalCost,
    currentBalance: balance,
    required: totalCost,
    usesBandwidth: resources.bandwidth > 0,
    feeEstimate: `${feeEstimate} TRX`,
  };
};

const calculateFee = async (senderAddress) => {
  const resources = await checkResources(senderAddress);
  if (resources.bandwidth > 0) return 0;

  try {
    const chainParams = await tronWeb.trx.getChainParameters();
    const feeParam = chainParams.find((p) => p.key === "getTransactionFee");
    return feeParam ? tronWeb.fromSun(feeParam.value) : 0.1;
  } catch (error) {
    console.warn("⚠️ Fee API error, using fallback 0.1 TRX");
    return 0.1;
  }
};

const hasSufficientBalance = async (address, amountTRX) => {
  const [balance, fee] = await Promise.all([
    getBalance(address),
    calculateFee(address),
  ]);
  const neededAmount = Number(amountTRX) + Number(fee);
  return Number(balance) >= neededAmount;
};
module.exports = {
  getBalance,
  hasSufficientBalance,
  checkResources,
  verifyTransactionFeasibility,
};
