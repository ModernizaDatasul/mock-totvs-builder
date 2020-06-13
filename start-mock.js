/* Exemplo de Utilização do Mock */
const mockServer = require('./main/mock-server');

// Inicializa o Mock
const server = mockServer.startMock(__dirname);

// Carrega o Server
if (server) {
    server.listen(3000, () => { console.log('Mock no AR, Porta: 3000'); });
} else {
    console.log('Não foi possível carregar o Mock, verifique os arquivos de configuração (data) !');
}

