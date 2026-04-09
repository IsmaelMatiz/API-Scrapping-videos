import localtunnel from 'localtunnel';
import QRCode from 'qrcode';

const PORT = 8080;
const SUBDOMAIN = 'anime-pa-la-pipol-lok'; // Intenta que sea único

async function iniciarTunelLocaTunel() {
    try {
        const tunnel = await localtunnel({ 
            port: PORT, 
            subdomain: SUBDOMAIN 
        });

        console.log(`\n🚀 Túnel activo en: ${tunnel.url}`);
        
        // Generar QR para la consola (opcional) o para tu interfaz
       // QRCode.toString(tunnel.url, {type:'terminal'}, function (err, url) {
       //     console.log(url);
        //});

        // --- EL TRUCO PARA QUE NO SE CIERRE ---
        tunnel.on('close', () => {
            console.log('⚠️ El túnel se cerró. Reintentando conectar en 5 segundos...');
            setTimeout(iniciarTunel, 5000); 
        });

        tunnel.on('error', (err) => {
            console.error('❌ Error en el túnel:', err);
            tunnel.close();
        });

    } catch (e) {
        console.error('❌ No se pudo conectar a LocalTunnel, reintentando...');
        setTimeout(iniciarTunel, 5000);
    }
}

export { iniciarTunelLocaTunel }
