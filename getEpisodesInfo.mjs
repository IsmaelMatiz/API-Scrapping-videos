import { chromium } from "playwright-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth"

async function GetEpisodesList(animeSelected) 
{
    chromium.use(StealthPlugin())
    const browser = await chromium.launch(
        {headless: true}
    )

    const page =  await browser.newPage()

    await page.goto(
        animeSelected
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
        'div.anime__pagination ul li', (results) => (
            results.map((element)=>{
                const pagId = element.getAttribute("data-value")

                const pagFromTo = element?.innerText

                return {pagId, pagFromTo}
            })
        )
    )

    await browser.close()

    return {episodes, pagination}
}

async function GetEpisodesListByPag(animeSelected,paginationSelected) 
{
    chromium.use(StealthPlugin())
    const browser = await chromium.launch(
        {headless: true}
    )

    const page =  await browser.newPage()

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