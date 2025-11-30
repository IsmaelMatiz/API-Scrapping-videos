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
  proxyServer: process.env.PROXY_SERVER,
  proxyUserName: process.env.PROXY_USERNAME,
  proxyPassword: process.env.PROXY_PASSWORD
};