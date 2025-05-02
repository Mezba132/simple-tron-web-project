const tronWeb = require("../config/tronweb");

const calculateFeeInTRX = async (
  fromAddress,
  contractAddress,
  toAddress,
  amount
) => {
  try {
    // Step 1: Estimate energy required for the transaction
    const amountInSun = (
      BigInt(Number(amount)) *
      BigInt(10) ** BigInt(18)
    ).toString();
    const energyRequired = await tronWeb.transactionBuilder.estimateEnergy(
      contractAddress,
      "transfer(address,uint256)",
      {},
      [
        { type: "address", value: toAddress },
        { type: "uint256", value: amountInSun },
      ]
    );

    // Step 2: Get available bandwidth and energy
    const accountResources = await tronWeb.trx.getAccountResources(fromAddress);
    const availableEnergy =
      accountResources.energyLimit - accountResources.energyUsed;
    const availableBandwidth = await tronWeb.trx.getBandwidth(fromAddress);

    // Step 3: Calculate shortfall
    const energyShortfall = Math.max(0, energyRequired - availableEnergy);
    const bandwidthShortfall = Math.max(0, 500 - availableBandwidth); // Assume 500 bandwidth required

    // Step 4: Get energy and bandwidth prices
    const chainParams = await tronWeb.trx.getChainParameters();
    const energyPriceInSun =
      chainParams.find((param) => param.key === "getEnergyFee")?.value || 0;
    const bandwidthPriceInSun =
      chainParams.find((param) => param.key === "getTransactionFee")?.value ||
      0;

    // Step 5: Calculate total fee in TRX
    const energyFeeInSun = BigInt(energyShortfall) * BigInt(energyPriceInSun);
    const bandwidthFeeInSun =
      BigInt(bandwidthShortfall) * BigInt(bandwidthPriceInSun);
    const totalFeeInSun = energyFeeInSun + bandwidthFeeInSun;

    return tronWeb.fromSun(totalFeeInSun); // Convert Sun to TRX
  } catch (error) {
    throw new Error(`Failed to calculate fee: ${error.message}`);
  }
};

module.exports = { calculateFeeInTRX };
