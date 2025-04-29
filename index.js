const readline = require("readline");
const { createAccount } = require("./src/services/account");
const { transferTRX } = require("./src/services/transfer");
const tronWeb = require("./src/config/tronweb");
const {
  verifyTransactionFeasibility,
} = require("./src/services/validate_amount");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function showMenu() {
  console.log(`
  TRON Wallet Manager
  ===================
  1. Create Account
  2. Deposit TRX
  3. Withdraw TRX
  4. Exit
  `);
}

async function handleInput(choice) {
  switch (choice) {
    case "1":
      const account = await createAccount();
      console.log(`
      ✅ New Account Created!
      Address: ${account.address.base58}
      Private Key: ${account.privateKey}
      `);
      break;

    case "2":
      const fromKey = await askQuestion("Your PRIVATE KEY: ");
      const depositAmt = await askQuestion("TRX amount: ");

      // Verify balance before deposit
      const senderAddress = tronWeb.address.fromPrivateKey(fromKey);
      const depositCheck = await verifyTransactionFeasibility(
        senderAddress,
        depositAmt
      );

      if (!depositCheck.canProceed) {
        console.log(
          `❌ Insufficient funds. Need ${depositCheck.required} TRX (You have ${depositCheck.currentBalance})`
        );
      } else {
        const result = await transferTRX(fromKey, depositAmt);
        console.log(`✅ Deposit successful! TX ID: ${result.txId}`);
        console.log(`Fee used: ${depositCheck.feeEstimate}`);
      }
      break;

    case "3":
      console.log("👋 Exiting...");
      process.exit(0);

    default:
      console.log("❌ Invalid choice");
  }
}

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => resolve(answer.trim()));
  });
}

async function main() {
  while (true) {
    showMenu();
    const choice = await askQuestion("Choose an option (1-4): ");
    await handleInput(choice);
  }
}

main().catch(console.error);
