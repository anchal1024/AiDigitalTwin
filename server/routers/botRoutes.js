
import express from 'express';
import { getAllTweets, getFollowers, getMyPost, getPosts, getReach, getReachFeed } from '../controllers/botController.js';

const router = express.Router();

router.get("/getFollowers", getFollowers);
router.get("/getReachFeed", getReachFeed);
router.get("/getMyPost", getMyPost);
router.get("/getReach", getReach);
router.get("/getPosts", getPosts);
router.get("/getAllTweets", getAllTweets);


export default router;