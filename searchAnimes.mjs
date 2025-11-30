import { chromium } from "playwright-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth"
import { config } from "./config/env.mjs";

chromium.use(StealthPlugin())

async function GetResultSearch(inputSearch) 
{
    inputSearch.replaceAll(" ","%20")
    let totalBytes = 0;
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

        return route.continue();
    });

    // Capturar tamaño de cada respuesta
    page.on("response", async (response) => {
        try {
            const buffer = await response.body();
            totalBytes += buffer.length;
        } catch (e) {}
    });

    await page.goto(
        config.baseUrl+"/buscar/"+inputSearch, { waitUntil: "domcontentloaded" }
    )

    const animes = await page.$$eval(
        '.anime__item',(results) => (
            results.map((element)=> {
                const title = element.querySelector(".anime__item__text h5 a")?.innerText

                if (!title) return null 

                const link = element.querySelector(".anime__item__text h5 a")?.getAttribute("href")

                const pic = element.querySelector("a div")?.getAttribute("data-setbg")

                const type = element.querySelector(".anime__item__text ul li.anime")?.innerText

                return {title, link, pic, type}
            })
        )
    )

    const jsonStr = JSON.stringify(animes);
    const jsonBytes = Buffer.byteLength(jsonStr, "utf8");

    const totalMB = totalBytes / (1024 * 1024);
    const jsonMB = jsonBytes / (1024 * 1024);

    const totalFinal = (totalMB + jsonMB).toFixed(4);

    console.log("TOTAL DESCARGADO:", totalFinal, "MB");
    
    await browser.close()

    return animes
}

export { GetResultSearch }