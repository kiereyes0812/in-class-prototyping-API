const jwt = require("jsonwebtoken");
require("dotenv").config();

// Use env variable for JWT secret
const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY || "In-ClassPrototypingAPI"

// [SECTION] Token Creation
module.exports.createAccessToken = (user) => {
    const payload = {
        id: user._id,
        email: user.email,
        isAdmin: user.isAdmin
    };

    return jwt.sign(payload, JWT_SECRET_KEY);
};

// [SECTION] Token Verification
module.exports.verify = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).send({
            auth: "Failed",
            message: "No token provided"

        });
    }

    // Expect format: "Bearer <token>"
    const parts = authHeader.split(" ");
    if (parts.length !== 2 || parts[0] !== "Bearer") {
        return res.status(401).send({
            auth: "Failed",
            message: "Invalid token format"
        });
    }

    const token = parts[1];
    
    jwt.verify(token, JWT_SECRET_KEY, (err, decoded) => {
        if (err) {
            const isProductsAll =
            req.method === "GET" &&
            req.baseUrl === "/products" &&
            req.path === "/all";

          if (isProductsAll) {
            return res.status(403).send({
              auth: "Failed",
              message: "Action Forbidden"
            });
          }
            return res.status(404).send({
                auth: "Failed",
                error: "User not found",
                message: err.message
            });
        }

        req.user = decoded; // store decoded payload { id, email, isAdmin, iat, exp }
        next();
    });
};

// [SECTION] Verify Admin
module.exports.verifyAdmin = (req, res, next) => {
    if (req.user && req.user.isAdmin) {
        return next();
    }
    return res.status(403).send({
        auth: "Failed",
        message: "Action Forbidden"
    });
};

// [SECTION] Error Handler
module.exports.errorHandler = (err, req, res, next) => {
    console.error(err);
    const statusCode = err.status || 500;
    const errorMessage = err.message || "Internal Server Error";

    res.status(statusCode).send({
        error: {
            message: errorMessage,
            errorCode: err.code || "SERVER_ERROR",
            details: err.details
        }
    });
};

// [SECTION] Middleware to check if the user is authenticated (session-based)
module.exports.isLoggedIn = (req, res, next) => {
    if (req.user) {
        return next();
    }
    return res.sendStatus(401);
};
