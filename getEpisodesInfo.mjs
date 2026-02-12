import { chromium } from "playwright-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth"
import { config } from "./config/env.mjs";

async function GetEpisodesList(animeSelected) 
{
    let totalBytes = 0;
    chromium.use(StealthPlugin())
    const browser = await chromium.launch(
        {
            headless: true,
            proxy: 
            { 
                server: config.proxyServer,
                username: config.proxyUserName,
                password: config.proxyPassword
            }
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
            url.includes("cloudflareinsights") || 
            url.endsWith(".css")
        ) {
            return route.abort();
        }

        //Scripts no esenciales
        if (type === "script" && !url.includes("jquery") && !url.includes("main")) {
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
        animeSelected
    )

    await page.waitForSelector('.epcontent')

    const animeDescription = await page.$eval(
        "div.anime_info p.scroll",
        el => el.innerText
    )


    const episodes = await page.$$eval(
        '.epcontent',(results) => (
            results.map((element)=> {
                const title = element.querySelector(".anime__item div.anime__item__pic .anime__item__text ul li span")?.innerText.replaceAll("\"","")

                if (!title) return null 

                const link = element.querySelector(".anime__item")?.getAttribute("href")

                const pic = element.querySelector(".anime__item div.anime__item__pic")?.getAttribute("data-setbg")

                return {title, link, pic}
            })
        )
    )

    const pagination = await page.$$eval(
        'select.anime__pagination option', (results) => (
            results.map((element)=>{
                const pagId = element.getAttribute("value")

                const pagFromTo = element?.innerText

                return {pagId, pagFromTo}
            })
        )
    )

    //await browser.close()

    const jsonStr = JSON.stringify(pagination);
    const jsonBytes = Buffer.byteLength(jsonStr, "utf8");

    const jsonStr2 = JSON.stringify(episodes);
    const jsonBytes2 = Buffer.byteLength(jsonStr2, "utf8");

    const totalMB = totalBytes / (1024 * 1024);
    const jsonMB = jsonBytes / (1024 * 1024);
    const jsonMB2 = jsonBytes2 / (1024 * 1024);

    const totalFinal = (totalMB + jsonMB + jsonMB2).toFixed(4);

    console.log("TOTAL DESCARGADO:", totalFinal, "MB");

    return {animeDescription,episodes, pagination}
}

async function GetEpisodesListByPag(animeSelected,paginationSelected) 
{
    let totalBytes = 0;
    
    chromium.use(StealthPlugin())
    const browser = await chromium.launch(
        {
            headless: true,
            proxy: 
            { 
                server: config.proxyServer,
                username: config.proxyUserName,
                password: config.proxyPassword
            }
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
            url.includes("cloudflareinsights") || 
            url.endsWith(".css")
        ) {
            return route.abort();
        }

        //Scripts no esenciales
        if (type === "script" && !url.includes("jquery") && !url.includes("main")) {
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
        animeSelected
    )    
    
    // Esperar a que el select esté en el DOM
    await page.waitForSelector("div.anime_bar");

    console.log(`➡️ Seleccionando ${paginationSelected}...`);
    
    // Cambiar el valor del select oculto
    await page.selectOption("select.anime__pagination", paginationSelected, { force: true });
    
    // Esperar a que se actualice la lista de episodios
    await page.waitForTimeout(2000);

    const episodes = await page.$$eval(
        '.epcontent',(results) => (
            results.map((element)=> {
                const title = element.querySelector(".anime__item div.anime__item__pic .anime__item__text ul li span")?.innerText.replaceAll("\"","")

                if (!title) return null 

                const link = element.querySelector(".anime__item")?.getAttribute("href")

                const pic = element.querySelector(".anime__item div.anime__item__pic")?.getAttribute("data-setbg")

                return {title, link, pic}
            })
        )
    )

    await browser.close()

    const jsonStr = JSON.stringify(episodes);
    const jsonBytes = Buffer.byteLength(jsonStr, "utf8");

    const totalMB = totalBytes / (1024 * 1024);
    const jsonMB = jsonBytes / (1024 * 1024);

    const totalFinal = (totalMB + jsonMB).toFixed(4);

    console.log("TOTAL DESCARGADO:", totalFinal, "MB");

    return episodes
}

//Codigo util para  cerrar popus, si lo necesito despues por si acaso

    // Escuchar cualquier popup y cerrarlo inmediatamente
//     page.on("popup", async popup => {
//     console.log("Popup detectado...");
//     try {
//         await popup.waitForTimeout(2000); // deja que stealth inyecte
//         await popup.close();
//         console.log("Popup cerrado");
//     } catch (err) {
//         console.log("Error cerrando popup:", err.message);
//     }
// });

export { GetEpisodesList, GetEpisodesListByPag }