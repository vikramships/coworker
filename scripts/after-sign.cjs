const { execSync } = require("child_process");
const { join } = require("path");
const { existsSync } = require("fs");
const { config } = require("dotenv");

// Load .env file if it exists
const envPath = join(process.cwd(), ".env");
if (existsSync(envPath)) {
  config({ path: envPath });
}

exports.default = async function afterSignHook(context) {
  const { electronPlatformName, appOutDir } = context;
  const appName = context.packager.appInfo.productFilename;
  const appPath = `${appOutDir}/${appName}.app`;

  // Only process macOS
  if (electronPlatformName !== "darwin") return;

  // Notarize if credentials are available
  if (!process.env.APPLE_ID || !process.env.APPLE_APP_SPECIFIC_PASSWORD || !process.env.APPLE_TEAM_ID) {
    console.log("⚠️  Skipping notarization - credentials not set");
    return;
  }

  console.log("🔏 Submitting for notarization (no wait)...");

  try {
    // Create a ZIP for notarization
    const zipPath = `${appOutDir}/${appName}.zip`;
    execSync(`cd "${appOutDir}" && zip -ry "${appName}.zip" "${appName}.app"`, { stdio: "ignore" });

    // Submit to notarytool without waiting
    const result = execSync(
      `xcrun notarytool submit "${zipPath}" ` +
      `--apple-id "${process.env.APPLE_ID}" ` +
      `--password "${process.env.APPLE_APP_SPECIFIC_PASSWORD}" ` +
      `--team-id "${process.env.APPLE_TEAM_ID}" ` +
      `--no-wait ` +
      `--output-format json`,
      { encoding: "utf8", stdio: "pipe" }
    );

    const submission = JSON.parse(result);
    console.log(`✅ Submitted! Submission ID: ${submission.id}`);
    console.log(`📋 Check: xcrun notarytool log ${submission.id} --apple-id $APPLE_ID --password $APPLE_APP_SPECIFIC_PASSWORD --team-id $APPLE_TEAM_ID`);
    console.log(`📌 Staple when approved: xcrun stapler staple "${appPath}"`);

    execSync(`rm "${zipPath}"`, { stdio: "ignore" });
  } catch (error) {
    console.error("❌ Notarization submission failed:", error.message);
  }
};
