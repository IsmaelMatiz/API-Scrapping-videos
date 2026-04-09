import { chromium } from "playwright-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth"
import { config } from "./config/env.mjs";
import { logScrapeError } from "./utils/scrapeError.mjs";

chromium.use(StealthPlugin())

async function GetMainPage(filters)
{
    let totalBytes = 0;
    let browser;

    try {
        browser = await chromium.launch(
            {
                headless: true,
                // proxy: { 
                //     server: config.proxyServer,
                //     username: config.proxyUserName,
                //     password: config.proxyPassword
                // },
                args: [
                    '--no-sandbox',                  // Obligatorio en Docker/Cloud Run
                    '--disable-setuid-sandbox',      // Obligatorio en Docker/Cloud Run
                    '--disable-dev-shm-usage',       // Evita que el navegador colapse por falta de memoria compartida
                    '--ignore-certificate-errors',
                    '--ignore-certificate-errors-spki-list'
                ]
            }
        )

        const context = await browser.newContext({
            userAgent:
                "Mozilla/5.0 (Linux; Android 10; SM-A505F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0 Mobile Safari/537.36",
            extraHTTPHeaders: {
                "Save-Data": "on", // 🔥 reduce peso
            }
        });

        const page =  await context.newPage()
    
    // BLOQUEO DE RECURSOS
     await page.route("**/*", (route) => {
        const req = route.request();
        const type = req.resourceType();
        const url = req.url();

        // Bloquear TODAS estas categorías
        const blockTypes = ["image", "font", "media", "stylesheet"];
        const blockHosts = [
            "googletagmanager",
            "doubleclick",
            "analytics",
            "facebook",
            "ads",
            "adservice",
            "advert",
            "tracking",
            "cloudflareinsights",
            ".css"
        ];

        // Bloquear imágenes, estilos, fuentes, videos
        if (blockTypes.includes(type)) return route.abort();

        // Bloquear dominios basura o pesados
        if (blockHosts.some(h => url.includes(h))) return route.abort();

        //Scripts no esenciales
        if (type === "script" && !url.includes("jquery")) {
           return route.abort();
        }

        return route.continue();
    })

    // 🔥 Reduce aún más el tamaño del DOM
    await context.setOffline(false);

    // Capturar tamaño de cada respuesta
    page.on("response", async (response) => {
        try {
            const buffer = await response.body();
            totalBytes += buffer.length;
        } catch (e) {}
    });



    await page.goto(
        config.baseUrl+"/directorio?"+dictToQueryString(filters), { waitUntil: "domcontentloaded" }
    )

    const animes = await page.$$eval(
        '.align-items-stretch.mb-3.dir1',(results) => (
            results.slice(0, 20).map((element)=> {
                const title = element.querySelector(".card a div.card-body h5")?.innerText
                if (!title) return null 

                const link = element.querySelector(".card a")?.getAttribute("href")

                const pic = element.querySelector(".card a img.card-img-top")?.getAttribute("src")

                const type = element.querySelector(".card a div.badges span")?.innerText

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

        return animes
    } catch (error) {
        logScrapeError("GetMainPage", error, { filters });
    } finally {
        if (browser) {
            try {
                await browser.close();
            } catch (closeErr) {
                logScrapeError("GetMainPage(browser.close)", closeErr, { filters });
            }
        }
    }
}

function dictToQueryString(params) {
  // Object.entries convierte el diccionario en un array de [clave, valor]
  return Object.entries(params)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join("&");
}


export { GetMainPage }