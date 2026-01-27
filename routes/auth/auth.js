import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Auth from "../../models/auth/Auth.js";

const router = express.Router();

router.post("/register", async (req, res) => {
	try {
		const { username, password } = req.body;

		if (!username || !password) {
			return res.status(400).json({ msg: "username and password are required" });
		}

		const existingUser = await Auth.findOne({ username });

		if (existingUser) {
			return res.status(409).json({ msg: "User already exists" });
		}

		const hashedPassword = await bcrypt.hash(password, 10);

		await Auth.create({
			username,
			password: hashedPassword,
		});

		res.status(201).json({ msg: "User registered" });

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
