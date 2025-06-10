const whatsappService = require('../services/services');

const WhatsappController = {
  getQrCode(req, res) {
    try {
      const { qrCode, isReady } = whatsappService.getQrCode();
      res.json({ qrCode, isReady });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async sendMessage(req, res) {
    try {
      const { number, message } = req.body;
      await whatsappService.sendMessage(number, message);
      res.json({ success: true, message: 'Mensagem enviada com sucesso!' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
};

module.exports = WhatsappController;