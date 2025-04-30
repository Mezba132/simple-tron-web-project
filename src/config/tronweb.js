const { TronWeb } = require("tronweb");
require("dotenv").config();

if (!process.env.DEPOSIT_PRIVATE_KEY) {
  console.error("❌ Error: DEPOSIT_PRIVATE_KEY is not set in .env");
  process.exit(1);
}

const tronWeb = new TronWeb({
  fullHost: "https://nile.trongrid.io",
  // headers: { TestTronApiKey: "ceda11f7-7f5d-4c8b-8a98-555437e4d4f5" },
  privateKey: process.env.DEPOSIT_PRIVATE_KEY,
});

(async () => {
  try {
    const currentBlock = await tronWeb.trx.getCurrentBlock();
    console.log("");
    console.log(
      "✓ Connected to TronGrid. Current block number:",
      currentBlock.block_header.raw_data.number
    );
  } catch (error) {
    console.error("❌ Connection failed:", error.message);
    process.exit(1);
  }
})();

module.exports = tronWeb;
