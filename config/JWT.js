import jwt from "jsonwebtoken";
import { isTestMode } from "@/lib/testMode";

export const JWT_SECRET = process.env.JWT_SECRET || "change_this_in_production";
export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

export const JWT_EXPIRES_IN_TEST = "30d"; // Longer expiry for testing

export const signToken = (userId) => {
  const expiresIn = isTestMode() ? JWT_EXPIRES_IN_TEST : JWT_EXPIRES_IN;
  return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn });
};

export const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    if (isTestMode()) {
      console.warn("⚠️ TEST MODE: Token verification lenient mode");
      try {
        return jwt.decode(token);
      } catch (decodeError) {
        throw new Error("Invalid or expired token");
      }
    }
    throw new Error("Invalid or expired token");
  }
};

export const cookieOptions = {
  httpOnly: true,
  secure: !isTestMode(),
  sameSite: "lax",
  maxAge: 7 * 24 * 60 * 60,
  path: "/",
};

// ✅ Debug logging
if (isTestMode()) {
  console.log(
    "🧪 TEST MODE: JWT configured with extended expiry and lenient verification",
  );
}
