import { appendFileSync, existsSync, writeFileSync } from "fs";
import moment from "moment";
import simpleGit from "simple-git";

const git = simpleGit();

// Config — change as you like
const DAYS = 365;                // last 365 days
const START_HOUR = 8;            // commit window start
const END_HOUR = 20;             // commit window end (inclusive)

// Bias function: 0–3 commits/day with more zeros/ones (looks natural)
function commitsForDay() {
  const r = Math.random();
  if (r < 0.55) return 0;  // ~55% days empty
  if (r < 0.88) return 1;  // ~33% single
  if (r < 0.98) return 2;  // ~10% double
  return 3;                // ~2% triple
}

function randomTimeInDay(day) {
  const hour = Math.floor(Math.random() * (END_HOUR - START_HOUR + 1)) + START_HOUR;
  const minute = Math.floor(Math.random() * 60);
  const second = Math.floor(Math.random() * 60);
  return moment(day).hour(hour).minute(minute).second(second);
}

async function ensureInitialCommit() {
  // create a tracked file if none yet
  if (!existsSync("activity.txt")) {
    writeFileSync("activity.txt", "Sprinkle log\n");
  }
  // if no commits yet, make one so main exists remotely
  const hasHead = await git.raw(["rev-parse", "--verify", "HEAD"]).then(() => true).catch(() => false);
  if (!hasHead) {
    await git.add(["activity.txt", ".gitignore", "package.json", "package-lock.json"]);
    await git.commit("Initial commit");
    try {
      await git.push(["-u", "origin", "main"]);
    } catch (e) {
      // if remote branch not created yet, the push above will create it
    }
  }
}

async function run() {
  await ensureInitialCommit();

  const startDate = moment().startOf("day").subtract(DAYS - 1, "days");

  for (let i = 0; i < DAYS; i++) {
    const day = moment(startDate).add(i, "days");
    const n = commitsForDay();

    for (let j = 1; j <= n; j++) {
      const ts = randomTimeInDay(day);
      const iso = ts.format("YYYY-MM-DDTHH:mm:ss");

      // Make a tiny change so the commit isn’t empty
      appendFileSync("activity.txt", `${iso} sprinkle #${j}\n`, "utf8");

      // Set dates for this commit (author + committer)
      git.env({ GIT_AUTHOR_DATE: iso, GIT_COMMITTER_DATE: iso });

      await git.add(["activity.txt"]);
      await git.commit(`sprinkle: ${ts.format("YYYY-MM-DD")} #${j}`, { "--date": iso });
    }
  }

  // Push all commits
  await git.push(["origin", "main"]);
  console.log("✅ Finished sprinkling a full year and pushed to origin/main.");
}

run().catch(err => {
  console.error("❌ Error:", err);
  process.exit(1);
});
