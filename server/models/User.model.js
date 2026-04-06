const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters"],
      select: false,
    },
    role: {
      type: String,
      enum: ["patient", "provider", "admin"],
      default: "patient",
      required: true,
    },
    profile: {
      firstName: {
        type: String,
        required: [true, "First name is required"],
        trim: true,
      },
      lastName: {
        type: String,
        required: [true, "Last name is required"],
        trim: true,
      },
      dateOfBirth: {
        type: Date,
        required: function () {
          return this.role === "patient";
        },
      },
      gender: {
        type: String,
        enum: ["male", "female", "other", "prefer-not-to-say"],
      },
      phone: {
        type: String,
        trim: true,
      },
      address: {
        street: String,
        city: String,
        state: String,
        zipCode: String,
        country: String,
      },
      avatar: {
        type: String,
        default: null,
      },
    },
    // Provider-specific fields
    providerInfo: {
      specialization: {
        type: String,
        required: function () {
          return this.role === "provider";
        },
      },
      licenseNumber: String,
      yearsOfExperience: Number,
      bio: String,
      availability: [
        {
          day: {
            type: String,
            enum: [
              "Monday",
              "Tuesday",
              "Wednesday",
              "Thursday",
              "Friday",
              "Saturday",
              "Sunday",
            ],
          },
          startTime: String,
          endTime: String,
        },
      ],
    },
    // Patient-specific fields
    patientInfo: {
      emergencyContact: {
        name: String,
        relationship: String,
        phone: String,
      },
      bloodType: {
        type: String,
        enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
      },
      allergies: [String],
      medications: [String],
      medicalHistory: [String],
      heightCm: Number,
      weightKg: Number,
      insurance: {
        provider: String,
        policyNumber: String,
      },
      goals: {
        steps: Number,
        calories: Number,
        sleep: Number,
      },
    },
    privacySettings: {
      shareDataWithProviders: {
        type: Boolean,
        default: true,
      },
      allowNotifications: {
        type: Boolean,
        default: true,
      },
    },
    uiPreferences: {
      theme: {
        type: String,
        enum: ["crimson", "medical", "midnight", "emerald"],
        default: "crimson",
      },
      mode: {
        type: String,
        enum: ["light", "dark"],
        default: "dark",
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: Date,
    refreshToken: {
      type: String,
      select: false,
    },
    // Email verification
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: {
      type: String,
      select: false,
    },
    emailVerificationExpires: {
      type: Date,
      select: false,
    },
    // Password reset
    passwordResetToken: {
      type: String,
      select: false,
    },
    passwordResetExpires: {
      type: Date,
      select: false,
    },
    // Google Fit Integration
    googleFitConnected: {
      type: Boolean,
      default: false,
    },
    googleFitTokens: {
      accessToken: String,
      refreshToken: String,
      expiryDate: Number,
    },
  },
  {
    timestamps: true,
  },
);

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Get full name
userSchema.virtual("fullName").get(function () {
  return `${this.profile.firstName} ${this.profile.lastName}`;
});

// Remove sensitive data from JSON output
userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;
  delete user.refreshToken;
  delete user.__v;
  return user;
};

const User = mongoose.model("User", userSchema);

module.exports = User;
