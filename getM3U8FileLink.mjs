import { chromium } from "playwright-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth"

async function GetVideoPlayerLink(videoLink) 
{
    chromium.use(StealthPlugin())
    const browser = await chromium.launch(
        {headless: true}
    )

    const page =  await browser.newPage()

    await page.goto(
        videoLink
    )

    const iframeElement = await page.$('iframe.player_conte');
    const src = await iframeElement.getAttribute('src');

    await browser.close()

    return src
}

async function GetM3U8FileLink(videoPlayerLink) 
{
    chromium.use(StealthPlugin())
    const browser = await chromium.launch(
        {headless: true}
    )

    const page =  await browser.newPage()

    await page.goto(
        videoPlayerLink
    )

    const iframeElement = await page.$('video#video_html5_api source');
    const src = await iframeElement.getAttribute('src');

    await browser.close()

    return src
}

async function GetM3U8Link(videoPageLink) {
    let resultLink = await GetVideoPlayerLink(videoPageLink)
    let resulVideoUrl = await GetM3U8FileLink(resultLink)

    return {urlLink: resulVideoUrl}
}


export { GetM3U8Link }