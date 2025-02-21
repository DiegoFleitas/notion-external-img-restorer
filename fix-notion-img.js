import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const NOTION_API_KEY = process.env.NOTION_API_KEY;
const NEW_IMAGE_URL = process.env.NEW_IMAGE_URL; // Change accordingly

const HEADERS = {
    Authorization: `Bearer ${NOTION_API_KEY}`,
    "Notion-Version": "2022-06-28",
    "Content-Type": "application/json",
};

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
const replaceImage = async (blockId, newUrl) => {
    try {
        const url = `https://api.notion.com/v1/blocks/${blockId}`;
        const data = {
            image: {
                type: "external",
                external: { url: newUrl },
            },
        };
        await axios.patch(url, data, { headers: HEADERS });
        console.log(`Updated image block: ${blockId}`);
    } catch (error) {
        console.error("Error updating image:", error.response?.data || error);
    }
};

// Main function to scan and fix images
const main = async (dryRun = false) => {
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
                // if (!dryRun) {
                //     await replaceImage(block.id, NEW_IMAGE_URL);
                // }
            } else if (block.type === "image" && block.image.type === "external") {
                // console.debug(`Found broken image in page ${page.url}, block ${block.id}, url: ${block.image.file.url}`);
                brokenImageCount++;
                if (!dryRun) {
                    await replaceImage(block.id, NEW_IMAGE_URL);
                }
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