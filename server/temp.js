import axios from "axios";
import { configDotenv } from "dotenv";

const test = async () => {
  const response = await axios.get(
    `https://public.api.bsky.app/xrpc/app.bsky.feed.getAuthorFeed?actor=${configDotenv.DID}`
  );

  const totalLikes = response.data.feed.reduce((acc, item) => {
    return acc + (item.post?.likeCount || 0);
  }, 0);
  
  // console.log("Total likes:", totalLikes);
};

test();
