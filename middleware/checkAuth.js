const jwt = require('jsonwebtoken')
module.exports= async (req, res, next) => {
    try {
        //console.log(req.headers.authorization.split(" ")[1]);
        const token = req.headers.authorization.split(" ")[1]
        await jwt.verify(token, 'mukesh kumar 2725')
        next()
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            error: "Invalid token"
        })
    }
}