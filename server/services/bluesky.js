import { AtpAgent } from "@atproto/api";
import * as dotenv from "dotenv";
import * as process from "process";

dotenv.config();

// Create and export the Bluesky Agent
const agent = new AtpAgent({
  service: "https://bsky.social",
});

await agent.login({
  identifier: process.env.BSKY_IDENTIFIER,
  password: process.env.BSKY_PASSWORD,
});


// // Example main function kept for reference/testing
// async function main() {


//   // const res = await agent.post({
//   //   text: "🙂",
//   // });

//   // {
//   //   uri: 'at://did:plc:asih6sgpr6avgvczz3vxgfqt/app.bsky.feed.post/3lfz7dwfiul23',
//   //   cid: 'bafyreianm5ntcsa3gzawbhv5ewbw4p52zaqgqokx5matb2vkef74xk5qpu',
//   //   commit: {
//   //     cid: 'bafyreidi4gel4mmpafi6dzrkphrujqlrbdrjtoxaewqgk4otrgytkqyane',
//   //     rev: '3lfz7dwfoq323'
//   //   },
//   //   validationStatus: 'valid'
//   // }

//   // const res = await agent.getFollowers({
//   //   actor: agent.did,
//   //   limit: 100
//   // });

//   // const res2 = await agent.getPosts({
//   //   uris: ["at://did:plc:asih6sgpr6avgvczz3vxgfqt/app.bsky.feed.post/3lfz7dwfiul23"]
//   // })

//   // console.log("Just posted!");
//   // console.log(agent.did);
//   // // console.dir(res2.data.posts[0]);
//   // console.dir(res.data.followers.length);
// }

// main();

export { agent };