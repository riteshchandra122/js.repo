// commit.js
import jsonfile from "jsonfile";
import simpleGit from "simple-git";

const git = simpleGit();
const path = "./data.json";

async function run() {
  const { stamps } = await jsonfile.readFile(path);
  for (const { at, msg } of stamps) {
    // write something to activity.txt so the commit isn't empty
    await jsonfile.writeFile("activity.txt", { msg, at }, { spaces: 2 });
    await git.add("activity.txt")
             .commit(msg, { "--date": at });
  }
  await git.push();
  console.log("✅ Pushed all backfilled commits.");
}

run().catch(console.error);
