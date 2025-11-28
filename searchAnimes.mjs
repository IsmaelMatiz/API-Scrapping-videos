import { chromium } from "playwright-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth"
import { config } from "./config/env.mjs";


async function GetResultSearch(inputSearch) 
{
    inputSearch.replaceAll(" ","%20")
    chromium.use(StealthPlugin())
    const browser = await chromium.launch(
        {headless: true}
    )

    const page =  await browser.newPage()

    await page.goto(
        config.baseUrl+"/buscar/"+inputSearch
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
    
    await browser.close()

    return animes
}

export { GetResultSearch }