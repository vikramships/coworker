const { execSync } = require("child_process");
const { config } = require("dotenv");
const { join } = require("path");
const { existsSync } = require("fs");

// Load .env file if it exists
const envPath = join(process.cwd(), ".env");
if (existsSync(envPath)) {
  config({ path: envPath });
}

exports.default = async function notarizeHook(context) {
  const { electronPlatformName, appOutDir } = context;

  // Only notarize macOS
  if (electronPlatformName !== "darwin") return;

  // Skip notarization if credentials not available
  if (!process.env.APPLE_ID || !process.env.APPLE_APP_SPECIFIC_PASSWORD || !process.env.APPLE_TEAM_ID) {
    console.log("⚠️  Skipping notarization - APPLE_ID, APPLE_APP_SPECIFIC_PASSWORD, or APPLE_TEAM_ID not set");
    return;
  }

  const appName = context.packager.appInfo.productFilename;
  const appPath = `${appOutDir}/${appName}.app`;

  console.log("🔏 Submitting for notarization (no wait)...");

  try {
    // Create a ZIP for notarization (notarytool requires a ZIP file)
    const zipPath = `${appOutDir}/${appName}.zip`;
    execSync(`cd "${appOutDir}" && zip -ry "${appName}.zip" "${appName}.app"`, { stdio: "inherit" });

    // Submit to notarytool WITHOUT waiting (use --no-wait flag)
    // The submission ID will be returned for tracking
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
    console.log(`✅ Submitted to Apple! Submission ID: ${submission.id}`);
    console.log(`📋 Check status: xcrun notarytool log ${submission.id} --apple-id $APPLE_ID --password $APPLE_APP_SPECIFIC_PASSWORD --team-id $APPLE_TEAM_ID`);
    console.log(`📌 Once approved, staple with: xcrun stapler staple "${appPath}"`);

    // Clean up ZIP
    execSync(`rm "${zipPath}"`, { stdio: "ignore" });
  } catch (error) {
    console.error("❌ Notarization submission failed:", error.message);
    // Don't throw - let the build complete even if notarization fails
  }
};
