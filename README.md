# MOCK TOTVS BUILDER
API desenvolvida para simular o BackEnd, provendo serviços para acessar e manipular Entidades.
Ela já implementa os métodos padrões de CRUD (Create, Update e Delete). 
E para busca dos dados, suporta paginação, ordenação (crescente/decrescente), fields e pesquisa por todos os campos retornados. 

# Entidade
Representa a informação que será retornada pelo BackEnd, podendo ser um Cadastros (Cliente, Fornecedor, Nota Fiscal) ou mesmo um conjunto de dados (Total de Vendas por Cliente, Informações para montagem de um Gráfico, etc).

# Configurando Entidades
Para cada entidade, deverá existir um arquivo de configuração no formato **"JSON"** que deverá ser salvo na pasta **"data"** do projeto.

**Parâmetros do arquivo de configuração**
|Parâmetro|Obrig?|Descrição|Exemplo|
|--|--|--|--|
|**entityName**|Sim|Nome da entidade, que será utilizado para roteamento.|```"customer"```|
|**entityLabel**|Não|Descrição da entidade, que será apresentada nas mensagens de erro.<br>Quando não informado será utilizado **entityName**.|```"Cliente"```|
|**Keys**|Sim|Lista de atributos que fazem parte da chave única da entidade.|Ex1 (chave simples):<br>```["code"]```<br>Ex2 (chave composta):<br>```["company","id"]```|
|**customRoutes**|Não|Lista de Rotas customizadas. Utilizado para quando as rotas padrões (ver tópico: **Rotas Pré-definidas**) não atendem.<br>Para configurar as rotas, verficar o tópico: **Configurando Rotas Customizadas**.|```[{"name": "nextId", "method": "GET", "path": "/nextId", "database": "db_nextId"},```<br>```{ "name": "block", "method": "POST", "path": "/:idParam/block", "database": "db_block"}]```|
|**database**|Sim|Registros da Entidade, contendo a entidade completa, com todos os atributos necessários.|```[{"company": 10, "code": 1, "shortName": "João", "name": "Joãozinho Maria da Silva" },```<br>```{"company": 10, "code": 2, "shortName": "Maria", "name": "Maria Barbosa"}]```|

**Exemplo da configuração de uma Entidade**

**Arquivo:** data/customer.json<br>
```
{
    "entityName": "customer",
    "entityLabel": "Cliente",
    "keys": [ "code" ],
    "database": [
        {
            "code": 1,
            "shortName": "João",
            "name": "Joãozinho da Silva",
            "country": "BRA",
            "status": 2
        },
        {
            "code": 2,
            "shortName": "Maria",
            "name": "Maria Barbosa",
            "country": "BRA",
            "status": 1
        }
    ]
}
```

# Rotas Pré-definidas
Segue abaixo a lista de Rotas Pré-definidas para manipulação das Entidades.
|Método|Descrição|Exemplo|
|--|--|--|
|**GET (query)**|Retorna todos os registros da entidade, respeitando os parâmetros definidos como Busca Avançada. Veja detalhes no tópico **Busca Avançada**.|```GET /customer```|
|**GET**|Retorna um registro específico. Para isto, deve ser enviado um **PathParam** com o valor da chave da entidade. Se a chave for composta, utilizar **';'** para separar os valores (ex: 10;5). Caso o registro não exista, será retornado uma mesagem de erro.|```GET /customer/7```|
|**POST (create)**|Cria um novo registro. Os dados da entidade devem ser enviados no **Payload**. Caso já exista um registro com a chave da entidade, será retornado uma mensagem de erro.|```POST /customer```|
|**PUT (update)**|Altera um registro específico. Para isto, deve ser enviado um **PathParam** com o valor da chave da entidade. Se a chave for composta, utilizar **';'** para separar os valores (ex: 10;5). E, no **Payload** os dados que devem ser alterados. Caso o registro não exista, será retornado uma mesagem de erro.|```PUT /customer/2```|
|**DELETE**|Elimina um registro específico. Para isto, deve ser enviado um **PathParam** com o valor da chave da entidade. Se a chave for composta, utilizar **';'** para separar os valores (ex: 10;5). Caso o registro não exista, será retornado uma mesagem de erro.|```DELETE /customer/10```|  

**Observações:**

- A busca (get/query) será realizada sobre os Registros existentes no parâmetro **"database"** do arquivo de configuração de entidade; 
- Sempre que a entidade for manipulada (inclusão/alteração/exclusão), as alterações serão salvas no parâmetro **"database"** do arquivo de configuração de entidade.
- Todas as buscas realizadas não são case sensitive.

**Busca Avançada**

Ao fazer uma requisição, permite enviar **QueryParams** pré-defindos para filtrar ou manipular o retorno das informações, conforme tabela abaixo:

|Funcionalidade|Descrição|Exemplo|
|--|--|--|
|**Paginação**<br>(pageSize, page)|Realiza o controle de Paginação, retornado as páginas conforme solicitado. Caso não sejam enviados, serão considerados **"page = 1"** e **"pageSize = 20"**.|```/customer?page=1&pageSize=10```|
|**Filtro (Simples)**<br>(atributo=valor)|Possibilita realizar filtros utilizando todos os atributos existentes na entidade. O valor poderá ser uma informação qualquer, que seja do mesmo tipo de dado do atributo. Caso o tipo de dado seja string, a busca não será pelo valor exado, ela ir considerar que o atributo contenha esta valor.|```/customer?name=João```|
|**Filtro (Range)**<br>(atributo=valIni;ValFim)|Realiza o filtro considerando uma faixa. Neste caso, os valores inicial e final, devem ser enviados com o separador **";"**.|```/customer?code=2;5```|
|**Filtro (Lista)**<br>(atributo=val1,val2,valN)|Realiza o filtro considerando uma lista. Neste caso, os valores devem ser enviados com o separador **","**.|```/customer?country=BRA,USA,ARG```|
|**Seleção de Atributo**<br>(fields)|Permite indicar quais atributos da entidade devem ser retornados. Para isto, deve ser enviando o **QueryParam** **"fields"** com a lista de atributos.|```/customer?fields=code,name```|
|**Ordenação**<br>(order)|Permite indicar um atributo para realizar a ordenação dos dados retornados. Para isto, deve ser enviando o **QueryParam** **"order"** com o nome do atributo. Utilizar o caracter **'-'** na frente do atributo para indicar que a ordenação seja descendente.|```/customer?&order=name```|

# Configurando Rotas Customizadas
Quando as rotas padrões pré-difinidas não atentendem, é possível configurar novas rotas. Para isto, basta incluir o parâmetro **"customRoutes"** no arquivo de configuração da Entidade e incluir a lista de rotas. Cada rota, deve respeitar a configuração conforme tabela abaixo:
|Parâmetro|Obrig?|Descrição|Exemplos|
|--|--|--|--|
|**name**|Sim|Um nome qualquer para identificar a Rota. Será apresentado no Log quando realizada uma requisição para ela.|```"nextId"```|
|**method**|Sim|Método da Requisição. Podendo ser:<br>**- GET:** Utilizado para retornar alguma informação (ex: Próximo ID, Valores totais de uma pesquisa, etc).<br>**- POST:** Utilizado para executar alguma ação ou enviar alguma informação (Bloquear um cliente, Disparar um relatório, Enviar dados para duplicar um cliente, etc).<br>**Observações:**<br> - Independente do método, serão aplicadas as mesmas regras de pesquisa de Busca Avançada (ver tópico **Rotas Pré-definidas - Busca Avançada**), desta forma, terá o controle de Paginação, Ordenação, Filtro, etc;<br>- A pesquisa será realizada sobre a lista informada no parâmetro **"database"** da rota;<br>- Ao realizar um **"POST"**, o que for enviado no **Payload** será saldo na lista informada no parâmetro **"database"** da rota.|```"GET"```<br>OU<br>```"POST"```|
|**path**|Sim|URL que será utilizado na Requisição. É a informação que virá após a entidade. Por exemplo, na URL **"/customer/nextId"** deve ser informado **"/nextId"**.<br>Também é possível indicar parâmetros na URL, utilizando **":" + "nome-parâmetro"** (ex: "/:idCust/block"). Ele será utilizado para filtrar a lista informada no parâmetro **"database"** da rota. Para isto, é necessário que exista um atributo na lista com o mesmo nome do parâmetro. Por exemplo, para a URL **"/:idCust/block"** deve existir um atributo chamado **"idCust"** na lista **database** da rota. Desta forma, é possível configurar retornos diferentes conforme o parâmetro enviado (ex: Se o cliente for "1" retorna Bloqueio OK, se o cliente for "3", retornar um erro).|Ex1:<br>```"/nextId"```<br>Ex2:<br>```"/:idCust/block"```|
|**responseType**|Não|Tipo do Response que será retornado. Podendo ser:<br>**- object:** Retorna um objeto. Se a pesquisa resultar em mais de um registro, será considerado somente o primeiro.<br>**- array:** Retorna um objeto no formato **TotvsResponse**, sendo que o resultado estará disponvível no atributo **"items"**.<br>**Observações:**<br>- Caso não seja informado, será considerado **"object"**;<br>- Quando o tipo for **"object"**, será possível customizar o retorno (ver tópico: **Customizando o Response**).|```"object"```<br>OU<br>```"array"```|
|**database**|Sim|Nome da Lista que contêm os dados a serem pesquisados ou atualizados. Esta lista deverá ser definida como um novo parâmetro dentro do arquivo de configuração da entidade. Por exemplo, se for informado "db_block", no arquivo de configuração deverá existir um parâmetro com o seguinte nome e formato:<br>```"db_block": [ {object2}, {object2} ]```<br>**Observação:** Neste parâmetro pode ser informado **"database"**, desta forma, será utilizado para pesquisa/atualização a mesma lista padrão da Entidade configurado no parâmetro de mesmo nome. (ver tópico: **Configurando Entidades**).|Ex1:<br>```"db_block"```<br>Ex2:<br>```"database"```|

**Customizando o Response**

Para as rotas customizadas que possuem o **responseType** igual a **"object"**, é possível mudar o comportamento do response para, por exemplo, retornar uma mesagem de erro. Para isto, basta incluir os atributos abaixo na lista configurada no parâmetro **"database"** da rota:
|Atributo|Descrição|Exemplos|
|--|--|--|
|statusCodeResponse|Permite informar o Status Code do response. Se não informado, será considerado **200**.|```"statusCodeResponse": 400```|
|errorResponse|Mensagem de erro retornada no Response. Ela estará no formato de Erro padrão TOTVS.|```"errorResponse": "Não foi possível bloquear o cliente 3 !"```|

**Exemplo da Configuração de Rotas Customizadas**

No exemplo abaixo temos duas rotas customizadas:
|Rota|Descrição|
|--|--|
|nextId|Retorno o próximo código do cliente. Que foi configurado no database **"db_nextId"** como **12**.<br><br>Exemplo:<br>**Requisição:** ```GET /customer/nextId```<br>**Retorno:** ```{ "code": 12 }```|
|block|Simula o bloqueio de um cliente. O código do cliente é enviado como **PathParam** que foi configurado na rota como **":idParam"**, desta forma, a lista **"db_block"** configurada no **"database"** da rota é filtrada por este parâmetro, já que ele possui uma atributo com o mesmo nome.<br><br>Exemplo 1:<br>**Requisição:** ```POST /customer/1/block```<br>**Retorno:** StatusCode: ```200```<br><br>Exemplo 2:<br>**Requisição:** ```POST /customer/3/block```<br>**Retorno:** StatusCode: ```400``` - Erro: ```Não foi possível bloquear o cliente 3 !```<br><br>Exemplo 3:<br>**Requisição:** ```POST /customer/6/block```<br>**Retorno:** StatusCode: ```500``` - Erro: ```Usuário já está bloqueado !```|

**Configuração:**
```
"customRoutes": [
	{
		"name": "nextId",
		"method": "GET",
		"path": "/nextId",
		"responseType": "object",
		"database": "db_nextId"
	},
	{
		"name": "block",
		"method": "POST",
		"path": "/:idParam/block",
		"responseType": "object",
		"database": "db_block"
	}
],
"db_nextId": [
	{
		"code": 12
	}
],
"db_block": [
	{
		"idParam": 1,
		"statusCodeResponse": 200
	},
	{
		"idParam": 3,
		"statusCodeResponse": 400,
		"errorResponse": "Não foi possível bloquear o cliente 3 !"
	},
	{
		"idParam": 6,
		"statusCodeResponse": 500,
		"errorResponse": "Usuário já está bloqueado !"
	}
]
```

# Utilizando o Serviço
- Utilize o projeto **"mock-totvs-builder-client"** para executar o **"mock-totvs-builder"**;
- O projeto está disponível em:<br>https://github.com/ModernizaDatasul/mock-totvs-builder-client/

# Implementações Futuras
- Chave composta
- Chave em Base64
- Validador do Arquivo de Configuração
- QueryParam Custom (de-param query-param x atrib-entity, ou cria este atrib na entity)
- Validate Custom
- ID auto incrementado
- Variáveis no arquivo de configuração (ex: #today#)
- File Custom (lógica customizada)

