/**
 * populate-images.js
 *
 * Fetches a real photograph for every Mountain document that has no imageUrl.
 *
 * Strategy (in order):
 *   1. Wikipedia API  — actual photo of that specific mountain (free, no key needed)
 *   2. Unsplash API   — scenic mountain photo by name (requires UNSPLASH_ACCESS_KEY in .env)
 *
 * Usage:
 *   node utility/populate-images.js                  # run for all missing
 *   node utility/populate-images.js --dry-run        # preview without saving
 *   node utility/populate-images.js --limit=20       # process first 20 only
 *   node utility/populate-images.js --overwrite      # re-fetch even if imageUrl already set
 *
 * Requires in .env:
 *   MONGO_URI            (required)
 *   UNSPLASH_ACCESS_KEY  (optional — only needed as fallback)
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import Mountain from "../models/mountain/Mountain.js";

dotenv.config();

// ─── CLI flags ────────────────────────────────────────────────────────────────
const args       = process.argv.slice(2);
const isDryRun   = args.includes("--dry-run");
const overwrite  = args.includes("--overwrite");
const limitArg   = args.find((a) => a.startsWith("--limit="));
const batchLimit = limitArg ? parseInt(limitArg.split("=")[1], 10) : Infinity;

// ─── Config ───────────────────────────────────────────────────────────────────
const WIKI_API          = "https://en.wikipedia.org/w/api.php";
const UNSPLASH_API      = "https://api.unsplash.com/search/photos";
const UNSPLASH_KEY      = process.env.UNSPLASH_ACCESS_KEY;
const DELAY_MS          = 350; // polite delay between requests

// Placeholder images that should be treated as "missing" and replaced
const PLACEHOLDER_URLS = new Set([
    "https://res.cloudinary.com/dlg9y5dfv/image/upload/v1748618269/munros/wotxdqiuzcbum5q6otb2.jpg",
]);

// ─── Helpers ──────────────────────────────────────────────────────────────────
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Query Wikipedia's pageimages API for the mountain's main photo.
 * Returns a thumbnail URL (800 px wide) or null.
 */
async function getWikipediaImage(name) {
    try {
        const params = new URLSearchParams({
            action:      "query",
            titles:      name,
            prop:        "pageimages",
            format:      "json",
            pithumbsize: "800",
            origin:      "*",
        });

        const res = await fetch(`${WIKI_API}?${params}`);
        if (!res.ok) return null;

        const data  = await res.json();
        const pages = data?.query?.pages;
        if (!pages) return null;

        const page = Object.values(pages)[0];

        // Reject placeholder / generic icons
        const url = page?.thumbnail?.source ?? null;
        if (url && url.includes("Question_mark")) return null;

        return url;
    } catch {
        return null;
    }
}

/**
 * Query Unsplash for a scenic photo matching the mountain name.
 * Returns the "regular" sized image URL or null.
 * Requires UNSPLASH_ACCESS_KEY in .env.
 */
async function getUnsplashImage(name) {
    if (!UNSPLASH_KEY) return null;

    try {
        const params = new URLSearchParams({
            query:       `${name} mountain scotland`,
            per_page:    "1",
            orientation: "landscape",
        });

        const res = await fetch(`${UNSPLASH_API}?${params}`, {
            headers: { Authorization: `Client-ID ${UNSPLASH_KEY}` },
        });
        if (!res.ok) return null;

        const data = await res.json();
        return data?.results?.[0]?.urls?.regular ?? null;
    } catch {
        return null;
    }
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
    if (!process.env.MONGO_URI) {
        console.error("Missing MONGO_URI in .env");
        process.exit(1);
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB\n");

    // Find mountains to process
    const placeholderList = [...PLACEHOLDER_URLS];
    const filter = overwrite
        ? {}
        : {
              $or: [
                  { imageUrl: null },
                  { imageUrl: "" },
                  { imageUrl: { $exists: false } },
                  { imageUrl: { $in: placeholderList } },
              ],
          };

    const mountains = await Mountain.find(filter).select("_id name").lean();
    const toProcess =
        batchLimit < Infinity ? mountains.slice(0, batchLimit) : mountains;

    console.log(
        `Mountains without images : ${mountains.length}` +
        (batchLimit < Infinity ? `\nProcessing first        : ${toProcess.length}` : "") +
        (isDryRun ? "\nMode                    : DRY RUN (no changes saved)" : "") +
        "\n" + "─".repeat(60)
    );

    let updated  = 0;
    let notFound = 0;
    let skipped  = 0;

    for (const mountain of toProcess) {
        // 1. Try Wikipedia
        let imageUrl = await getWikipediaImage(mountain.name);
        let source   = "wikipedia";

        // 2. Fall back to Unsplash
        if (!imageUrl) {
            imageUrl = await getUnsplashImage(mountain.name);
            source   = "unsplash";
        }

        if (imageUrl) {
            if (!isDryRun) {
                await Mountain.findByIdAndUpdate(mountain._id, { imageUrl });
            }
            console.log(`✓ [${source.padEnd(9)}] ${mountain.name}`);
            console.log(`             ${imageUrl}\n`);
            updated++;
        } else {
            console.log(`✗ [not found] ${mountain.name}\n`);
            notFound++;
        }

        await sleep(DELAY_MS);
    }

    const skippedCount = mountains.length - toProcess.length;

    console.log("─".repeat(60));
    console.log(`Updated   : ${updated}`);
    console.log(`Not found : ${notFound}`);
    if (skippedCount > 0) console.log(`Skipped (limit) : ${skippedCount}`);
    if (isDryRun) console.log("\n⚠️  Dry run — no changes were saved to MongoDB.");

    await mongoose.disconnect();
}

main().catch((err) => {
    console.error("Fatal error:", err);
    process.exit(1);
});
