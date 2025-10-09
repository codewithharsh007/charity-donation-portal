import jwt from "jsonwebtoken";

export const JWT_SECRET = process.env.JWT_SECRET || "change_this_in_production";
export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

export const signToken = (userId) => {
  return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

export const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new Error("Invalid or expired token");
  }
};

export const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax", // Protects against CSRF attacks
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: "/", // Makes cookie available across all routes
};
