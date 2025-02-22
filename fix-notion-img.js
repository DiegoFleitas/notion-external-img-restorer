import axios from "axios";
import dotenv from "dotenv";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const NOTION_API_KEY = process.env.NOTION_API_KEY;
const IMG_BASE_FILE_PATH = "export for notion/_resources/";

const HEADERS = {
    Authorization: `Bearer ${NOTION_API_KEY}`,
    "Notion-Version": "2022-06-28",
    "Content-Type": "application/json",
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Step 1: Get all pages in the workspace
const getAllPages = async () => {
    try {
        const response = await axios.post(
            "https://api.notion.com/v1/search",
            // {},
            { filter: { value: "page", property: "object" } },
            { headers: HEADERS }
        );
        // console.debug("Response from Notion API:", JSON.stringify(response.data, null, 2));

        return response.data.results;
    } catch (error) {
        console.error("Error fetching pages:", error.response?.data || error);
        return [];
    }
};

// Step 2: Get blocks from a given page
const getBlocks = async (pageId) => {
    try {
        const url = `https://api.notion.com/v1/blocks/${pageId}/children`;
        const response = await axios.get(url, { headers: HEADERS });

        // console.debug("Response from Notion API:", JSON.stringify(response.data, null, 2));

        return response.data.results;
    } catch (error) {
        console.error("Error fetching blocks:", error.response?.data || error);
        return [];
    }
};

// Step 3: Replace broken image
const replaceImage = async (blockId, oldUrl, dryRun) => {
    // ex: Audio Troubleshoot
    // ../_resources/f945230e26284a0aa0dbc64d78b6f4de.png (API response)
    // to
    // ../_resources/f945230e26284a0aa0dbc64d78b6f4de.png (HTML relative path)
    // _resources/f945230e26284a0aa0dbc64d78b6f4de.png (script relative path)

    const scriptRelativePath = oldUrl.replace(/^.*_resources\//, '');
    const absolutePath = path.resolve(IMG_BASE_FILE_PATH, scriptRelativePath);
    console.debug("Absolute path:", absolutePath);
    const imageData = fs.readFileSync(absolutePath);

    const newUrl = `data:image/png;base64,${imageData.toString('base64')}`;

    try {
        const url = `https://api.notion.com/v1/blocks/${blockId}`;
        const data = {
            image: {
                type: "external",
                external: { url: newUrl },
            },
        };

        if (!dryRun) {
            await axios.patch(url, data, { headers: HEADERS });
        } else {
            console.debug("Dry run: Would have updated image:", oldUrl, newUrl);
        }


        console.log(`Updated image block: ${blockId}`);
    } catch (error) {
        console.error("Error updating image:", error.response?.data || error);
    }
};

// Main function to scan and fix images
const main = async (dryRun = false) => {
    let brokenImages = {};
    const pages = await getAllPages();

    for (const page of pages) {
        // console.debug(`Checking page: ${page.id}`);
        let imageCount = 0;
        let brokenImageCount = 0;

        const blocks = await getBlocks(page.id);
        for (const block of blocks) {
            if (block.type === "image" && block.image.type === "file") {
                // console.debug(`Found broken image in page ${page.url}, block ${block.id}, url: ${block.image.file.url}`);
                imageCount++;
            } else if (block.type === "image" && block.image.type === "external") {

                // console.debug(`Found broken image in page ${page.url}, block ${block.id}, url: ${block.image.file.url}`);
                if (!brokenImages[block.id]) {
                    brokenImages[block.id] = [block.image.external.url];
                } else {
                    brokenImages[block.id].push(block.image.external.url);
                }

                brokenImageCount++;
                await replaceImage(block.id, block.image.external.url, dryRun);
            } else {
                // console.debug(`Skipping block ${block.id}, type: ${block.type}`);
            }
        }

        if (imageCount > 0) {
            console.log(`Page ${page.url} has ${imageCount} images.`);
        }

        if (brokenImageCount > 0) {
            console.log(`Page ${page.url} has ${brokenImageCount} BROKEN images.`);
        }
    }

    console.log("Image replacement process completed!", pages.length);
};

// Execute main function
main(true); // Pass true for dry run, false for actual replacement