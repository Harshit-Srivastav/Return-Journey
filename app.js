const express = require("express");
const cors = require("cors");
const connDB = require("./config/db.js");
const { validateIP } = require("./middleware/validateip");
const User = require("./models/userModel.js");
const bcrypt = require("bcryptjs");
require("dotenv").config();

// loading twilio lib
const client = require("twilio")(
  process.env.ACCOUNT_SID,
  process.env.ACCOUNT_TOKEN
);
connDB();

const app = express();
app.use(express.json());
app.use(cors());
app.set("trust proxy", true);

let users = [];

// using middleware for getting the ip info 
app.use("/register", validateIP);

// Getting users data and sending otp 
app.post("/register", async (req, res) => {
  try {
    const { name, email, password, mobile } = req.body;
    // Initial checking that all fields were present
    if(!name || !email || !password || !mobile) {
      return res.status(400).send({error: true, message: 'Please fill all the fields'})
    }
    const existingUser = await User.findOne({ mobile });
    if (existingUser) {
      return res
        .status(400)
        .send({ error: true, message: "User already exists" });
    }
  
    const hashedPassword = await bcrypt.hash(password, 10)

    let digits = "0123456789";
    let OTP = "";
    for (let i = 0; i < 4; i++) {
      OTP += digits[Math.floor(Math.random() * 10)];
    }

    // Sending OTP using twilio ensuring the international format for INDIA
    const twilioRes = await client.messages.create({
      body: `Your otp verification code is ${OTP}`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: `+91${mobile}`,
    });

    // hashing otp and saving user data in global variable
    const hashedOTP = await bcrypt.hash(OTP, 10);
    let newUser = {
      name,
      email,
      password: hashedPassword,
      mobile,
      otp: hashedOTP,
      ip: req.ipData.ip
    };
    users = users.filter((item) => item.mobile != mobile);
    users.push(newUser);
    res.status(200).send({ success: true, message: "OTP sent" });
  } catch (e) {
    res.status(400).send({ error: true, message: e.message });
  }
});

// User otp verify route
app.post("/verify", async (req, res) => {
  try {
    const { otp, mobile } = req.body;
    const existingUser = await User.findOne({ mobile });
    if (existingUser) {
      return res
        .status(400)
        .send({ error: true, message: "User already exists" });
    }
    
    let user = users.find((item) => item.mobile === mobile)
    
    if (!user) {
      return res.status(400).send({ error: true, message: "Please fill the form data first" });
    }
    // Comparing otp 
    const otpRes = await bcrypt.compare(otp.toString(), user.otp)
    if(!otpRes) return res.status(400).send({error: true, message: 'Invalid OTP'})
    let dbUser = new User(user)
    // saving user data in database after otp verification
    users = users.filter((item) => item.mobile != mobile);
    dbUser = await dbUser.save()
    res
      .status(200)
      .send({ success: true, message: "User Registered successfully"});
  } catch (e) {
    res.status(400).send({ error: true, message: e.message });
  }
});


app.listen(process.env.PORT || 5000, () => {
  console.log(`Server is running on PORT ${process.env.port || 5000}`);
});
