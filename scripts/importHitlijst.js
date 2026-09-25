#!/usr/bin/env node
import "dotenv/config";
import inquirer from "inquirer";
import yargs from "yargs/yargs";
import { hideBin } from "yargs/helpers";
import { importHitlijstCsv } from "../controllers/importController.js";
import { logger } from "../config/logger.js";

const argv = yargs(hideBin(process.argv))
  .option("hitlijst", { type: "string", describe: "hl_hitlijst" })
  .option("uitzendjaar", { type: "number", describe: "hl_uitzendjaar" })
  .option("file", { type: "string", describe: "Path to CSV file to import" })
  .option("filename", { type: "string", describe: "fd_file_name (stored name/label)" })
  .help()
  .parse();

async function promptIfMissing() {
  const questions = [];

  if (!argv.hitlijst) {
    questions.push({ name: "hitlijst", message: "Hitlijst name (hl_hitlijst):", type: "input" });
  }
  if (!argv.uitzendjaar) {
    questions.push({ name: "uitzendjaar", message: "Uitzendjaar (hl_uitzendjaar):", type: "number" });
  }
  if (!argv.file) {
    questions.push({ name: "file", message: "CSV file path to import:", type: "input" });
  }
  if (!argv.filename) {
    questions.push({
      name: "filename",
      message: "File name label to store (fd_file_name):",
      type: "input",
      default: argv.file ? argv.file.split("/").pop() : undefined
    });
  }

  const answers = questions.length ? await inquirer.prompt(questions) : {};
  return {
    hl_hitlijst: argv.hitlijst ?? answers.hitlijst,
    hl_uitzendjaar: argv.uitzendjaar ?? answers.uitzendjaar,
    filePath: argv.file ?? answers.file,
    fd_file_name: argv.filename ?? answers.filename
  };
}

function printTable(rows, max = 25) {
  const slice = rows.slice(0, max).map((r) => ({
    hl_hitlijst: r.hl_hitlijst,
    hl_uitzendjaar: r.hl_uitzendjaar,
    hl_positie: r.hl_positie,
    hl_artiest: r.hl_artiest,
    hl_titel_song: r.hl_titel_song,
    hl_jaar: r.hl_jaar,
    fd_file_name: r.fd_file_name,
    hl_discogs_link: r.hl_discogs_link
  }));
  console.table(slice);
  if (rows.length > max) console.log(`(Showing first ${max} of ${rows.length} rows)`);
}

(async () => {
  try {
    const input = await promptIfMissing();

    const { summary, rows } = await importHitlijstCsv(input);

    console.log("\n=== IMPORT SUMMARY ===");
    console.log(summary);

    console.log("\n=== IMPORTED ROWS (sample) ===");
    printTable(rows);

    console.log(
      `\nOpen in browser:\n` +
      `http://localhost:${process.env.PORT || 3001}/staging?hl_hitlijst=${encodeURIComponent(input.hl_hitlijst)}` +
      `&hl_uitzendjaar=${encodeURIComponent(input.hl_uitzendjaar)}` +
      `&fd_file_name=${encodeURIComponent(input.fd_file_name)}`
    );
  } catch (err) {
    logger.error("CLI import failed", { message: err.message, stack: err.stack });
    console.error(err);
    process.exitCode = 1;
  }
})();
