import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import Mountain from "./models/mountain/Mountain.js";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;
const BACKUP_DIR = "./backups";

const args = process.argv.slice(2);
const shouldBackup = args.includes("--backup");
const shouldDedupe = args.includes("--dedupe");
const restoreIndex = args.indexOf("--restore");
const restoreFile = restoreIndex !== -1 ? args[restoreIndex + 1] : null;
const isDryRun = args.includes("--dry-run");

async function connectDB() {
    if (!MONGO_URI) {
        console.error("Missing MONGO_URI in environment");
        process.exit(1);
    }
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB");
}

async function createBackup() {
    console.log("Creating backup...");

    if (!fs.existsSync(BACKUP_DIR)) {
        fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }

    const mountains = await Mountain.find({}).lean();

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filePath = path.join(BACKUP_DIR, `mountains-backup-${timestamp}.json`);

    fs.writeFileSync(filePath, JSON.stringify(mountains, null, 2));
    console.log(`Backup saved to: ${filePath}`);
}

async function restoreBackup(filePath) {
    if (!filePath) {
        console.error("Please provide a backup file path after --restore");
        process.exit(1);
    }

    if (!fs.existsSync(filePath)) {
        console.error("Backup file not found:", filePath);
        process.exit(1);
    }

    console.log(`Restoring from ${filePath}...`);

    const rawData = fs.readFileSync(filePath, "utf8");
    const mountains = JSON.parse(rawData);

    if (!Array.isArray(mountains)) {
        console.error("Invalid backup format: expected an array");
        process.exit(1);
    }

    if (!isDryRun) {
        await Mountain.deleteMany({});
        await Mountain.insertMany(mountains);
    }

    console.log(
        isDryRun
            ? "Dry run complete (no changes made)"
            : `Restore complete. Inserted ${mountains.length} documents.`
    );
}

/**
 * Normalize category field that might be:
 *  - undefined/null
 *  - a string
 *  - an array of strings
 */
function normalizeCategories(cat) {
    if (!cat) return [];
    if (Array.isArray(cat)) return cat.filter(Boolean).map(String);
    return [String(cat)];
}

/**
 * Dedupe mountains where name AND height match.
 * Merge categories into the primary doc, delete the rest.
 */
async function dedupeMountainsByNameAndHeight() {
    console.log("Starting deduplication by (name + height)...");

    // Group by name+height and find groups with > 1 doc
    const groups = await Mountain.aggregate([
        {
            $match: {
                name: { $ne: null },
                height: { $ne: null },
            },
        },
        {
            $group: {
                _id: { name: "$name", height: "$height" },
                ids: { $push: "$_id" },
                count: { $sum: 1 },
            },
        },
        { $match: { count: { $gt: 1 } } },
    ]);

    console.log(`Found ${groups.length} duplicate groups`);

    for (const g of groups) {
        const { name, height } = g._id;

        // Fetch all docs in this duplicate group
        const mountains = await Mountain.find({ _id: { $in: g.ids } });

        if (mountains.length < 2) continue;

        // Oldest as primary
        mountains.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        const primary = mountains[0];
        const toRemove = mountains.slice(1);

        // Merge categories from all docs, unique
        const mergedCategories = [
            ...new Set(mountains.flatMap((m) => normalizeCategories(m.category))),
        ];

        // Optional: only do work if there is actually something to merge/remove
        // (still removes duplicates even if categories identical)
        if (!isDryRun) {
            primary.category = mergedCategories;
            await primary.save();

            const removeIds = toRemove.map((m) => m._id);
            await Mountain.deleteMany({ _id: { $in: removeIds } });
        }

        console.log(
            `Processed "${name}" (${height}m) → removed ${toRemove.length} duplicate(s), categories: [${mergedCategories.join(
                ", "
            )}]`
        );
    }

    console.log(isDryRun ? "Dry run complete (no changes made)" : "Deduplication complete");
}

async function main() {
    try {
        await connectDB();

        if (restoreFile) {
            await restoreBackup(restoreFile);
            process.exit(0);
        }

        if (shouldBackup) {
            await createBackup();
        }

        if (shouldDedupe) {
            await dedupeMountainsByNameAndHeight();
        }

        if (!shouldBackup && !shouldDedupe && !restoreFile) {
            console.log(`
        Usage:

        node mountainMaintenance.js --backup
        node mountainMaintenance.js --dedupe
        node mountainMaintenance.js --backup --dedupe
        node mountainMaintenance.js --restore ./backups/file.json
        node mountainMaintenance.js --dedupe --dry-run
      `);
        }

        process.exit(0);
    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
}

main();