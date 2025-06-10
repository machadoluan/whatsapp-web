const { Client, LocalAuth } = require('whatsapp-web.js');
const QRCode = require('qrcode');
const path = require('path');
const { EventEmitter } = require('events');
const fs = require('fs');
const { setTimeout } = require('timers/promises');

class WhatsappService extends EventEmitter {
    constructor() {
        super();
        this.qrCode = null;
        this.isReady = false;
        this.sessionPath = path.resolve(process.cwd(), 'whatsapp-session');
        this.initializeClient();
    }

    async initializeClient() {
        try {
            this.client = new Client({
                authStrategy: new LocalAuth({
                    dataPath: this.sessionPath,
                    clientId: 'whatsapp-client'
                }),
                puppeteer: {
                    headless: true,
                    args: [
                        '--no-sandbox',
                        '--disable-setuid-sandbox',
                        '--disable-dev-shm-usage'
                    ],
                },
                webVersionCache: {
                    type: 'remote',
                    remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html',
                }
            });

            this.setupEvents();
            await this.client.initialize();
        } catch (err) {
            console.error('Erro na inicialização:', err);
            this.retryConnection();
        }
    }

    setupEvents() {
        this.client.on('qr', async (qr) => {
            console.log('Novo QR Code recebido');
            try {
                this.qrCode = await QRCode.toDataURL(qr);
                this.emit('qrUpdated', this.qrCode);
            } catch (err) {
                console.error('Erro ao gerar QR Code:', err);
                this.qrCode = null;
            }
        });

        this.client.on('ready', () => {
            console.log('✅ WhatsApp conectado!');
            this.isReady = true;
            this.qrCode = null;
            this.emit('ready');
        });

        this.client.on('authenticated', () => {
            console.log('🔄 Autenticado com sucesso!');
        });

        this.client.on('auth_failure', (msg) => {
            console.error('❌ Falha na autenticação:', msg);
        });

        this.client.on('disconnected', async (reason) => {
            console.log(`⚠️ Desconectado: ${reason}`);
            this.isReady = false;
            this.qrCode = null;

            try {
                // Limpa a sessão corretamente
                await this.cleanSession();
            } catch (cleanError) {
                console.error('Erro ao limpar sessão:', cleanError);
            }

            this.retryConnection();
        });
    }

    async cleanSession() {
        try {
            const sessionDir = path.join(this.sessionPath, 'whatsapp-client');
            if (fs.existsSync(sessionDir)) {
                // Espera um pouco antes de tentar deletar
                await setTimeout(2000);
                fs.rmSync(sessionDir, { recursive: true, force: true });
                console.log('Sessão anterior removida com sucesso');
            }
        } catch (err) {
            console.error('Erro ao limpar sessão:', err);
            throw err;
        }
    }

    async retryConnection() {
        console.log('Tentando reconectar...');
        await setTimeout(5000); // Espera 5 segundos

        try {
            await this.cleanSession();
            this.initializeClient();
        } catch (err) {
            console.error('Erro na reconexão:', err);
            this.retryConnection(); // Tenta novamente
        }
    }

    getQrCode() {
        return { qrCode: this.qrCode, isReady: this.isReady };
    }

    async sendMessage(number, message) {
        if (!this.isReady) {
            throw new Error('WhatsApp não está conectado!');
        }
        const chatId = number.includes('@c.us') ? number : `${number}@c.us`;
        await this.client.sendMessage(chatId, message);
        console.log(`Mensagem enviada para ${chatId}: ${message}`);
    }
}

// Exporta uma instância singleton do serviço
module.exports = new WhatsappService();