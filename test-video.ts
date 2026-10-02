import { config } from "dotenv";
config();
import { indexVideo, askQuestion } from "./src/services/video.service";

async function testVideo() {
  // Try with "What is Next.js?" by Vercel
  const videoId = "Sklc_fQBmcs"; // Next.js 13 in 100 Seconds

  // console.log("1. Indexing video...");
  // await indexVideo(videoId);
  // console.log("Indexing complete.\n");

  console.log("2. Asking related question...");
  const res1 = await askQuestion("What does the app directory do?", videoId);
  console.log("Response:", res1.answer);
  console.log("Sources:", JSON.stringify(res1.sources, null, 2));

  console.log("\n3. Asking unrelated question...");
  const res2 = await askQuestion("What is the capital of France?", videoId);
  console.log("Response:", res2.answer);
  console.log("Sources:", JSON.stringify(res2.sources, null, 2));
}

testVideo().catch(console.error);
