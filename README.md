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
|**entityName**<br>(string)|Sim|Nome da entidade, que será utilizado para roteamento.<br>**Observação**: O nome deve ser único, isto é, não deve existir outra entidade com o mesmo nome.|```"customer"```|
|**entityLabel**<br>(string)|Não|Descrição da entidade, que será apresentada nas mensagens de erro.<br>Quando não informado será utilizado **entityName**.|```"Cliente"```|
|**keys**<br>(array)|Sim|Lista de atributos que fazem parte da chave única da entidade.<br>Quando a chave for composta, os atributos devem estar na ordem esperada.|Ex1 (chave simples):<br>```["code"]```<br>Ex2 (chave composta):<br>```["company","id"]```|
|**keysSeparator**<br>(string)|Não|Caracter que será utilizado para concatenar as chaves da entidade durante a busca de dados (get, update, delete), quando ela utilizar chave composta. O caracter deve corresponder ao que já é utilizado atualmente pelo FrontEnd para busca de dados. Por exemplo, para buscar o registro o FrontEnd dispara a requisição: ```/customer/1\|3\|4```, desta forma, o caracter utilizado para separar as chaves foi o pipe (**"\|"**), portanto este caracter deve ser utilizado neste parâmetro.<br>Se não for informado, será utilizado o caracter ponto-e-vírgula (**";"**) |Ex1:<br>```";"```<br>Ex2:<br>```"\|"```|
|**mainPath**<br>(string)|Não|Path principal para acesso a entidade. Caso não seja informado, será considerado: **"/" + entityName**|Ex1:<br>```"/customer"```<br>Ex2:<br>```"/api/cdp/v1/customer"```|
|**customSearchFields**<br>(object)|Não|Por padrão, quando é informado um QueryParam com o nome de um atributo da entidade, os dados serão filtrados por este atributo, considerando o valor do QueryParam (ver detalhes no tópico **Busca Avançada - Filtro (Simples)**).<br>Quando for necessário filtrar por um atributo, mas o nome do QueryParam for diferente, é possível fazer uma relação de QueryParam x Atributo através deste parâmetro. Por exemplo, se ao realizar a requisição: **"GET /customer?search=Roberto"**, for necessário que os registros sejam filtrados por **"shortName"** considerando o valor que está no QueryParam **"search"**, basta confirmar ```{"search": "shortName"}```. Também é possível informar mais de uma atributo destino, desta forma o filtro irá pesquisar em todos os informados, considerando uma pesquisa **"OU"**, isto é, se a informação pesquisada existir em qualquer um dos atributos, o registro será considerado. Para isto, a lista de atributos deve ser configurada no formato de um **Array**. Por exemplo, considerando a mesma requisição anterior (**search=Roberto**), realizando a configuração ```{"search": [ "name", "shortName" ]}```, a palavra "Roberto" será pesquisa em ambos atributos: "name" e "shortName", se ela existir em algum deles, o registro será considerado.|```{"initialName": "name", "finalName": "name", "search": "shortName", "quickSearch": [ "name", "shortName" ]}```|
|**base64Key**<br>(logical)|Não|Indica se a chave da entidade é enviada em Base64 nas requisições de GET, PUT e DELETE. Caso afirmativo, a chave recebida será convertida **(base64 decode)** antes de realizar a busca da entidade. Se não informado, será considerado como **false**.|```false```<br>OU<br>```true```|
|**children**<br>(array)|Não|Lista de filhos da entidade. Utilizado para quando a entidade possui filhos diretos alinhados (que fazem parte da estrutura da entidade).<br>Para mais detalhes e configuração, verificar o tópico: **Configurando Filhos da Entidade**.|```[{"entityName": "contacts", "entityLabel": "Contato", "keys": ["seq"]},```<br>```{"entityName": "bankAccount", "base64Key": true, "keys": ["bank", "account"]}]```|
|**customRoutes**<br>(array)|Não|Lista de Rotas customizadas. Utilizado para quando as rotas padrões (ver tópico: **Rotas Pré-definidas**) não atendem.<br>Para configurar as rotas, verificar o tópico: **Configurando Rotas Customizadas**.|```[{"name": "nextId", "method": "GET", "path": "/nextId", "database": "db_nextId"},```<br>```{"name": "block", "method": "POST", "path": "/:idParam/block", "database": "db_block"}]```|
|**customValidation**<br>(array)|Não|Lista de Validações customizadas. Utilizado para simular erros/validações executadas pelo BackEnd.<br>Para configurar as validações, verificar o tópico: **Configurando Validações Customizadas**.|```[{"name": "vld_block","method": ["DELETE"],"from": ["payload","database"],"field": ["status"],"operation": "=","value": 3,"msgError": "Cliente está Bloqueado !"}]```|
|**autoUpdateFields**<br>(array)|Não|Atualização automática de atributos.<br>Para realizar a configuração, verificar o tópico: **Configurando Atualização Automática de Atributos**.|```[{"route": ["create"], "field": "code", "dataType": "number", "value": "#NEXT#"}]```|
|**delayRoute**<br>(array)|Não|Simulação de **demora** do BackEnd. Para realizar a configuração, deve ser informado o nome da Rota e a quantidade de delay em milisegundos. Por exemplo, ao informar um delay de 3000 milisegundos, a ser executada a Rota, ela irá demorar 3 segundos para responder. A Rota pode ser uma Pré-Definida (ver tópico: **Rotas Pré-definidas**, coluna **name**) ou uma Customizada (ver tópico: **Configurando Rotas Customizadas**, parâmetro **name**).|```[{"route": "query", "delay": 5000},{"route": "totalByStatus", "delay": 3000}]```|
|**database**<br>(array)|Sim|Registros da Entidade, contendo a entidade completa, com todos os atributos necessários.|```[{"company": 10, "code": 1, "shortName": "João", "name": "Joãozinho Maria da Silva" },```<br>```{"company": 10, "code": 2, "shortName": "Maria", "name": "Maria Barbosa"}]```|
|**queryCustomInf**<br>(object)|Não|A Rota Pré-definida de **query** sempre irá retorna um objeto JSON no formato **TotvsResponse** (atributos: total, hasNext e items). Caso seja necessário devolver atributos adicionais, é possível envia-los através deste parâmetro.|```{"totalGeral": 300, "hasViewPermission": true}```|

**Exemplo da configuração de uma Entidade**

**Arquivo:** data/customer.json
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
			"status": 3
		}
	]
}
```

# Rotas Pré-definidas
Segue abaixo a lista de Rotas Pré-definidas para manipulação das Entidades.
|Name|Método|Descrição|Exemplo|
|--|--|--|--|
|**query**|**GET**|Retorna todos os registros da entidade, respeitando os parâmetros definidos como Busca Avançada. Veja detalhes no tópico **Busca Avançada**.<br>O retorno será um objeto JSON no formato **TotvsResponse** (atributos: total, hasNext e items), acrescido dos atributos adicionais, caso seja informado no parâmetro **queryCustomInf** da configuração principal da entidade. O resultado da busca estará disponível no atributo **"items"**.|```GET /customer```|
|**get**|**GET**|Retorna um registro específico. Para isto, deve ser enviado um **PathParam** com o valor da chave da entidade. Se a chave for composta, utilizar o caracter informado no parâmetro **keysSeparator** da entidade, para separar os valores (ex: 10;5). Caso o registro não exista, será retornada uma mensagem de erro.|```GET /customer/7```|
|**create**|**POST**|Cria um novo registro. Os dados da entidade devem ser enviados no **Payload**. Caso já exista um registro com a chave da entidade, será retornada uma mensagem de erro.|```POST /customer```<br>Payload:<br>```{"code": 2, "shortName": "Maria", "name": "Maria Barbosa"}```|
|**update**|**PUT**|Altera um registro específico. Para isto, deve ser enviado um **PathParam** com o valor da chave da entidade. Se a chave for composta, utilizar o caracter informado no parâmetro **keysSeparator** da entidade, para separar os valores (ex: 10;5). E, no **Payload** os dados que devem ser alterados. Caso o registro não exista, será retornada uma mensagem de erro.|```PUT /customer/2```<br>Payload:<br>```{"name": "Maria Barbosa da Silva"}```|
|**delete**|**DELETE**|Elimina um registro específico. Para isto, deve ser enviado um **PathParam** com o valor da chave da entidade. Se a chave for composta, utilizar o caracter informado no parâmetro **keysSeparator** da entidade, para separar os valores (ex: 10;5). Caso o registro não exista, será retornada uma mensagem de erro.|```DELETE /customer/10```|  

**Observações:**

- A busca (get/query) será realizada sobre os Registros existentes no parâmetro **"database"** do arquivo de configuração de entidade; 
- Sempre que a entidade for manipulada (inclusão/alteração/exclusão), as alterações serão salvas no parâmetro **"database"** do arquivo de configuração de entidade;
- Todas as buscas realizadas não são case sensitive.

**Busca Avançada**

Ao fazer uma requisição, permite enviar **QueryParams** pré-definidos para filtrar ou manipular o retorno das informações, conforme tabela abaixo:

|Funcionalidade|Descrição|Exemplo|
|--|--|--|
|**Paginação**<br>(pageSize, page)|Realiza o controle de Paginação, retornando as páginas conforme solicitado. Caso não sejam enviados, serão considerados **"page = 1"** e **"pageSize = 20"**.|```/customer?page=1&pageSize=10```|
|**Filtro (Simples)**<br>(atributo=valor)|Possibilita realizar filtros utilizando todos os atributos existentes na entidade. O valor poderá ser uma informação qualquer, que seja do mesmo tipo de dado do atributo. Caso o tipo de dado seja string, a busca não será pelo valor exato, ela irá considerar que o atributo contenha este valor.|```/customer?name=João```|
|**Filtro (Range)**<br>(atributo=valIni;ValFim)|Realiza o filtro considerando uma faixa. Neste caso, os valores inicial e final, devem ser enviados com o separador **";"**.|```/customer?code=2;5```|
|**Filtro (Lista - Tipo 1)**<br>(atributo=val1,val2,valN)|Realiza o filtro considerando uma lista. Neste caso, os valores devem ser enviados com o separador **","**.|```/customer?country=BRA,USA,ARG```|
|**Filtro (Lista - Tipo 2)**<br>(atributo=val1&atributo=valN)|Realiza o filtro considerando uma lista. Neste caso, os valores devem ser enviados repetindo-se o **QueryParam** para cada item da lista.|```/customer?country=BRA&country=USA&country=ARG```|
|**Seleção de Atributos**<br>(fields)|Permite indicar quais atributos da entidade devem ser retornados. Para isto, deve ser enviado o **QueryParam** **"fields"** com a lista de atributos. Caso não seja enviado, retorna todos os atributos da entidade.|```/customer?fields=code,name```|
|**Ordenação**<br>(order)|Permite indicar um atributo para realizar a ordenação dos dados retornados. Para isto, deve ser enviado o **QueryParam** **"order"** com o nome do atributo. Utilizar o caracter **'-'** na frente do atributo para indicar que a ordenação seja descendente. Caso não seja enviado, os dados serão retornados na ordem em que estiver no arquivo de configuração da entidade.|```/customer?order=name```|

# Configurando Filhos da Entidade
Esta configuração é utilizada para quando a entidade possui filhos e eles são alinhados, fazendo parte da estrutura da entidade, isto é, a lista de filhos esta dentro da entidade em um atributo do tipo **array**. Por exemplo, a entidade **customer** possui um atributo array chamado **contacts** e nele está a lista de contatos, conforme exemplo abaixo:
```
{
	"code": 1,
	"shortName": "João",
	"contacts": [
		{
			"seq": 1,
			"name": "Joaquim"
		}
	]
}
```
Ao realizar esta configuração, serão criadas automaticamente as rotas para busca e manipulação dos filhos da entidade. As rotas e regras utilizadas, serão as mesmas utilizadas nas rotas pré-definidas da entidade (ver tópico: **Rotas Pré-definidas**), sendo que, o **Path** seguirá o padrão conforme abaixo:
|Rota|Path|
|--|--|
|**query**|```/entidade/:idEntidade/filho```|
|**get**|```/entidade/:idEntidade/filho/:idFilho```|
|**create**|```/entidade/:idEntidade/filho```|
|**update**|```/entidade/:idEntidade/filho/:idFilho```|
|**delete**|```/entidade/:idEntidade/filho/:idFilho```|

Para realizar a configuração dos filhos, basta incluir o parâmetro **"children"** no arquivo de configuração da Entidade e incluir a lista de filhos. Cada filho, deve respeitar a configuração conforme tabela abaixo:
|Parâmetro|Obrig?|Descrição|Exemplo|
|--|--|--|--|
|**entityName**<br>(string)|Sim|Nome do filho, que será utilizado para roteamento.<br>**Observação**: O nome deve ser único, isto é, não deve existir outro filho da mesma entidade com o mesmo nome.|```"contact"```|
|**entityLabel**<br>(string)|Não|Descrição do filho, que será apresentada nas mensagens de erro.<br>Quando não informado, será utilizado **entityName**.|```"Contato"```|
|**property**<br>(string)|Não|Nome do atributo da entidade que possui a lista do filho.<br>Quando não informado, será utilizado **entityName**.|```"contacts"```|
|**keys**<br>(array)|Sim|Lista de atributos que fazem parte da chave única do filho (desconsiderando a chave da entidade).<br>Quando a chave for composta, os atributos devem estar na ordem esperada.|Ex1 (chave simples):<br>```["seq"]```<br>Ex2 (chave composta):<br>```["bank","account"]```|
|**keysSeparator**<br>(string)|Não|Caracter que será utilizado para concatenar as chaves do filho durante a busca de dados (get, update, delete), quando ele utilizar chave composta. O caracter deve corresponder ao que já é utilizado atualmente pelo FrontEnd para busca de dados. Por exemplo, para buscar o registro o FrontEnd dispara a requisição: ```/customer/1/bankAccount/001\|31232```, desta forma, o caracter utilizado para separar as chaves foi o pipe (**"\|"**), portanto este caracter deve ser utilizado neste parâmetro.<br>Se não for informado, será utilizado o caracter ponto-e-vírgula (**";"**) |Ex1:<br>```";"```<br>Ex2:<br>```"\|"```|
|**base64Key**<br>(logical)|Não|Indica se a chave do filho é enviada em Base64 nas requisições de GET, PUT e DELETE. Caso afirmativo, a chave recebida será convertida **(base64 decode)** antes de realizar a busca da entidade. Se não informado, será considerado como **false**.|```false```<br>OU<br>```true```|
|**directyRoute**<br>(object)|Não|Indica que deve ser possível acessar os dados da entidade filha diretamente, sem depender do pai. Para isto, serão disponibilizadas duas novas rotas, uma de **QUERY** e uma de **GET**, onde o **path** será diretamente a entidade filha (parâmetro **entityName**). Por exemplo: a entidade pai é **customer** e a entidade filha **contact**. O acesso normal à entidade filha é feito através do pai com o path **/customer/:idCust/contact**. Com este parâmetro, é possível acessar a entidade filha através do path **/contact**. Para as consultas, será criado internamente um **novo database** contendo os dados de todos os filhos. Além disso, para que seja possível identificar um registro **único**, será incluído para todos os registros a chave do pai. Da mesma forma, para as consultas com a rota de **"GET"**, deverá ser utilizado como **ID** do registro uma composição da chave do pai + chave do filho, onde o separador utilizado será o informado no parâmetro **keysSeparator** (ser não informado, será considerado **";"**). Por exemplo, considerando que o pai tem a chave igual a **10** e o filho tem a chave igual a **7**, para fazer uma busca com **get**, deverá ser utilizado o ID: **10;7**. Caso necessário, também é possível indicar que outros atributos do pai sejam incluídos neste novo database. Para isto, basta incluir o parâmetro **"addFatherFields"**, passando a lista de atributos desejados, por exemplo: **"addFatherFields": ["shortName","status"]**. As consultas de **query** poderão ser realizadas com se a entidade fosse uma entidade pai, utilizando os queryParam de **fields**, **order**, **page**, etc...<br>**Importante:**<br>- Não deve existir outra entidade pai com o mesmo nome da entidade filha, se existir haverá um conflito de rotas;<br>- Se for utilizado o parâmetro **addFatherFields** e já existir na entidade filha um atributo com o mesmo nome, ele não será afetado, mantendo o mesmo valor que já possui;<br>- Esta configuração não afeta as demais configurações da entidade filha e nem a forma de utilização das demais rotas pré-definidas;<br>- O novo database não é salvo e é descartado depois da utilização.|```{"enabled": true, "addFatherFields": ["shortName", "status"]}```|
|**children**<br>(array)|Não|Lista de filhos da entidade filha, isto é, entidade **neta** em relação a entidade principal. Utilizado para quando a entidade filha possui filhos diretos alinhados (que fazem parte da estrutura da entidade filha).<br>Da mesma forma como é feita para a entidade filha, serão criadas as **Rotas Pré-definidas** de **query, get, create, update, delete**. Sendo que no **Path** é acrescentado mais um nível (Exemplo de get: ```/entidade/:idEntidade/filho/:idFilho/neto/:idNeto```).<br>Para entidade **"neta"**, poderão ser utilizadas as mesmas configurações existentes atualmente para a entidade **"filha"** (exemplo: entityName, keys, base64Key, etc...), com exceção do parâmetro **"children"**, que não pode ser utilizado.|```[{"entityName": "transaction", "entityLabel": "Transação Bancária", "keys": ["transactionId"]}]```|
|**Parâmetros Adicionais**<br>(vários)|Não|Além dos parâmetros indicados nesta tabela, também poderão ser utilizados os parâmetros abaixo, que possuem as mesmas configurações e comportamentos descritos na tabela de configuração da entidade principal:<br>- **customSearchFields**<br>- **customValidation**<br>- **autoUpdateFields**<br>- **delayRoute**<br>- **queryCustomInf**|Ver parâmetros no tópico **Configurando Entidades**|

**Exemplo Configuração:**

**Arquivo:** data/customer.json
```
{
	"entityName": "customer",
	"entityLabel": "Cliente",
	"keys": [ "code" ],
	"children": [
		{
			"entityName": "contact",
			"entityLabel": "Contato",
			"property": "contacts",
			"keys": [ "seq" ]
		},
		{
			"entityName": "bankAccount",
			"base64Key": true,
			"keys": [ "bank", "account" ],
			"children": [
				{
					"entityName": "transaction",
					"entityLabel": "Transação",
					"property": "transactions",
					"keys": [ "transactionId" ],
					"base64Key": false,
					"directyRoute": {
						"enabled": true,
						"addFatherFields": [ "shortName", "status" ]
					}
				}
			]
		}
	]
}
```

# Configurando Rotas Customizadas
Quando as rotas padrões pré-definidas não atendem, é possível configurar novas rotas. Para isto, basta incluir o parâmetro **"customRoutes"** no arquivo de configuração da Entidade e incluir a lista de rotas. Cada rota, deve respeitar a configuração conforme tabela abaixo:
|Parâmetro|Obrig?|Descrição|Exemplos|
|--|--|--|--|
|**name**<br>(string)|Sim|Um nome qualquer para identificar a rota. Será apresentado no Log quando realizada uma requisição para ela.<br>**Observação**: O nome deve ser único, isto é, não deve existir outra rota (Pré-definida ou Customizada) com o mesmo nome.|```"nextId"```|
|**method**<br>(string)|Sim|Método da Requisição. Podendo ser:<br>**- GET:** Utilizado para retornar alguma informação (ex: Próximo ID, Valores totais de uma pesquisa, etc).<br>**- PUT ou POST:** Utilizado para executar alguma ação ou enviar alguma informação (Bloquear um cliente, Disparar um relatório, Enviar dados para duplicar um cliente, etc).<br>**- DELETE:** Utilizado para executar um delete customizado (fora do padrão).<br>**Observações:**<br> - Independente do método, serão aplicadas as mesmas regras de pesquisa de Busca Avançada (ver tópico **Rotas Pré-definidas - Busca Avançada**), desta forma, terá o controle de Paginação, Ordenação, Filtro, etc;<br>- A pesquisa será realizada sobre a lista informada no parâmetro **"database"** da rota.|```"GET"```<br>OU<br>```"PUT"```<br>OU<br>```"POST"```<br>OU<br>```"DELETE"```|
|**path**<br>(string)|Sim|URL que será utilizado na Requisição. É a informação que virá após o **mainPath** da entidade. Por exemplo, na URL **"/customer/nextId"** deve ser informado **"/nextId"**.<br>Também é possível indicar parâmetros na URL, utilizando **":" + "nome-parâmetro"** (ex: "/:idCust/block"). Ele será utilizado para filtrar a lista informada no parâmetro **"database"** da rota. Para isto, é necessário que exista um atributo na lista com o mesmo nome do parâmetro. Por exemplo, para a URL **"/:idCust/block"** deve existir um atributo chamado **"idCust"** na lista **database** da rota. Desta forma, é possível configurar retornos diferentes conforme o parâmetro enviado (ex: Se o cliente for "1" retorna Bloqueio OK, se o cliente for "3", retornar um erro).|Ex1:<br>```"/nextId"```<br>Ex2:<br>```"/:idCust/block"```|
|**savePayload**<br>(logical)|Não|Indica se as informações enviadas no Payload das requisições de **POST**, devem ser salvas no **database** da rota. Se não informado, será considerado como **false**.|```false```<br>OU<br>```true```|
|**script**<br>(string)|Não|Parâmetro utilizado para informar um programa desenvolvido em NodeJS, que será executado ao receber a requisição na rota. Desta forma é possível programar qualquer comportamento, ou até mesmo realizar algum cálculo com base nos dados.<br>Ver detalhes da configuração no tópico: **Configurando Script de Rota**.|```"customer.js"```|
|**fileParam**<br>(object)|Não|Parâmetro utilizado quando a rota é destinada a receber arquivos via Upload, ou realizar o Download de arquivos a partir do Backend.<br>Ver detalhes da configuração no tópico: **Configurando Rota para Tratamento de Arquivo**.|```{"fileName": "#file#_#today#", "directory": "uploads/"}```|
|**responseType**<br>(string)|Não|Tipo do Response que será retornado. Podendo ser:<br>**- object:** Retorna um objeto JSON. Se a pesquisa resultar em mais de um registro, será considerado somente o primeiro.<br>**- array:** Retorna um objeto JSON no formato **TotvsResponse** (atributos: total, hasNext e items), sendo que o resultado estará disponível no atributo **"items"**.<br>**- file:** Utilizado para indicar que a rota irá retornar um arquivo. Ver detalhes no tópico: **Configurando Rota para Tratamento de Arquivo**.<br>**Observações:**<br>- Caso não seja informado, será considerado **"object"**;<br>- Quando o tipo for **"object"**, será possível customizar o retorno (ver tópico: **Customizando o Response**).|```"object"```<br>OU<br>```"array"```<br>OU<br>```"file"```|
|**queryCustomInf**<br>(object)|Não|Atributos adicionais que serão devolvidos quando o parâmetro **responseType** for igual a **array**.|```{ "totalGeral": 300, "hasViewPermission": true }```|
|**database**<br>(string)|Não|Nome da Lista que contém os dados a serem pesquisados ou atualizados. Neste parâmetro pode ser informado o conteúdo "**database**", para utilizar o database padrão da entidade, ou o nome de um database específico, neste caso, este database deverá ser definida como um novo parâmetro dentro do arquivo de configuração da entidade. Por exemplo, se for informado "db_block", no arquivo de configuração deverá existir um parâmetro com o seguinte nome e formato:<br>```"db_block": [ {object1}, {object2}, {objectN} ]```<br>**Observação:** Caso não seja informado, a rota não irá retornar dados em uma pesquisa, e não irá salvar as informações em uma atualização.|Ex1:<br>```"db_block"```<br>Ex2:<br>```"database"```|

**Configurando Script de Rota**

É possível configurar uma Rota Customizada informando um programa desenvolvido em NodeJS, que será executado toda vez que a rota receber uma requisição. Este programa deve ser salvo na pasta **"data"** do projeto, e o seu nome, informado no parâmetro **script** da rota.<br>
Segue abaixo os tratamento conforme o método da rota:<br>
**Rotas com método GET**:<br>
- O programa deverá ter uma função chamada **"get"**;
- Esta função irá receber os seguintes parâmetros:

|Parâmetro|Descrição|
|--|--|
|**paramPath**<br>(object)|Objeto com os parâmetros de Path da Requisição. Por exemplo, se o path da rota for **"/:idCust/block"**, o conteúdo enviado na Requisição pode ser acessado da seguinte forma: **paramPath.idCust**.|
|**queryParam**<br>(object)|Objeto com os parâmetros de Query enviados na Requisição. Por exemplo, se for realizada a requisição **/customer?search=Roberto**, o conteúdo pode ser acessado da seguinte forma: **queryParam.search**.|
|**database**<br>(array)|Lista de dados que foram configurados no parâmetro **database** da rota.|

- A função poderá retornar um objeto com os seguintes parâmetros:

|Parâmetro|Descrição|
|--|--|
|**statusCode**<br>(number)|Código de Status a ser retornado na Requisição (ex: 200, 404, 500). Se não for informado, será retornado **200**.|
|**response**<br>(object)|Objeto de Response, retornado na Requisição. Se não for informado, será retornado um objeto vazio.|

**Rotas com método PUT, POST ou DELETE**:<br>
- O programa deverá ter uma função chamada **"put", "post" ou "delete"**;

|Parâmetro|Descrição|
|--|--|
|**paramPath**<br>(object)|Objeto com os parâmetros de Path da Requisição. Por exemplo, se o path da rota for **"/:idCust/block"**, o conteúdo enviado na Requisição pode ser acessado da seguinte forma: **paramPath.idCust**.|
|**queryParam**<br>(object)|Objeto com os parâmetros de Query enviados na Requisição. Por exemplo, se for realizada a requisição **/customer?search=Roberto**, o conteúdo pode ser acessado da seguinte forma: **queryParam.search**.|
|**payload**<br>(object)|Objeto com as informações enviadas no Payload da Requisição.|
|**database**<br>(array)|Lista de dados que foram configurados no parâmetro **database** da rota.|

- A função poderá retornar um objeto com os seguintes parâmetros:

|Parâmetro|Descrição|
|--|--|
|**statusCode**<br>(number)|Código de Status a ser retornado na Requisição (ex: 200, 404, 500). Se não for informado, será retornado **200**.|
|**response**<br>(object)|Objeto de Response, retornado na Requisição. Se não for informado, será retornado um objeto vazio.|
|**database**<br>(array)|Lista de Dados que serão salvas no parâmetro **database** da rota. Por exemplo, na rota foi configurado um database que possui um registro de cliente. A função de "post" do script irá receber este database, se a função incluir um novo registro nele, e ele for retornado, este novo registro será salvo. Se este campo não for informado, as informações alteradas pela função não serão salvas.|

**Configurando Rota para Tratamento de Arquivo**

É possível configurar uma Rota Customizada para receber arquivos via Upload ou realizar o Download de arquivos a partir do Backend. Para isto, basta seguir as orientações abaixo conforme cada tipo:<br><br>
**Upload de Arquivos**:<br>
- O parâmetro **"method"** da rota deverá ser igual a **"PUT"** ou **"POST"**;
- Deverá ser incluído o parâmetro **"fileParam"** na rota (detalhe na tabela abaixo), para configuração do nome e diretório de destino onde os arquivos serão salvos;
- Os detalhes dos arquivos recebidos, serão salvos no parâmetro **"database"** configurado na rota, caso ele seja informado. Portanto neste caso, se for informado, o ideal é ter um **database** específico;
- Os detalhes dos arquivos também serão retornados no **response** da requisição, no formato JSON, portanto o **"responseType"** não precisa ser informado, ou deve ser igual a **"object"**. 

**Download de Arquivos**:<br>
- O parâmetro **"method"** da rota deverá ser igual a **"GET"**, **"PUT"** ou **"POST"**;
- Deverá ser incluído o parâmetro **"fileParam"** na rota (detalhe na tabela abaixo), para configuração do nome e diretório onde os arquivos estarão fisicamente;
- Se o arquivo não existir no diretório configurado no momento da requisição, será retornado um erro **404**;
- O parâmetro **"database"** da rota não é utilizado. Portanto ele não deve ser informado;
- O parâmetro **"responseType"** da rota deverá ser igual **"file"**.

O parâmetro **"fileParam"** é um objeto JSON, que possui os parâmetros descritos na tabela abaixo:

|Parâmetro|Obrig?|Descrição|Exemplos|
|--|--|--|--|
|**fileName**<br>(string)|Não (upload)<br>Sim (download)|Para Rotas de **Upload de Arquivos**: Através deste parâmetro, é possível determinar o nome do arquivo recebido, isto é, qual será o nome do arquivo físico salvo no diretório parametrizado (**directory**). O ideal é não informar a extensão do arquivo, desta forma, será assumida a extensão do arquivo original enviado no **Upload**. Se este parâmetro não for informado, será considerado o nome original do arquivo.<br>Para Rotas de **Download de Arquivos**: Neste parâmetro deve ser informado o nome do arquivo existente no diretório parametrizado (**directory**).<br>O nome do arquivo pode conter caracteres fixos e/ou variáveis. Por exemplo, informando **"#file#-#today#"**, o nome será igual ao nome original (**upload**), seguindo de um traço e a data de hoje.<br>As variáveis disponíveis são:<br>- **#file#**: Nome original do arquivo (somente disponível para **upload**).<br>- **#today#**: Data atual, no formato: AAAA-MM-AA.<br>- **#now#**: Momento atual em milissegundos.<br>- **Um parâmetro da URL**: Se na rota customizada foi informado um parâmetro (ex: **:idArq**), este parâmetro pode ser utilizado para determinar o nome arquivo. Para isto, basta informar o nome do parâmetro entre **"#"** (ex: **#idArq#**).|Ex1:<br>```"#today#-#file#"```<br>Ex2:<br>```"#file#_#now#"```<br>Ex3:<br>```"arq_id-#idCust#"```<br>Ex4:<br>```"layout-200.txt"```|
|**directory**<br>(string)|Sim|Para Rotas de **Upload de Arquivos**: Deve ser informado o Diretório onde serão salvos os arquivos recebidos.<br>Para Rotas de **Download de Arquivos**: Deve ser informado o Diretório onde estão fisicamente os arquivos.<br>O diretório pode ser **"completo"** (ex: **"C:/tmp/files/"**), ou **"relativo"**, neste caso, será uma sub-pasta dentro do projeto onde está rodando o Mock. Por exemplo, se for informado **"uploads/"**, e o mock estiver no projeto **"C:/THF/totvs-obrig-fisc/thf2/"**, o caminho considerado será: **"C:/THF/totvs-obrig-fisc/thf2/uploads/"**.<br>**Observação:** O diretório deve existir.|<br>Ex1:<br>```"C:/arquivos/upload/"```<br>Ex2:<br>```"files/"```|

**Customizando o Response**

Para as rotas customizadas que possuem o **responseType** igual a **"object"**, é possível mudar o comportamento do response para, por exemplo, retornar uma mensagem de erro. Para isto, basta incluir os atributos abaixo na lista configurada no parâmetro **"database"** da rota:
|Atributo|Descrição|Exemplos|
|--|--|--|
|**statusCodeResponse**<br>(number)|Permite informar o Status Code do response. Se não informado, será considerado **200**.|```"statusCodeResponse": 400```|
|**errorResponse**<br>(string)|Mensagem de erro retornada no Response. A mensagem será retornada no formato de Erro padrão TOTVS.|```"errorResponse": "Não foi possível bloquear o cliente 3 !"```|

**Exemplo da Configuração de Rotas Customizadas**

Segue abaixo uma tabela com exemplos de rotas customizadas:
|Rota|Descrição|
|--|--|
|**nextId**|Simula o retorno de uma informação específica. Neste exemplo, retorna o próximo código do cliente. Que foi configurado no database **"db_nextId"** como **12**.<br><br>Exemplo:<br>**Requisição:** ```GET /customer/nextId```<br>**Retorno:** ```{ "code": 12 }```|
|**block**|Simula a execução de uma ação no BackEnd, que retorna uma informação ou erro, com base em um parâmetro enviado. Neste exemplo, simula o bloqueio de um cliente. O código do cliente é enviado como **PathParam** que foi configurado na rota como **":idParam"**, desta forma, a lista **"db_block"** configurada no **"database"** da rota é filtrada por este parâmetro, já que ele possui uma atributo com o mesmo nome. Neste exemplo, as informações do **"database"** não são alteradas, é  apenas uma simulação de retorno de erro.<br><br>Exemplo 1:<br>**Requisição:** ```POST /customer/1/block```<br>**Retorno:** StatusCode: ```200```<br><br>Exemplo 2:<br>**Requisição:** ```POST /customer/3/block```<br>**Retorno:** StatusCode: ```400``` - Erro: ```Não foi possível bloquear o cliente 3 !```<br><br>Exemplo 3:<br>**Requisição:** ```POST /customer/6/block```<br>**Retorno:** StatusCode: ```500``` - Erro: ```Usuário já está bloqueado !```|
|**duplic**|Simula o envio de uma informação que é salva no banco dados. Neste exemplo, simula a duplicação de um cliente. Neste caso, é enviado no **Payload** os dados de um cliente, que é salvo no banco **"db_duplic"** que foi configurado no parâmetro **"database"** da rota.<br><br>Exemplo:<br>**Requisição:** ```POST /customer/3/duplic```<br>**Payload:** ```{ "code": 3, "shortName": "Adonias", "name": "Adonias Oliveira", "country": "USA", "status": 2 }```<br>**Ação:** A informação enviada no **Payload** será salva no parâmetro **"db_duplic"** do arquivo de configuração da entidade.|
|**totalByStatus**|Simula uma Requisição que calcula a quantidade de Clientes por Status. Neste exemplo, é executada a função **"get"** do programa **customer.js**, que foi configurado no parâmetro **script**, para realizar o cálculo. A lista de cliente considerada será a **database**, que foi configurada no parâmetro **database**.<br><br>Exemplo:<br>**Requisição:** ```GET /customer/totByStatus```<br>**Retorno:** ```[ { "status": 2, "total": 2 }, { "status": 3, "total": 1 } ]```|
|**changeStatus**|Simula a alteração de Status do Cliente. Neste exemplo, é executada a função **"post"** do programa **customer.js**, que foi configurado no parâmetro **script**, para realizar a alteração. O novo status será enviado no **Payload** da Requisição. A lista de cliente considerada será a **database**, que foi configurada no parâmetro **database**.<br><br>Exemplo:<br>**Requisição:** ```POST /customer/3/changeStatus```<br>**Payload:** ```{ "status": 1 }```<br>**Ação:** O Status do Cliente **3** será alterado para **1** e alteração será salva na lista de cliente configurado no parâmetro **database**.|
|**upload**|Simula o envio de arquivos via Upload, que são salvos fisicamente no diretório **"uploads/"** existente dentro do projeto do Mock, que foi configurado no parâmetro **"directory"**. As informações dos arquivos (nome, diretório, tamanho, etc...) são salvos no banco **"db_photo"**, que foi configurado no parâmetro **"database"** da rota. Ao salvar o arquivo no diretório, ele é renomeado para conter também a data atual, conforme configurado no parâmetro **"fileName"**.<br><br>Exemplo:<br>**Requisição:** ```POST /customer/photo```<br>**Upload:** Arquivo: ```joao.jpg```<br>**Ação:** O arquivo será salvo no diretório: ```C:/THF/mock-totvs-builder/uploads/```, com o nome ```joao_2020-06-13.jpg```. E as informações do arquivo, serão salvas no parâmetro ```db_photo```.|
|**image**|Simula o download de imagens no FrontEnd, que estão fisicamente no diretório **"images/"** existente dentro do projeto do Mock, que foi configurado no parâmetro **"directory"**. Na requisição é enviado um **PathParam** com o nome da imagem, conforme configurado no parâmetro **"path"** (**:imageId**). Esta parâmetro é utilizado para determinar o nome do arquivo, conforme configurado no parâmetro **"fileName"** (**#imageId#**). No **response** será retornado o arquivo de imagem conforme configurado no parâmetro **"responseType"**.<br><br>Exemplo:<br>**Requisição:** ```GET /customer/photo/maria.jpg```<br>**Retorno:** Arquivo: ```maria.jpg```|

**Configuração:**

**Arquivo:** data/customer.json
```
{
	"entityName": "customer",
	"entityLabel": "Cliente",
	"keys": [ "code" ],
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
		},
		{
			"name": "duplic",
			"method": "POST",
			"path": "/:idParam/duplic",
			"database": "db_duplic"
		},
		{
			"name": "totalByStatus",
			"method": "GET",
			"path": "/totByStatus",
			"script": "customer.js",
			"database": "database"
		},
		{
			"name": "changeStatus",
			"method": "POST",
			"path": "/:idParam/changeStatus",
			"script": "customer.js",
			"database": "database"
		},
		{
			"name": "upload",
			"method": "POST",
			"path": "/photo",
			"fileParam": {
				"fileName": "#file#_#today#",
				"directory": "uploads/"
			},
			"database": "db_photo"
		},
		{
			"name": "image",
			"method": "GET",
			"path": "/photo/:imageId",
			"fileParam": {
				"fileName": "#imageId#",
				"directory": "images/"
			},
			"responseType": "file"
		}
	],
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
			"status": 3
		},
		{
			"code": 3,
			"shortName": "Adonias",
			"name": "Adonias Ribeiro",
			"country": "BRA",
			"status": 2
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
	],
	"db_duplic": [
	],
	"db_photo": [
	]
}
```

**Arquivo:** data/customer.js
```
module.exports = {

	get(paramPath, queryParam, database) {
		let totStatus = [];
		database.forEach(customer => {
			let status = totStatus.find(st => st.status === customer.status);
			if (!status) {
				totStatus.push({ status: customer.status, total: 1 });
			} else {
				status.total += 1;
			}
		});

		return {
			statusCode: 200,
			response: { items: totStatus }
		}
	},

	post(paramPath, queryParam, payload, database) {
		let customer = database.find(cust => cust.code == paramPath.idParam);
		if (customer) {
			customer.status = payload.status;
		}

		return {
			statusCode: 200,
			response: {},
			database: database
		}
	}
};
```

# Configurando Validações Customizadas
É possível criar validações que serão executadas sobre os parâmetros recebidos na requisição ou sobre os dados retornados por ela. Desta forma, é possível simular as validações retornadas pelo BackEnd, para verificar o comportamento da tela quando ocorre algum erro de negócio.
Para criar as validações, basta incluir o parâmetro **"customValidation"** no arquivo de configuração da Entidade e as respectivas validações. Cada validação, deve respeitar a configuração conforme tabela abaixo:
|Parâmetro|Obrig?|Descrição|Exemplos|
|--|--|--|--|
|**name**<br>(string)|Sim|Um nome qualquer para identificar a Validação. Será apresentado no Help da mensagem de Erro.<br>**Observação**: O nome deve ser único, isto é, não deve existir outra validação com o mesmo nome.|```"vld_block"```|
|**method**<br>(array)|Não|Indica sobre quais Métodos da Requisição a validação deve ser executada, podendo ser informado um ou vários. Por exemplo, se for informado **"DELETE"**, a validação somente será executada quando receber um requisição com este método.<br>É possível indicar os seguintes métodos: **"GET", "PUT", "POST" e/ou "DELETE"**.<br>Caso não seja informado, a validação será realizada sobre todas as requisições, independentemente do método.|```["PUT", "POST", "DELETE"]```|
|**route**<br>(array)|Não|Indica sobre quais rotas a validação deve ser executada, podendo ser informada uma ou várias. Por exemplo, se for informado **"create"**, a validação somente será executada sobre a rota de create.<br>Deve ser informado o nome da rota, podendo ser uma Pré-Definida (ver tópico: **Rotas Pré-definidas**, coluna **name**) ou uma Customizada (ver tópico: **Configurando Rotas Customizadas**, parâmetro **name**).<br>Caso não seja informada, a validação será realizada sobre todas as rotas.|```["update", "delete", "duplic"]```|
|**from**<br>(array)|Não|Indica sobre quais Parâmetros da Requisição a validação deve ser executada, podendo ser informado um ou vários. Por exemplo, se for informado **"pathParam"**, a validação será executada sobre os PathParams da requisição.<br>É possível indicar os parâmetros enviados pela requisição, informando: **"pathParam", "queryParam", "payload"** e/ou os dados que foram acessados pela requisição, informando: **"database"**.<br>Caso não seja informado, a validação será realizada sobre todos os parâmetros da requisição e os dados acessados por ela.<br>**Observação:** Quando for informado **"database"** será considerando os dados conforme o tipo de rota da requisição. Se for uma Rota Pré-definida, será considerando o parâmetro **"database"** do arquivo de Configuração da Entidade. Se for uma Rota Customizada, será considerando o parâmetro **"database"** configurado na rota.|```["pathParam", "queryParam"]```|
|**field**<br>(array)|Sim|Indica sobre quais campos a validação deve ser executada, podendo ser informado um ou vários.<br>Este parâmetro trabalha em conjunto com o parâmetro **"from"**. Por exemplo, se no **"from"** for informado **"queryParam"**, e no **"filed"** for informado **"branch"**, indica que a validação será executada sobre o campo **"branch"** que foi enviado como um **queryParam**.<br>Quando no **"from"** for informado **"database"**, a validação será executada sobre o campo com o mesmo nome que exista nos registros do **"database"**. Por exemplo, se for informando no **"from"** o valor **"code"**, a validação será executada sobre o campo **"code"** de todos os registros acessados pela requisição que vieram do **"database"**.|```["branch", "code", "currency"]```|
|**operation**<br>(string)|Sim|Indica o tipo de validação que deve ser executada, considerando que o valor da campo informado no parâmetro **"field"** deve ser: igual á, maior que, diferente de, etc...<br>Verificar no tópico **"Operadores de Validação"** todos os operadores disponíveis.|```"!="```|
|**value**<br>(string)|Sim|Valor que será utilizado para comparação com o conteúdo dos campos parametrizados em **"field"**.<br>**Observação:** Para que a comparação funcione corretamente, o conteúdo deve ser do mesmo tipo do campo.|```"10"```|
|**msgError**<br>(string)|Sim|Mensagem que será apresentada ao usuário se a validação for atendida. Esta mensagem será retornada para o FrontEnd no formato padrão de erro TOTVS. O código da mensagem será 400 e a mensagem e o help serão os mesmos, mas no help será incluído o nome da validação (parâmetro **"name"**).|```"Cliente está Bloqueado !"```|

**Operadores de Validação**

O operador de validação é utilizado para comparar o valor dos campos informados no parâmetro **"field"** com o valor informado no parâmetro **"value"** da validação customizada. Segue abaixo a lista dos Operadores disponíveis:
|Operador|Descrição|Observação|
|--|--|--|
|**=**|Igual a|O conteúdo do campo deve ser igual ao valor parametrizado.|
|**!=**|Diferente de|O conteúdo do campo deve ser diferente do valor parametrizado.|
|**>**|Maior que|O conteúdo do campo deve ser maior que o valor parametrizado.|
|**>=**|Maior ou igual a|O conteúdo do campo deve ser maior ou igual ao valor parametrizado.|
|**<**|Menor que|O conteúdo do campo deve ser menor que o valor parametrizado.|
|**<=**|Menor ou igual a|O conteúdo do campo deve ser menor ou igual ao valor parametrizado.|
|**begins**|Começa com|O conteúdo do campo deve começar pelo valor parametrizado.<br>**Observação:** Somente disponível para campos do tipo caracter.|
|**!begins**|Não começa com|O conteúdo do campo não deve começar pelo valor parametrizado.<br>**Observação:** Somente disponível para campos do tipo caracter.|
|**contains**|Contêm|O conteúdo do campo deve conter o valor parametrizado.<br>**Observação:** Somente disponível para campos do tipo caracter.|
|**!contains**|Não contêm|O conteúdo do campo não deve conter o valor parametrizado.<br>**Observação:** Somente disponível para campos do tipo caracter.|
|**required**|Obrigatório|Indica se o campo deve ter um conteúdo válido ou não. Se o valor parametrizado na validação (parâmetro **"value"**) for **"true"**, o campo deve existir e ter um conteúdo válido. Se o valor parametrizado for **"false"**, o campo não deve existir ou deve ter um conteúdo inválido.

**Observação:** Para campos do tipo caracter, a comparação não é case sensitive.

**Execução das Validações**

A execução das validações será realizada em momentos diferentes conforme o método da Requisição e o tipo da rota, tendo um comportamento conforme tabela abaixo:
|Método|Tipo Rota|Descrição|
|--|--|--|
|**GET (Query)**|Pré-definidas|Serão validadas somente as informações enviadas nos **PathParams** e **QueryParams**. Se a validação for atendida, os dados não serão lidos e será retornada a mensagem de erro parametrizada.|
|**GET**|Pré-definidas|Primeiramente serão validadas as informações enviadas nos **PathParams** e **QueryParams**. Se a validação for atendida, o registro não será lido e sim, será retornada a mensagem de erro parametrizada.<br>Caso contrário, o registro será lido e antes de retornar os dados, eles serão validados.<br>Caso a validação seja atendida, será retornada a mensagem de erro parametrizada.|
|**POST (create)**|Pré-definidas|Neste caso não é enviado **PathParams**, mas para validação, a chave da tabela (parâmetro **"keys"**) será considerado com um **PathParams** para realizar a validação. Além da chave, serão validadas as informações enviadas no **Payload**. Se a validação for atendida, o registro não será incluído e será retornada a mensagem de erro parametrizada.|
|**PUT (update)**|Pré-definidas|Primeiramente serão validadas as informações enviadas no **PathParams**. Se a validação for atendida, será retornada a mensagem de erro parametrizada.<br>Caso contrário, o registro será lido e antes de alterá-lo, as informações dele serão validadas. Caso a validação seja atendida, o registro não será alterado e será retornada a mensagem de erro parametrizada.|
|**DELETE**|Pré-definidas|Primeiramente serão validadas as informações enviadas no **PathParams**. Se a validação for atendida, será retornada a mensagem de erro parametrizada.<br>Caso contrário, o registro será lido e antes de eliminá-lo, as informações dele serão validadas. Caso a validação seja atendida, o registro não será eliminado e será retornada a mensagem de erro parametrizada.|
|**GET**|Customizada|Primeiramente serão validadas as informações enviadas nos **PathParams** e **QueryParams**. Se a validação for atendida, os registros não serão lidos e sim, será retornada a mensagem de erro parametrizada.<br>Caso contrário, todos os registros lidos serão validados e antes de retornar os dados, eles serão validados.Caso a validação seja atendida, eles não serão retornados e sim a mensagem de erro parametrizada.|
|**POST**|Customizada|Primeiramente serão validadas as informações enviadas nos **PathParams**, **QueryParams** e **Payload**. Se a validação for atendida, será retornada a mensagem de erro parametrizada.<br>Depois disto, caso tenha sido parametrizado um **database** para rota, os registros selecionados serão validados. Se a validação for atendida, será retornada a mensagem de erro parametrizada.|

**Observações:**
- Caso a validação seja atendida, será retornada uma mensagem no formato de Erro padrão TOTVS, com o status 400;
- Caso mais de uma validação seja atendida na mesma requisição, os erros serão agrupados e estarão disponíveis nos detalhes do erro.

**Exemplo da Configuração de Validações Customizadas**

Segue abaixo uma tabela com exemplos de validações customizadas:
|Validação|Descrição|
|--|--|
|**vld_block**|Simula a validação para, não permitir alterar ou excluir um cliente que esteja bloqueado.<br>Será executada sobre os métodos **"PUT"** e **"DELETE"** conforme parametrizado em **"method"**.<br>Serão considerados os dados acessados no **database**, conforme parametrizado em "**from**".<br>Dos dados acessados, será considerado o campo **"status"** conforme parametrizado em **"field"**.<br>Para validação, será considerado como cliente bloqueado, quando o campo for igual a **"3"** (parametrizado em **"operation"** e **"value"**).<br>Se a validação for atendida, será retornada a mensagem de erro parametrizada em **"msgError"**.<br><br>Exemplo:<br>**Requisição:** ```DELETE /customer/2```<br>**Retorno:** ```{ code: 400, message: 'Cliente está Bloqueado (status) !' }```|
|**vld_big_code**|Simula a validação para não permitir buscar clientes onde o código seja maior que 999.<br>Será executada sobre o método **"GET"** conforme parametrizado em **"method"**.<br>Serão considerados os dados enviados no **PathParam**, conforme parametrizado em "**from**".<br>Será considerado o parâmetro **"id"** do PathParam (parâmetro da rota) conforme parametrizado em **"field"**.<br>Para validação, será verificado se o **id** é maior ou igual a **"999"** (parametrizado em **"operation"** e **"value"**).<br>Se a validação for atendida, será retornada a mensagem de erro parametrizada em **"msgError"**.<br><br>Exemplo:<br>**Requisição:** ```GET /customer/1923```<br>**Retorno:** ```{ code: 400, message: 'Código do cliente deve ser menor que 999 (id) !' }```|
|**vld_prm_obr**|Simula a validação de campos obrigatórios em uma inclusão ou alteração.<br>Serão consideradas as rotas **"create"** e **"update"** conforme parametrizado em **"route"**.<br>Serão considerados os dados enviados no **Payload**, conforme parametrizado em "**from**".<br>Dos dados enviados, serão considerados os campos **"name"** e **"status"** conforme parametrizado em **"field"**.<br>Para validação, será verificado se os campos foram enviados e possuem um valor válido (**requered = true**), conforme parametrizado em **"operation"** e **"value"**.<br>Se a validação for atendida, será retornada a mensagem de erro parametrizada em **"msgError"**.<br><br>Exemplo:<br>**Requisição:** ```POST /customer```<br>**Payload:** ```{ "code": 10, "shortName": "Adonias", "status": 1 }```<br>**Retorno:** ```{ code: 400, message: 'Campos obrigatório (name) !' }```|

**Configuração:**

**Arquivo:** data/customer.json
```
{
	"entityName": "customer",
	"entityLabel": "Cliente",
	"keys": [ "code" ],
	"customValidation": [
		{
			"name": "vld_block",
			"method": [ "PUT", "DELETE" ],
			"from": [ "database" ],
			"field": [ "status" ],
			"operation": "=",
			"value": 3,
			"msgError": "Cliente está Bloqueado !"
		},
		{
			"name": "vld_big_code",
			"method": [ "GET" ],
			"from": [ "pathParam" ],
			"field": [ "id" ],
			"operation": ">=",
			"value": "999",
			"msgError": "Código do cliente deve ser menor que 999 !"
		},
		{
			"name": "vld_prm_obr",
			"route": [ "create", "update" ],
			"from": [ "payload" ],
			"field": [ "name", "status" ],
			"operation": "required",
			"value": "true",
			"msgError": "Campos obrigatório !"
		}
	],
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
			"status": 3
		}
	]
}
```

# Configurando Atualização Automática de Atributos

É possível realizar configurações para indicar que determinados atributos sejam atualizados de forma automática. Podendo ser atualizados com informações fixas e/ou variáveis. Para realizar esta configuração, basta incluir o parâmetro **"autoUpdateFields"** no arquivo de configuração da Entidade, indicando os atributos. Abaixo segue os parâmetros que podem ser utilizados na configuração:
|Parâmetro|Obrig?|Descrição|Exemplos|
|--|--|--|--|
|**route**<br>(array)|Sim|Lista de rotas onde o atributo será atualizado. As Rotas podem ser Pré-Definidas (ver tópico: **Rotas Pré-definidas**, coluna **name**) ou Customizadas (ver tópico: **Configurando Rotas Customizadas**, parâmetro **name**).<br>**Observação**: A configuração somente irá funcionar para rotas que utilizam os métodos **"PUT"** ou **"POST"**.|```["create", "update"]```|
|**field**<br>(string)|Sim|Nome do atributo que irá receber a informação de forma automática.<br>**Observação**: Se o atributo não existir na entidade, ele será criado, durante a execução da rota.|```"history"```|
|**dataType**<br>(string)|Sim|Tipo de dado do atributo informado. Podendo ser **string**, **number**, **boolean** ou **date**.|```"string"```|
|**overlay**<br>(logical)|Não|Indica que o atributo deve ser atualizado mesmo que ele já possua um valor.<br>**Observação**: Se não for informado, será considerado como "false", isto é, se o atributo já existir no registro e ele já possuir um valor, o atributo não será atualizado.|```false```<br>OU<br>```true```|
|**value**<br>(string)|Sim|Valor que deve ser atualizado no atributo. Podendo ser valores fixos, variáveis ou uma combinação deles. Mas, deve respeitar o tipo de dado do atributo. Para os valores variáveis, ver a tabela abaixo **Variáveis**.<br>**Observação**: Independente do tipo de dado do atributo, o valor informado aqui deve estar entre **aspas**. Durante a atualização, o valor será convertido para o tipo de dado do atributo.|```"Registro atualizado em: #TODAY# - #TIME#."```|

**Variáveis**

As variáveis serão substituídas antes de atualizar o valor no atributo, conforme a regra de cada uma delas. Elas podem ser utilizadas em qualquer posição dentro do valor. Além disso, uma mesma variável pode ser utilizada várias vezes.<br>**Importante**: Cada variável só pode ser utilizada para alguns tipos de dados, que devem ser compatíveis com o tipo de dado do atributo informado. Os tipos permitidos estão descritos na coluna **tipo**.

|Variável|Tipo|Descrição|
|--|--|--|
|**#NEXT#**|number|Próximo valor do atributo. Para buscar o próximo valor, será considerado o maior valor do atributo entre os registros existentes no database da rota e somado 1.|
|**#A#**|string|Um caracter aleatório de A a Z.|
|**#9#**|number ou string|Um número aleatório de 0 a 9.|
|**#L#**|boolean ou string|Um valor aleatório entre true ou false.| 
|**#TODAY#**|date ou string|A data atual, no formato: "YYYY-MM-DD".|
|**#NOW#**|date ou string|A data e hora atual, no formato:  ISO 8601 ("YYYY-MM-DDTHH:mm:ss.sssZ").|
|**#TIME#**|string|A hora atual, no formato: "HH:MM:SS".|
|**#DBSIZE#**|number ou string|Quantidade atual de registros do database da rota.|

**Exemplo da Configuração de Atualização Automática de Atributos**

Abaixo segue alguns exemplos de como a Atualização Automática de Atributos pode ser utilizada e como deve ser configurada.

1) Considerando que o atributo "code" é a chave de uma entidade e ela deve ser atualizada de forma automática e sequencial a cada novo registro incluído:
```
"autoUpdateFields": [
	{
		"route": [ "create" ],
		"field": "code",
		"dataType": "number",
		"overlay": true,
		"value": "#NEXT#"
	}
]
```
2) Na entidade existem dois atributos: "dtLastUpdate" e "hrLastUpdate" que são utilizados para registrar a data e hora da última atualização do registro:
```
"autoUpdateFields": [
	{
		"route": [ "create", "update" ],
		"field": "dtLastUpdate",
		"dataType": "date",
		"overlay": true,
		"value": "#TODAY#"
	},
	{
		"route": [ "create", "update" ],
		"field": "hrLastUpdate",
		"dataType": "string",
		"overlay": true,
		"value": "#TIME#"
	}	
]
```
3) A entidade possui uma rota customizada chamada "payment", que é utilizada para criar transações de pagamento. A cada nova transação, o atributo "nsu" deve ser atualizado automaticamente como um valor no formato: quarto caracteres + dois números + "/" + data e hora da transação.
```
"autoUpdateFields": [
	{
		"route": [ "payment" ],
		"field": "nsu",
		"dataType": "string",
		"overlay": true,
		"value": "#A##A##A##A##9##9#/#NOW#"
	}	
]
```

# Executando o mock-totvs-builder
Existe duas formas de executar o mock-totvs-builder, através de um projeto client, ou incorporando ao seu projeto.

**Projeto mock-totvs-builder-client**

Projeto utilizando para executar o mock-totvs-builder, desta forma, serão carregados duas seções do Visual Studio. Uma com o seu projeto e outro com o projeto do Mock.
O mock-totvs-builder-client está disponível endereço abaixo, basta baixar o projeto e seguir o README.<br>
https://github.com/ModernizaDatasul/mock-totvs-builder-client/

**Incorporando ao seu Projeto**

Para incorporar o mock-totvs-builder ao seu projeto, basta seguir os passos abaixo:

1) Instalar o **mock-totvs-builder** e o **nodemon** (biblioteca que controla o reload do mock) no projeto, como uma dependência de Desenvolvimento, executando os comandos abaixo no terminal: 
	```
	npm install --save-dev mock-totvs-builder
	npm install --save-dev nodemon
	```

2) Na pasta principal do seu projeto (mesma pasta onde está o **package.json**) criar um novo arquivo chamado **"start-mock.js"**, com o seguinte conteúdo:
	```
	// Inicializa o Mock
	const mockServer = require('mock-totvs-builder');
	const server = mockServer.startMock(__dirname);

	// Carrega o Server
	if (server) {
		server.listen(3000, () => { console.log('Mock no AR, Porta: 3000'); });
	} else {
		console.log('Não foi possível carregar o Mock, verifique os arquivos de configuração (data) !');
	}
	```

3) Nesta mesma pasta, criar um pasta chamada **"data"** onde deverão ser salvos os arquivos de configuração das Entidades, conforme descrito no início da documentação.

4) Criar um atalho para execução do mock, para isto:
	- Abrir o arquivo "package.json";
	- Logo no início existe uma grupo chamado "scripts";
	- incluir a linha: ```"mock": "nodemon start-mock",```   

5) A utilização do Mock no projeto vai funcionar da seguinte forma:
	- Com o seu Projeto aberto no Visual Studio, deverão ser abertos dois Terminais;
	- Um será utilizado para carregar a sua aplicação e o outro para carregar o mock;
	- Para carregar o mock, utilizar o comando: ```npm run mock```
	- Deve aparecer a mensagem: "Mock no AR, Porta: 3000".

6) Para verificar as entidades configuradas no mock, basta:
	- Abrir um Navegador Web e acessar o endereço: http://localhost:3000/
	- Deve aparecer: MOCK TOTVS BUILDER - No Ar !! e as Entidades configuradas.

# Implementações Futuras
- Validador do Arquivo de Configuração
- Tratamento do expandables (por padrão não terá, mas poderá ser "ligado" via arq config)
- Edição Entidade Config via html.
