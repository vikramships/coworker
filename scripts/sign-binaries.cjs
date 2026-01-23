const { execSync } = require("child_process");
const { glob } = require("glob");
const { join } = require("path");
const { existsSync } = require("fs");

exports.default = async function signBinaries(context) {
  const { appOutDir } = context;
  const appName = context.packager.appInfo.productFilename;
  const appPath = `${appOutDir}/${appName}.app`;

  console.log("🔏 Signing native binaries...");

  try {
    // Find all native binaries in asar.unpacked that need signing
    const patterns = [
      "Contents/Resources/app.asar.unpacked/**/*.node",
      "Contents/Resources/app.asar.unpacked/**/*.dylib",
      "Contents/Resources/app.asar.unpacked/**/*.so",
      "Contents/Frameworks/**/*.dylib",
      "Contents/Frameworks/**/*.framework/**/Helpers/**",
      "Contents/Frameworks/**/*.framework/**/Libraries/**"
    ];

    let binariesToSign = [];

    for (const pattern of patterns) {
      const files = glob.sync(join(appPath, pattern));
      binariesToSign = binariesToSign.concat(files.filter(file => {
        // Check if file is a binary (not a symlink or directory)
        try {
          const stats = require("fs").statSync(file);
          return stats.isFile() && stats.size > 0;
        } catch {
          return false;
        }
      }));
    }

    console.log(`Found ${binariesToSign.length} binaries to sign`);

    // Sign each binary - use identity from environment or auto-detect
    const identity = process.env.CODE_SIGN_IDENTITY || "Developer ID Application";
    for (const binary of binariesToSign) {
      console.log(`Signing: ${binary}`);
      try {
        execSync(`codesign --force --sign "${identity}" --timestamp --options runtime "${binary}"`, {
          stdio: "inherit"
        });
      } catch (error) {
        console.warn(`Warning: Failed to sign ${binary}: ${error.message}`);
        // Continue with other binaries
      }
    }

    console.log("✅ Native binaries signing completed");

  } catch (error) {
    console.error("❌ Error signing native binaries:", error.message);
    // Don't throw - let the build continue
  }
};