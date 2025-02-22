# notion-external-img-restorer

Quick &amp; dirty notion integration to fix broken external images

https://developers.notion.com/docs/create-a-notion-integration#create-your-integration-in-notion

Notion integrations do not have access to all pages by default. You need to share them with the integration manually

ex: Share Access on Individual Pages

If you want to grant access only to specific pages, follow these steps:

    Open a page in Notion.
    Click "..." (top right).
    Under "Connection", search for your integration.
    Add to page

The folder "export for notion" contains the original HTML that was imported with into Notion with the correct images

...

Notion seems to interpret relative paths in HTML as external images... which makes sense as a
simple solution but ignores the need people might have when importing HTML that does contain images with local relative paths

- Notion doesn't allow uploading files through their API either (see: https://developers.notion.com/reference/file-object)
- Nor referencing attached files as images using their direct links (https://file.notion.so...)

The only alternative is to either using the UI to manually upload missing images (see: https://developers.notion.com/docs/working-with-files-and-media#files-and-media-hosted-by-notion)

Or host images externally & use the API (see: https://developers.notion.com/reference/file-object#external-file-objects)
(this one probably enforces public images)
