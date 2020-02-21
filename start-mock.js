/* Exemplo de Utilização do Mock */
const mockServer = require('./main/mock-server');

// Inicializa o Mock
const server = mockServer.startMock(__dirname);

// Carrega o Server
server.listen(3000, () => {
    console.log('listen on 3000');
});
