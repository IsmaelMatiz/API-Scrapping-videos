import { chromium } from "playwright-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth"
import { config } from "./config/env.mjs";
import { logScrapeError } from "./utils/scrapeError.mjs";

async function GetVideoPlayerLink(videoLink) 
{
    let totalBytes = 0;
    let browser; // Lo declaramos afuera para asegurar que podamos cerrarlo al final

    // ... justo antes del try
    console.log("PROXY CONFIG:", config.proxyServer ? "HAY PROXY" : "NO HAY PROXY");
    try {
        chromium.use(StealthPlugin())
        
        browser = await chromium.launch({
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
        });

        const page = await browser.newPage();

        // --- 🔥 INICIO PRUEBA DE IP 🔥 ---
        try {
            console.log("🔍 Verificando IP de salida a través del proxy...");
            // Usamos ipify que es súper rápido y no tiene bloqueos anti-bots
            const responseIp = await page.goto('https://api.ipify.org?format=json', { timeout: 15000 });
            const ipData = await responseIp.json();
            console.log("✅ ÉXITO! LA IP QUE VE EL MUNDO ES:", ipData.ip);
        } catch (ipError) {
            console.log("❌ ERROR: NO PUDE NI SIQUIERA VER MI IP. EL PROXY ME ESTÁ BLOQUEANDO.");
            console.log("Detalle del error del proxy:", ipError.message);
        }
        // --- 🔥 FIN PRUEBA DE IP 🔥 ---

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
        // if (type === "script" && !url.includes("jquery")) {
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
        videoLink,
        {
            timeout: 90000, // 90 segundos en milisegundos
            waitUntil: "domcontentloaded" // opcional, puedes ajustar a "networkidle" si lo prefieres
        }
    )

    // 🔥 AGREGA ESTO AQUÍ: Vamos a ver qué página cargó realmente
    const tituloPagina = await page.title();
    console.log("TÍTULO DE LA PÁGINA VISTA POR PLAYWRIGHT:", tituloPagina);

    const iframeElement = await page.waitForSelector('iframe.player_conte', { state: 'attached', timeout: 15000 });
    const src = await iframeElement.getAttribute('src');

    if (!src) {
        throw new Error("Se encontró el iframe pero no tiene atributo src");
    }

    const jsonStr = JSON.stringify(src);
    const jsonBytes = Buffer.byteLength(jsonStr, "utf8");

    const totalMB = totalBytes / (1024 * 1024);
    const jsonMB = jsonBytes / (1024 * 1024);

    const totalFinal = (totalMB + jsonMB).toFixed(4);

    console.log("TOTAL DESCARGADO:", totalFinal, "MB");

        return src
    } catch (error) {
        logScrapeError("GetVideoPlayerLink", error, { videoLink });
    } finally {
        if (browser) {
            try {
                await browser.close();
            } catch (closeErr) {
                logScrapeError("GetVideoPlayerLink(browser.close)", closeErr, { videoLink });
            }
        }
    }

}

async function GetM3U8FileLink(videoPlayerLink) 
{
    let totalBytes = 0;
    let browser;

    try {
        chromium.use(StealthPlugin())
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

        const page =  await browser.newPage()

    // BLOQUEO DE RECURSOS
    //  await page.route("**/*", (route) => {
    //     const req = route.request();
    //     const type = req.resourceType();
    //     const url = req.url();

    //     // Bloquear imágenes, estilos, fuentes, videos
    //     if (
    //         type === "image" ||
    //         type === "stylesheet" ||
    //         type === "font"
    //     ) {
    //         return route.abort();
    //     }

    //     // Bloquear dominios basura o pesados
    //     if (
    //         url.includes("googletagmanager") ||
    //         url.includes("doubleclick") ||
    //         url.includes("analytics") ||
    //         url.includes("facebook") ||
    //         url.includes("advert") ||
    //         url.includes("tracker") ||
    //         url.includes("cloudflareinsights") || 
    //         url.endsWith(".css")
    //     ) {
    //         return route.abort();
    //     }

    //     //Scripts no esenciales
    //     // if (type === "script" && !url.includes("jquery") && !url.includes("main")) {
    //     //    return route.abort();
    //     // }

    //     return route.continue();
    // })

    // Capturar tamaño de cada respuesta
    page.on("response", async (response) => {
        try {
            const buffer = await response.body();
            totalBytes += buffer.length;
        } catch (e) {}
    });

    await page.goto(
        videoPlayerLink,
        {
            timeout: 90000, // 90 segundos en milisegundos
            waitUntil: "domcontentloaded" // opcional, puedes ajustar a "networkidle" si lo prefieres
        }
    )

    // 1. Localizar el video y simular click derecho
  const video = await page.locator('.dplayer-video-wrap');
  await video.click({ button: 'right' }); // click derecho
  await page.waitForTimeout(500); // medio segundo de espera

  // 2. Esperar a que aparezca el popup
  await page.waitForSelector('div.dplayer-menu', { state: 'visible' });
  await page.waitForTimeout(500); // medio segundo de espera

  // 3. Click en el primer item del menú
  const firstItem = page.locator('div.dplayer-menu div.dplayer-menu-item').first();
  await firstItem.click();
  await page.waitForTimeout(500); // medio segundo de espera

  // 4. Tomar el texto del span
  const src = await page.locator('div.dplayer-info-panel-item-url span.dplayer-info-panel-item-data').innerText();

        const jsonStr = JSON.stringify(src);
        const jsonBytes = Buffer.byteLength(jsonStr, "utf8");

        const totalMB = totalBytes / (1024 * 1024);
        const jsonMB = jsonBytes / (1024 * 1024);

        const totalFinal = (totalMB + jsonMB).toFixed(4);

        console.log("TOTAL DESCARGADO:", totalFinal, "MB");

        return src
    } catch (error) {
        logScrapeError("GetM3U8FileLink", error, { videoPlayerLink });
    } finally {
        if (browser) {
            try {
                await browser.close();
            } catch (closeErr) {
                logScrapeError("GetM3U8FileLink(browser.close)", closeErr, { videoPlayerLink });
            }
        }
    }
}

async function GetM3U8Link(videoPageLink) {
    let resultLink = await GetVideoPlayerLink(videoPageLink)

    // Validamos que el primer paso haya devuelto una URL real
    if (!resultLink) {
        throw new Error("No se pudo obtener el link del reproductor en el primer paso.");
    }

    let resulVideoUrl = await GetM3U8FileLink(resultLink)

    return {urlLink: resulVideoUrl}
}


export { GetM3U8Link }