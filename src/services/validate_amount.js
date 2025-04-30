const tronWeb = require("../config/tronweb");
require("dotenv").config();

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

const getUnsignedTx = async (fromAddress, toAddress, amount) => {
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

  return energyInfo;
};

async function estimateEnergyForTransfer(contractAddress, toAddress, amount) {
  const result = await tronWeb.transactionBuilder.estimateEnergy(
    contractAddress,
    "transfer(address,uint256)",
    {},
    [
      { type: "address", value: toAddress },
      { type: "uint256", value: amount },
    ]
  );

  if (!result.result.result) {
    throw new Error("Estimation failed");
  }

  return result.energy_required;
}

const getEstimateFee = async () => {
  const [energyAndBandwidthPriceInSun, accountResources, unsignedTx] =
    await Promise.all([
      getEnergyAndBandwidthPriceInSun(),
      getBandwidth(process.env.DEPOSIT_ADDRESS),
      getUnsignedTx(
        "TTKZwdpEATsDxQfxVKcJkJQnPabZvsoRqz",
        "TGJE9emwgqCvEzsUxpyuLtq5JoY7dgKS6x",
        50
      ),
    ]);

  console.log("energyAndBandwidthPriceInSun", energyAndBandwidthPriceInSun);
  console.log("accountResources", accountResources);
  console.log("unsignedTx", unsignedTx);

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
