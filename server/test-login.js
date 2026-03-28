require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User.model");

mongoose
  .connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log("Checking demo accounts...\n");

    const emails = ["patient@demo.com", "provider@demo.com", "admin@demo.com"];

    for (const email of emails) {
      const user = await User.findOne({ email }).select("+password");

      if (!user) {
        console.log(`❌ ${email} - NOT FOUND`);
        continue;
      }

      console.log(`✓ ${email} found`);
      console.log(`  - Role: ${user.role}`);
      console.log(`  - Active: ${user.isActive}`);
      console.log(`  - Has password: ${!!user.password}`);
      console.log(
        `  - Password hash starts: ${user.password?.substring(0, 10)}`,
      );

      // Test password
      try {
        const match = await bcrypt.compare("demo1234", user.password);
        console.log(
          `  - Password "demo1234" matches: ${match ? "✓ YES" : "❌ NO"}`,
        );

        if (!match) {
          // Try with comparePassword method
          const matchMethod = await user.comparePassword("demo1234");
          console.log(
            `  - Using comparePassword method: ${matchMethod ? "✓ YES" : "❌ NO"}`,
          );
        }
      } catch (err) {
        console.log(`  - Password check error: ${err.message}`);
      }

      console.log();
    }

    mongoose.connection.close();
  })
  .catch((err) => {
    console.error("Error:", err);
    process.exit(1);
  });
