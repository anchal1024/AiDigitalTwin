// import { agent } from "../services/bluesky.js";
import axios, { all } from "axios";
import CompanyData from "../models/CompanyData.js";

const did = "did:plc:n55bzrqnhhvmf33kt5rmlv3t";

export const getFollowers = async (req, res) => {
  try {
    // const followers = await agent.getFollowers({
    // actor: agent.did,
    // limit: 100
    // });

    const followers = await axios.get(
      `https://public.api.bsky.app/xrpc/app.bsky.graph.getFollowers?actor=${did}&limit=100`
    );

    res.status(200).json({
      followers: followers.data.followers,
      length: followers.data.followers.length,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getReach = async (req, res) => {
  try {
    const response = await axios.get(
      `https://public.api.bsky.app/xrpc/app.bsky.feed.getAuthorFeed?actor=${did}`
    );

    // console.log(response.data.feed);

    const totalLikes = response.data.feed.reduce((acc, item) => {
      return acc + (item.post?.likeCount || 0);
    }, 0);
    res.status(200).json(totalLikes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getReachFeed = async (req, res) => {
  try {
    const response = await axios.get(
      `https://public.api.bsky.app/xrpc/app.bsky.feed.getAuthorFeed?actor=${did}`
    );

    // console.log(response.data.feed);

    res.status(200).json(response.data.feed);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getMyPost = async (req, res) => {
  try {
    const response = await axios.get(
      `https://public.api.bsky.app/xrpc/app.bsky.feed.getAuthorFeed?actor=${did}`
    );
    const answer = response.data.feed;
    const filteredAnswer = answer.filter((item) => !item.reply);
    res.status(200).json(filteredAnswer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
export const getAllTweets = async (req, res) => {
  try {
    const response = await CompanyData.find({});
    const allTweets = response.reduce((acc, company) => {
      company.products.forEach((product) => {
        if (product.tweets && product.tweets.length > 0) {
          acc.push(...product.tweets);
        }
      });
      return acc;
    }, []);
    res.status(200).json(allTweets);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export const getPosts = async (_req, res) => {
  try {
    const response = await CompanyData.find({});
    const allTweets = response.reduce((acc, company) => {
      company.products.forEach((product) => {
        if (product.tweets && product.tweets.length > 0) {
          acc.push(...product.tweets);
        }
      });
      return acc;
    }, []);

    let ans = [];
    for(let i = 0;i<allTweets.length;i++){
      const response2 = await axios.get(
        `https://public.api.bsky.app/xrpc/app.bsky.feed.getPostThread?uri=${allTweets[i].uri}`
      );
      ans.push({
        text: response2.data.thread.post.record.text,
        replyCount: response2.data.thread.post.replyCount,
        likeCount: response2.data.thread.post.likeCount, 
        createdAt: response2.data.thread.post.indexedAt,
        uri: allTweets[i].uri

      });
    }
    res.status(200).json(ans);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
