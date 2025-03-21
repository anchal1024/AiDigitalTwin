import express from "express";
import { generateCaption, image1, image2, image3 } from "../controllers/imageController.js";

const router = express.Router();

router.post("/1", image1);
router.post("/2", image2);
router.post("/3", image3);

router.get("/caption", generateCaption);

export default router;