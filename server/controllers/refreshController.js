import CompanyData from '../models/CompanyData.js'; // Import the CompanyData model
import jwt from 'jsonwebtoken'; // Import jwt

export const refresh = async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(400).json({ message: "Authorization header missing or improperly formatted" });
        }
        const token = authHeader.split(' ')[1]; // Extract token

        const decoded = jwt.verify(token, process.env.JWT_SECRET); // Verify token
        const user = await CompanyData.findById(decoded.id); // Fetch user

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json({ message: "Refresh successful", user });
    } catch (error) {
        console.error('Error in refresh:', error);
        res.status(500).json({ message: "Server error", error });
    }
};

