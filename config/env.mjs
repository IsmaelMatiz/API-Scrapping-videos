// config/env.js
import dotenv from 'dotenv';

// Cargar archivo .env según entorno (opcional)
const envFile = process.env.NODE_ENV ? `.env.${process.env.NODE_ENV}` : '.env';
dotenv.config({ path: envFile }); // Si no existe, dotenv usa .env por defecto

// Extraer y validar variables
const required = ['PORT', 'BASE_URL'];
const missing = required.filter(k => !process.env[k]);

if (missing.length) {
  throw new Error(`Faltan variables de entorno: ${missing.join(', ')}`);
}

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 3000,
  baseUrl: process.env.BASE_URL,
  scrapeEntryUrlDragonBall: process.env.SCRAPE_ENTRY_URL_DRAGON_BALL || `${process.env.BASE_URL}/dragon-ball-z/1/`,
  scrapeEntryUrlEvangelion: process.env.SCRAPE_ENTRY_URL_EVANGELION || `${process.env.BASE_URL}/neon-genesis-evangelion-the-end-of-evangelion/pelicula/`,
};