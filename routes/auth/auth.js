import crypto from "crypto";
import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Auth from "../../models/auth/Auth.js";
import { sendConfirmationEmail } from "../../utility/mailer.js";

const router = express.Router();

const CONFIRMATION_TOKEN_TTL_HOURS = 24;

router.post("/register", async (req, res) => {
	try {
		const { username, email, password } = req.body;

		if (!username || !email || !password) {
			return res.status(400).json({ msg: "username, email, and password are required" });
		}

		const existingUser = await Auth.findOne({ $or: [{ username }, { email }] });

		if (existingUser) {
			return res.status(409).json({ msg: "Username or email already in use" });
		}

		const hashedPassword = await bcrypt.hash(password, 10);
		const confirmationToken = crypto.randomBytes(32).toString("hex");
		const confirmationTokenExpires = new Date(
			Date.now() + CONFIRMATION_TOKEN_TTL_HOURS * 60 * 60 * 1000
		);

		await Auth.create({
			username,
			email,
			password: hashedPassword,
			confirmationToken,
			confirmationTokenExpires,
		});

		await sendConfirmationEmail({ to: email, username, token: confirmationToken });

		res.status(201).json({ msg: "User registered. Check your email to confirm your account." });

	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

router.get("/confirm/:token", async (req, res) => {
	try {
		const user = await Auth.findOne({
			confirmationToken: req.params.token,
			confirmationTokenExpires: { $gt: new Date() },
		}).select("+confirmationToken +confirmationTokenExpires");

		if (!user) {
			return res.status(400).json({ msg: "Invalid or expired confirmation token" });
		}

		user.isVerified = true;
		user.confirmationToken = null;
		user.confirmationTokenExpires = null;
		await user.save();

		res.json({ msg: "Account confirmed. You can now log in." });
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

router.post("/login", async (req, res) => {
	try {
		const { username, password } = req.body;

		if (!username || !password) {
			return res.status(400).json({ msg: "username and password are required" });
		}

		const user = await Auth.findOne({ username }).select("+password");
		if (!user) {
			return res.status(401).json({ msg: "Invalid credentials" });
		}

		const isMatch = await bcrypt.compare(password, user.password);
		if (!isMatch) {
			return res.status(401).json({ msg: "Invalid credentials" });
		}

		if (!process.env.JWT_SECRET) {
			return res.status(500).json({ msg: "JWT_SECRET is not set" });
		}

		const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
			expiresIn: "1h",
		});

		res.json({
			token,
			userId: user._id
		});
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

export default router;
