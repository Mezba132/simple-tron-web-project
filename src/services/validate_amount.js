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

const getRequiredEnergy = async (toAddress, amount) => {
  try {
    const amountInSun = (
      BigInt(Number(amount)) *
      BigInt(10) ** BigInt(18)
    ).toString();
    const result = await tronWeb.transactionBuilder.estimateEnergy(
      process.env.CONTRACT_ADDRESS_SHASTA,
      "transfer(address,uint256)",
      {},
      [
        { type: "address", value: toAddress },
        { type: "uint256", value: amountInSun },
      ]
    );
    return result;
  } catch (error) {
    throw new Error(`Failed to calculate fee: ${error.message}`);
  }
};

const getBandwidthPrices = async () => {
  try {
    return tronWeb.trx.getBandwidthPrices();
  } catch (error) {
    throw new Error(`Bandwidth check failed: ${error.message}`);
  }
};

const getEnergyPrices = async () => {
  try {
    return tronWeb.trx.getEnergyPrices();
  } catch (error) {
    throw new Error(`Bandwidth check failed: ${error.message}`);
  }
};

const frozenEnergy = async () => {
  const freezeResult = await tronWeb.trx.freezeBalance(
    25_000_000, // Amount in SUN (1 TRX = 1,000,000 SUN)
    3,
    "ENERGY"
  );
  console.log("Freeze TX ID:", freezeResult.txid);
  return freezeResult;
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
  const [energyAndBandwidthPriceInSun, getRequiredBandwidthAndEnergy] =
    await Promise.all([
      getEnergyAndBandwidthPriceInSun(),
      calculateRequiredBandwidthAndEnergy(
        "TU2SLa6PxwRtKyWz1PgfKAhCVQT9tEBFfk",
        "TZ6UZAVE1szEGmViFDnzjbKVGYNoHz7vjF",
        50
      ),
    ]);
  const energyCostTRX =
    (getRequiredBandwidthAndEnergy.energyDeficit *
      energyAndBandwidthPriceInSun.energyPriceInSun) /
    1e6;
  const bandwidthCostTRX =
    (getRequiredBandwidthAndEnergy.bandwidthDeficit *
      energyAndBandwidthPriceInSun.bandWidthPriceInSun) /
    1e6;
  const totalCostTRX = energyCostTRX + bandwidthCostTRX;
  console.log("energyCostTRX", energyCostTRX);
  console.log("bandwidthCostTRX", bandwidthCostTRX);
  console.log("totalCostTRX", totalCostTRX);

  return {
    energyAndBandwidthPriceInSun,
  };
};

const calculateRequiredBandwidthAndEnergy = async (
  fromAddress,
  toAddress,
  amount
) => {
  try {
    const amountInSun = (
      BigInt(Number(amount)) *
      BigInt(10) ** BigInt(18)
    ).toString();

    const { transaction } =
      await tronWeb.transactionBuilder.triggerSmartContract(
        process.env.CONTRACT_ADDRESS_SHASTA,
        "transfer(address,uint256)",
        {
          feeLimit: 100000000,
          callValue: 0,
        },
        [
          { type: "address", value: toAddress },
          { type: "uint256", value: amountInSun },
        ]
      );

    const { energy_required } =
      await tronWeb.transactionBuilder.triggerSmartContract(
        process.env.CONTRACT_ADDRESS_SHASTA,
        "transfer(address,uint256)",
        {
          feeLimit: 100000000,
          callValue: 0,
          estimateEnergy: true,
        },
        [
          { type: "address", value: toAddress },
          { type: "uint256", value: amountInSun },
        ]
      );

    const account = await tronWeb.trx.getAccount();

    const frozenEnergy =
      account.frozenV2?.find((f) => f.type === "ENERGY")?.amount || 0;
    const energyUsage = account.account_resource?.energy_usage || 0;
    const availableEnergy = Math.max(frozenEnergy - energyUsage, 0);
    console.log(
      "availableEnergy : ",
      availableEnergy,
      " energy_required : ",
      energy_required
    );
    const energyDeficit = Math.max(energy_required - availableEnergy, 0);

    const transactionSizeBytes = Buffer.from(
      transaction.raw_data_hex,
      "hex"
    ).length;

    // Step 3: Calculate bandwidth cost in TRX
    const availableBandwidth = await tronWeb.trx.getBandwidth(fromAddress);
    console.log("availableBandwidth", availableBandwidth);
    const bandwidthDeficit = Math.max(
      availableBandwidth - transactionSizeBytes,
      0
    );

    return {
      requiredBandwidth: transactionSizeBytes,
      energy_required: energy_required,
      bandwidthDeficit: bandwidthDeficit,
      energyDeficit: energyDeficit,
    };
  } catch (error) {
    throw new Error(`Calculation failed: ${error.message}`);
  }
};

module.exports = {
  getBalance,
  verifyTransactionFeasibility,
  getEstimateFee,
  calculateRequiredBandwidthAndEnergy,
};
