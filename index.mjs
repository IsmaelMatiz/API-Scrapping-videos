import { GetResultSearch } from "./searchAnimes.mjs"
import { GetEpisodesList, GetEpisodesListByPag } from "./getEpisodesInfo.mjs"
import { GetM3U8Link } from "./getM3U8FileLink.mjs"
import { config } from "./config/env.mjs";
import express from "express"
import { GetMainPage } from "./getMainPage.mjs";

const app = express();
const PORT = config.port;

app.use(express.json())


app.get("/", (req, res) => {
  res.send("API funcionando 🚀");
})

app.post("/searchAnime", async (req, res)=> {
    const resultAnimes = await GetResultSearch(req.body.query)    

    return res.json(resultAnimes)
})

app.post("/getEpisodesInfo", async (req, res)=> {
    const episodes = await GetEpisodesList(req.body.linkAnimeSelected)

    return res.json(episodes)
})

app.post("/getEpisodesInfoByPag", async (req, res)=> {
    const episodes = await GetEpisodesListByPag(req.body.linkAnimeSelected,req.body.pagSelected)

    return res.json(episodes)
})

app.post("/getEpisodeFileM3U8", async (req, res)=> {
    const episodes = await GetM3U8Link(req.body.linkEpisodeSelected)

    return res.json(episodes)
})

app.get("/getMainPage", async (req, res)=> {
    const filterMostPopularOnes = {
        filtro: "popularidad"
    };

    const filterPopularCurrentlyAiring = {
        filtro: "popularidad",
        estado: "emision"
    };

    const filterPopularLatin = {
        filtro: "popularidad",
        categoria: "latino"
    };

    const filterPopularMovies = {
        filtro: "popularidad",
        tipo: "peliculas"
    };

    const episodesMostPopular = await GetMainPage(filterMostPopularOnes)
    const episodesPopularCurrentlyAiring = await GetMainPage(filterPopularCurrentlyAiring)
    const episodesPopularLatin = await GetMainPage(filterPopularLatin)
    const episodesPopularMovies = await GetMainPage(filterPopularMovies)

    return res.json({episodesMostPopular,episodesPopularCurrentlyAiring,episodesPopularLatin,episodesPopularMovies})
})



// En cloud (Docker/Cloud Run) debe escuchar en 0.0.0.0 para aceptar conexiones externas.
// En local, 0.0.0.0 también responde en localhost.
const HOST = process.env.HOST || '0.0.0.0';

app.listen(PORT, HOST, () => {
  console.log(`Servidor corriendo en http://${HOST}:${PORT}`)
})