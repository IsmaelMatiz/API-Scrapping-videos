import { chromium } from "playwright-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth"
import { config } from "./config/env.mjs";

async function GetVideoPlayerLink(videoLink) 
{
    let totalBytes = 0;

    chromium.use(StealthPlugin())
    const browser = await chromium.launch(
        {
            headless: true,
            // proxy: { 
            //     server: config.proxyServer,
            //     username: config.proxyUserName,
            //     password: config.proxyPassword
            // }
        }
    )

    const page =  await browser.newPage()

    // BLOQUEO DE RECURSOS
     await page.route("**/*", (route) => {
        const req = route.request();
        const type = req.resourceType();
        const url = req.url();

        // Bloquear imágenes, estilos, fuentes, videos
        if (
            type === "image" ||
            type === "stylesheet" ||
            type === "font" ||
            type === "media"
        ) {
            return route.abort();
        }

        // Bloquear dominios basura o pesados
        if (
            url.includes("googletagmanager") ||
            url.includes("doubleclick") ||
            url.includes("analytics") ||
            url.includes("facebook") ||
            url.includes("advert") ||
            url.includes("tracker") ||
            url.includes("cloudflareinsights")
        ) {
            return route.abort();
        }

        //Scripts no esenciales
        if (type === "script" && !url.includes("jquery")) {
           return route.abort();
        }

        return route.continue();
    })

    // Capturar tamaño de cada respuesta
    page.on("response", async (response) => {
        try {
            const buffer = await response.body();
            totalBytes += buffer.length;
        } catch (e) {}
    });

    await page.goto(
        videoLink
    )

    const iframeElement = await page.$('iframe.player_conte');
    const src = await iframeElement.getAttribute('src');

    await browser.close()

    const jsonStr = JSON.stringify(src);
    const jsonBytes = Buffer.byteLength(jsonStr, "utf8");

    const totalMB = totalBytes / (1024 * 1024);
    const jsonMB = jsonBytes / (1024 * 1024);

    const totalFinal = (totalMB + jsonMB).toFixed(4);

    console.log("TOTAL DESCARGADO:", totalFinal, "MB");

    return src
}

async function GetM3U8FileLink(videoPlayerLink) 
{
    let totalBytes = 0;

    chromium.use(StealthPlugin())
    const browser = await chromium.launch(
        {
            headless: true,
            // proxy: { 
            //     server: config.proxyServer,
            //     username: config.proxyUserName,
            //     password: config.proxyPassword
            // }
        }
    )

    const page =  await browser.newPage()

    // BLOQUEO DE RECURSOS
     await page.route("**/*", (route) => {
        const req = route.request();
        const type = req.resourceType();
        const url = req.url();

        // Bloquear imágenes, estilos, fuentes, videos
        if (
            type === "image" ||
            type === "stylesheet" ||
            type === "font"
        ) {
            return route.abort();
        }

        // Bloquear dominios basura o pesados
        if (
            url.includes("googletagmanager") ||
            url.includes("doubleclick") ||
            url.includes("analytics") ||
            url.includes("facebook") ||
            url.includes("advert") ||
            url.includes("tracker") ||
            url.includes("cloudflareinsights") || 
            url.endsWith(".css")
        ) {
            return route.abort();
        }

        //Scripts no esenciales
        // if (type === "script" && !url.includes("jquery") && !url.includes("main")) {
        //    return route.abort();
        // }

        return route.continue();
    })

    // Capturar tamaño de cada respuesta
    page.on("response", async (response) => {
        try {
            const buffer = await response.body();
            totalBytes += buffer.length;
        } catch (e) {}
    });

    await page.goto(
        videoPlayerLink
    )

    const iframeElement = await page.$('video#video_html5_api source');
    const src = await iframeElement.getAttribute('src');

    //await browser.close()

    const jsonStr = JSON.stringify(src);
    const jsonBytes = Buffer.byteLength(jsonStr, "utf8");

    const totalMB = totalBytes / (1024 * 1024);
    const jsonMB = jsonBytes / (1024 * 1024);

    const totalFinal = (totalMB + jsonMB).toFixed(4);

    console.log("TOTAL DESCARGADO:", totalFinal, "MB");

    return src
}

async function GetM3U8Link(videoPageLink) {
    let resultLink = await GetVideoPlayerLink(videoPageLink)
    let resulVideoUrl = await GetM3U8FileLink(resultLink)

    return {urlLink: resulVideoUrl}
}


export { GetM3U8Link }