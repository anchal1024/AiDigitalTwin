import CompanyData from "../models/CompanyData.js";
import "dotenv/config";

export const updateComplaintStatus = async (req, res) => {
  const { tweetId, newStatus } = req.body;
  const { id } = req.user;

  try {
    const user = await CompanyData.findById(id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const complaint = user.complaints.find((complaint) => complaint.tweetId === tweetId);
    if (!complaint) return res.status(404).json({ message: "Complaint not found" });

    complaint.status = newStatus;
    await user.save();

    res.status(200).json({ message: "Complaint Status updated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

export const addCampaign = async (req, res) => {
  const campaign = req.body;
  const { id } = req.user;

  try {
    const user = await CompanyData.findById(id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.products.push(campaign);
    await user.save();

    res.status(200).json({ message: "Campaign updated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

export const deleteCampaign = async (req, res) => {
  const { index } = req.params;
  const { id } = req.user;

  try {
    const user = await CompanyData.findById(id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.products.splice(index, 1);
    await user.save();

    res.status(200).json({ message: "Campaign deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

export const toggleCampaignStatus = async (req, res) => {
  const { campaignIndex } = req.body;
  const { id } = req.user;

  try {
    const user = await CompanyData.findById(id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.products[campaignIndex].isActive = !user.products[campaignIndex].isActive;
    await user.save();

    res.status(200).json({ message: "Campaign Status updated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};


