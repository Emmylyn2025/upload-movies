import jwt from "jsonwebtoken";

export function generateTokens(info) {
  const accessToken = jwt.sign(info, process.env.accesstoken, {expiresIn: "15m"});

  const refreshToken = jwt.sign(info, process.env.refreshtoken, {expiresIn: "31d"});

  return {accessToken, refreshToken};
}

export function saveRefreshInCookie(res, token) {
  res.cookie("refreshtoken", token, {
    httpOnly: true,
    sameSite: "none",
    secure: false,
    path: "/postgres/api/refresh",
    maxAge: 30 * 24 * 60 * 60 * 1000
  });
}