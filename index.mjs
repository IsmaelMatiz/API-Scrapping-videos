import { GetResultSearch } from "./searchAnimes.mjs"
import { GetEpisodesList, GetEpisodesListByPag } from "./getEpisodesInfo.mjs"
import { GetM3U8Link } from "./getM3U8FileLink.mjs"
import { config } from "./config/env.mjs";
import express from "express"

const app = express();
const PORT = config.port;

app.use(express.json())


app.get("/", (req, res) => {
  res.send("API funcionando 🚀");
})

app.get("/searchAnime", async (req, res)=> {
    const resultAnimes = await GetResultSearch(req.body.query)

    return res.json(resultAnimes)
})

app.get("/getEpisodesInfo", async (req, res)=> {
    const episodes = await GetEpisodesList(req.body.linkAnimeSelected)

    return res.json(episodes)
})

app.get("/getEpisodesInfoByPag", async (req, res)=> {
    const episodes = await GetEpisodesListByPag(req.body.linkAnimeSelected,req.body.pagSelected)

    return res.json(episodes)
})

app.get("/getEpisodeFileM3U8", async (req, res)=> {
    const episodes = await GetM3U8Link(req.body.linkEpisodeSelected)

    return res.json(episodes)
})

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
