const express = require("express");
const router = express.Router();

const IG_USER_AGENT =
  "Instagram 241.0.0.17.118 (iPhone13,2; iOS 16_2; en_US; en-US; scale=3.00; 1170x2532; 389533639)";
const IG_PROFILE_URL = "https://www.instagram.com/api/v1/users/web_profile_info/?username=starcast.id";

// Image proxy endpoint
router.get("/image/:encodedUrl", async (req, res) => {
  try {
    const encodedUrl = decodeURIComponent(req.params.encodedUrl || "");
    const imageUrl = Buffer.from(encodedUrl, "base64").toString("utf-8");

    if (!imageUrl || !/^https?:\/\//i.test(imageUrl)) {
      return res.status(400).json({ error: "Invalid encoded image URL" });
    }

    const response = await fetch(imageUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
      },
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("Instagram image fetch failed", response.status, text.slice(0, 250));
      return res.status(response.status).json({ error: "Failed to fetch image" });
    }

    res.setHeader("Content-Type", response.headers.get("content-type") || "image/jpeg");
    res.setHeader("Cache-Control", "public, max-age=2592000");
    res.setHeader("Access-Control-Allow-Origin", "*");
    const buffer = await response.arrayBuffer();
    res.send(Buffer.from(buffer));
  } catch (err) {
    console.error("Image proxy error:", err);
    res.status(500).json({ error: "Image proxy failed" });
  }
});

router.get("/", async (req, res) => {
  try {
    const response = await fetch(IG_PROFILE_URL, {
      headers: {
        "User-Agent": IG_USER_AGENT,
        Accept: "application/json, text/plain, */*",
      },
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("Instagram fetch failed", response.status, text.slice(0, 500));
      return res.status(502).json({ error: "Failed to fetch Instagram feed" });
    }

    const payload = await response.json();
    const user = payload?.data?.user;

    if (!user || !user.edge_owner_to_timeline_media?.edges) {
      return res.status(502).json({ error: "Instagram feed data unavailable" });
    }

    const posts = user.edge_owner_to_timeline_media.edges
      .map((edge) => {
        const node = edge.node || {};
        const imageUrl =
          node.display_url ||
          node.thumbnail_src ||
          node.thumbnail_resources?.at(-1)?.src ||
          node.media_preview ||
          null;

        return imageUrl
          ? {
              id: node.id,
              image_url: `/api/instagram/image/${encodeURIComponent(Buffer.from(imageUrl).toString("base64"))}`,
              shortcode: node.shortcode,
              caption: node.edge_media_to_caption?.edges?.[0]?.node?.text || "",
              is_video: node.is_video,
              post_url: `https://www.instagram.com/p/${node.shortcode}/`,
            }
          : null;
      })
      .filter(Boolean)
      .slice(0, 6);

    res.json({
      profile_pic: user.profile_pic_url_hd || user.profile_pic_url || null,
      username: user.username,
      posts,
    });
  } catch (err) {
    console.error("Instagram route error", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
