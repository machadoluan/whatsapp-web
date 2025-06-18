const express = require('express');
const whatsappRoutes = require('./routers/whatsapp.routes');
const whatsappService = require('./services/services');

const app = express();

const cors = require('cors');
app.use(cors({
    origin: ['https://pwm.devmchd.space', 'http://localhost:4200'],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: 'Content-Type, Accept, Authorization',
}));

// Middleware para parsear JSON
app.use(express.json());


// Rotas
app.use('/whatsapp', whatsappRoutes);

// Rota básica de teste
app.get('/', (req, res) => {
    res.send('API WhatsApp Web JS');
});

// Inicia o servidor
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Servidor rodando em: http://localhost:${PORT}`);

    // Opcional: Logar eventos do WhatsApp no console do servidor
    whatsappService.on('qrUpdated', (qrCode) => {
        console.log('QR Code atualizado!');
    });

    whatsappService.on('ready', () => {
        console.log('WhatsApp está pronto para enviar mensagens!');
    });

    whatsappService.on('disconnected', () => {
        console.log('WhatsApp foi desconectado!');
    });
});