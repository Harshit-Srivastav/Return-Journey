const { IPinfoWrapper, ApiLimitError } = require("node-ipinfo");
const axios = require("axios");
const requestIp = require("request-ip");

// Getting the client IP
const validateIP = async (req, res, next) => {
  try {
    // requserIp module for getting the client ip in production environment
    const clientIp = requestIp.getClientIp(req);
    // for development purpose using ipify third party lib because localhost reflecting loopback address
    const { data } = await axios.get("https://api.ipify.org");
    const clientIPAddress =
      process.env.NODE_ENV === "development" ? data : clientIp;
    const ipinfo = new IPinfoWrapper(process.env.MY_TOKEN);
    const result = await ipinfo.lookupIp(clientIPAddress);
    // Taking only those accounts further which belongs to India 
    if (result.countryCode === "IN") {
      req.ipData = result;
      next();
    } else {
      return res.status(400).send({
        success: false,
        error: true,
        message: "Error! This forum only belongs to INDIAN citizens",
      });
    }
  } catch (e) {
    return res
      .status(400)
      .send({ success: false, error: true, message: e.message });
  }
};

module.exports = {
  validateIP,
};
