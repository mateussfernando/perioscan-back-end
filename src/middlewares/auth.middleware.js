import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import ErrorResponse from "../utils/errorResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

// Proteger rotas
export const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    // Obter token do cabeçalho Bearer
    token = req.headers.authorization.split(" ")[1];
  }

  // Verificar se o token existe
  if (!token) {
    return next(new ErrorResponse("Not authorized to access this route", 401));
  }

  try {
    // Verificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = await User.findById(decoded.id);

    next();
  } catch (err) {
    return next(new ErrorResponse("Not authorized to access this route", 401));
  }
});

// Conceder acesso a cargos específicos
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new ErrorResponse(
          `User role ${req.user.role} is not authorized to access this route`,
          403
        )
      );
    }
    next();
  };
};
