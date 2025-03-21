import { Schema, model } from "mongoose";

const TweetSchema = new Schema({
  uri: {
    type: String,
    required: true,
  },
  cid: {
    type: String,
    required: true,
  },
});

const ProductSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  targetedAudience: {
    type: String,
    trim: true,
  },
  category: [
    {
      type: String,
      trim: true,
    },
  ],
  isActive: {
    type: Boolean,
    default: true,
  },
  tweets: [TweetSchema],
});

const ComplaintSchema = new Schema({
  tweetUser: {
    type: String,
    required: true,
  },
  tweetId: {
    type: String,
    required: true,
  },
  query: {
    type: String,
    trim: true,
    required: true,
  },
  queryTitle: {
    type: String,
  },
  querySummary: {
    type: String,
    trim: true,
  },
  status: {
    type: String,
    default: "Not Reviewed",
    enum: ["Not Reviewed", "Completed", "Will not be resolved"],
  },
  score: {
    type: Number,
    default: 0,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const companyDataSchema = new Schema(
  {
    companyEmail: {
      type: String,
      required: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    companyName: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    industry: {
      type: String,
      required: true,
      trim: true,
    },
    website: {
      type: String,
      trim: true,
    },
    products: [ProductSchema],
    complaints: [ComplaintSchema],
  },
  {
    collection: "CompanyData",
    timestamps: true,
  }
);

const CompanyData = model("CompanyData", companyDataSchema);

export default CompanyData;
