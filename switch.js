const fs = require("fs");

const target = process.argv[2];

if (target === "chrome" || target === "firefox") {
  fs.copyFileSync(`manifest.${target}.json`, "manifest.json");
  console.log(`Now ready for ${target}!`);
} else {
  console.log("Usage: node switch.js chrome OR node switch.js firefox");
}
