const { validateDocsConfig } = require("@mintlify/validation");
const fs = require("fs");

// Read the docs.json file
const configFile = fs.readFileSync("./docs.json", "utf-8");
const configObject = JSON.parse(configFile);

// Validate the configuration
const result = validateDocsConfig(configObject);

console.log("Validation Result:");
console.log("==================");
console.log("Status:", result.status);

if (result.warnings && result.warnings.length > 0) {
    console.log("\nWarnings:");
    result.warnings.forEach((w, i) => console.log(`  ${i + 1}. ${w}`));
}

if (result.errors && result.errors.length > 0) {
    console.log("\nErrors:");
    result.errors.forEach((e, i) => console.log(`  ${i + 1}. ${e}`));
    process.exit(1);
}

console.log("\n✅ Configuration is valid!");
