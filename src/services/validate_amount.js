const tronWeb = require("../config/tronweb");

const getBalance = async (address) => {
  try {
    const balanceSun = await tronWeb.trx.getBalance(address);
    return tronWeb.fromSun(balanceSun);
  } catch (error) {
    throw new Error(`Balance check failed: ${error.message}`);
  }
};

const getBandwidth = async (address) => {
  try {
    return tronWeb.trx.getBandwidth(address);
  } catch (error) {
    throw new Error(`Bandwidth check failed: ${error.message}`);
  }
};

const getBandwidthPrices = async () => {
  try {
    return tronWeb.trx.getBandwidthPrices();
  } catch (error) {
    throw new Error(`Bandwidth check failed: ${error.message}`);
  }
};

const verifyTransactionFeasibility = async (senderAddress, amountTRX) => {
  const [balance, availBandwidth] = await Promise.all([
    getBalance(senderAddress),
    getBandwidth(senderAddress),
  ]);

  const feeEstimate = availBandwidth > 0 ? 0 : 0.1;
  const totalCost = Number(amountTRX) + feeEstimate;

  return {
    canProceed: balance >= totalCost,
    currentBalance: balance,
    required: totalCost,
    usesBandwidth: resources.bandwidth > 0,
    feeEstimate: `${feeEstimate} TRX`,
  };
};

const getEnergyAndBandwidthPriceInSun = async () => {
  try {
    const chainParams = await tronWeb.trx.getChainParameters();
    const energyPriceInSun = chainParams.find(
      (param) => param.key === "getEnergyFee"
    )?.value;

    const bandWidthPriceInSun = chainParams.find(
      (param) => param.key === "getTransactionFee"
    )?.value;

    if (!energyPriceInSun || !bandWidthPriceInSun) throw new Error("");
    return { energyPriceInSun, bandWidthPriceInSun };
  } catch (error) {
    throw new Error("Failed to get energy and bandwidth fee");
  }
};

const getEstimateFee = async () => {
  const [energyAndBandwidthPriceInSun, accountResources] = await Promise.all([
    getEnergyAndBandwidthPriceInSun(),
    checkResources(process.env.DEPOSIT_ADDRESS),
  ]);

  console.log("energyAndBandwidthPriceInSun", energyAndBandwidthPriceInSun);
  console.log("accountResources", accountResources);

  return {
    energyAndBandwidthPriceInSun,
    accountResources,
  };
};

module.exports = {
  getBalance,
  verifyTransactionFeasibility,
  getEstimateFee,
};
