import { updateComplaintStatus, toggleCampaignStatus, addCampaign, deleteCampaign } from "../controllers/adminController.js";
import { Router } from "express";

const adminRouter = Router();

adminRouter.patch("/complaint/status", updateComplaintStatus);
adminRouter.patch("/campaign/status", toggleCampaignStatus);
adminRouter.post("/campaign", addCampaign);
adminRouter.delete("/campaign/:index", deleteCampaign);

export default adminRouter;
