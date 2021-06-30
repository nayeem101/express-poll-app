const jwt = require("jsonwebtoken");

const auth = (req, res, next) => {
    try {
        const token = req.cookies.token;

        if (token) {
            let valid = jwt.verify(token, process.env.jwtKey);

            if (valid.msg) {
                const user = valid.msg.substring(
                    valid.msg.indexOf("U") + 1,
                    valid.msg.indexOf("N")
                );
                //proceed to next middleware
                req.user = user;
                next();
            }
        } else res.redirect("/");
    } catch (error) {
        res.render("home", { msg: "Authentication failed" });
    }
};

module.exports = auth;
