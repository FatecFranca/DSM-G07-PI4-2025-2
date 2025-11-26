import app from './app.js';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 3001;

// CORREÇÃO CRÍTICA: Adiciona '0.0.0.0' como segundo argumento.
// Isso força o servidor a escutar em TODAS as interfaces de rede disponíveis,
// permitindo que dispositivos externos (como o ESP32, que usa o IP 192.168.12.7) se conectem.
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Acessível na rede em: http://0.0.0.0:${PORT}`);
});