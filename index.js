const readline = require("readline");
const { createAccount } = require("./src/services/account");
const { transferTRX } = require("./src/services/transfer");

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
      Private Key: ${account.privateKey}
      Address: ${account.address.base58}
      `);
      break;

    case "2":
      const depositKey = await askQuestion("Enter your PRIVATE KEY: ");
      const depositAmount = await askQuestion("Enter TRX amount: ");
      const depositResult = await transferTRX(depositKey, depositAmount);
      console.log("Deposit TX:", depositResult);
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
