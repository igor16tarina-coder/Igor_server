import { Buffer } from 'node:buffer';
import express from 'express';
import cors from 'cors';
import pino from 'pino';
import makeWASocket, { 
    useMultiFileAuthState, 
    DisconnectReason, 
    makeInMemoryStore 
} from '@whiskeysockets/baileys';
import QRCode from 'qrcode';

const app = express();
const logger = pino({ level: 'info' });
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

let qrCodeString = '';

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
    
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true,
        logger: logger
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;
        
        if (qr) {
            qrCodeString = qr;
        }

        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect?.error as any)?.output?.statusCode !== DisconnectReason.loggedOut;
            if (shouldReconnect) startBot();
        } else if (connection === 'open') {
            console.log('BOT CONECTADO COM SUCESSO! 🚀');
        }
    });

    // Rota para ver o QR Code no navegador (evita o erro 502)
    app.get('/', (req, res) => {
        if (qrCodeString) {
            QRCode.toDataURL(qrCodeString, (err, url) => {
                res.send(`
                    <html>
                        <body style="text-align:center; font-family:sans-serif;">
                            <h1>Igor Server - WhatsApp QR Code</h1>
                            <img src="${url}" />
                            <p>Escaneie o código para conectar o bot.</p>
                        </body>
                    </html>
                `);
            });
        } else {
            res.send('<h1>Bot Conectado ou QR Code ainda não gerado.</h1>');
        }
    });
}

app.listen(port, () => {
    console.log(`Servidor rodando na porta ${port}`);
    startBot();
});
