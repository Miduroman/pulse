const { execSync } = require("child_process");

const isProduction = process.env.VERCEL_ENV === "production";

try {
  if (isProduction) {
    console.log("Applying production database migrations...");

    execSync(
      "npx prisma migrate deploy --config prisma7.config.ts",
      { stdio: "inherit" }
    );
  } else {
    console.log("Preview deployment: skipping database migrations.");
  }

  console.log("Building Pulse...");

  execSync("npm run build", { stdio: "inherit" });
} catch (error) {
  console.error("Pulse deployment failed.");
  process.exit(1);
}