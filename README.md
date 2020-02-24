# MOCK TOTVS BUILDER
API desenvolvida para simular o BackEnd, provendo serviços para acessar e manipular Entidades.
Ela já implementa o métodos padrões de CRUD (Create, Update e Delete). 
E para busca dos dados, suporta ordenação (crescente/decrescente), fields e pesquisa por todos os campos retornados. 

# Entidade
Representa a informação que será retornada pelo BackEnd, podendo ser um Cadastros (Cliente, Fornecedor, Nota Fiscal) ou mesmo um conjunto de dados (Total de Vendas por Cliente, Informações para montagem de um Gráfico, etc).

# Configurando as Entidades
Para cada entidade, deverá existir um arquivo de configuração no formato **"JSON"** que deverá ser salvo na pasta **"data"** do projeto.

**Parâmetros do arquivo de configuração**
|Parâmetro|Obrig?|Descrição|Exemplo|
|--|--|--|--|
|**entityName**|Sim|Nome da entidade, que será utilizado para roteamento.|```"customer"```|
|**entityLabel**|Não|Descrição da entidade, que será apresentada nas mensagens de erro.<br>Quando não informado será utilizado **entityName**.|```"Cliente"```|
|**Keys**|Sim|Lista de atributos que fazem parte da chave única da entidade.|```["company","code"]```|
|**database**|Sim|Registros da Entidade, contendo a entidade completa, com todos os atributos necessários.|```[{"company": 10, "code": 1, "shortName": "João", "name": "Joãozinho Maria da Silva" },```<br>```{"company": 10, "code": 2, "shortName": "Maria", "name": "Maria Barbosa"}]```|

# Métodos Pré-definidos
Segue abaixo a lista de Métodos pré-definidos para manipulação das Entidades.
|Método|Descrição|URL Exemplo|
|--|--|--|
|**GET (query)**|Retorna todos os registros da entidade. Considerando as seguintes funcionalidades:<br>**- Paginação:** O método está preparado para realizar o controle de Paginação (**QueryParams** **page/pageSize**).<br>**- Filtro:** É possível realizar filtros utilizando todos os atributos existentes na entidade. Para isto, deve ser enviado um (ou mais) **QueryParams** com o nome do atributo e o valor (ex: name=valor). O valor poderá ser de três tipos:<br>**_Simples:_** Uma informação qualquer que seja do mesmo tipo de dado do atributo (ex: name=joão). Caso o tipo de dado seja string, a busca não será pelo valor exado, ela ir considerar que o atributo contenha esta valor.<br>**_Range:_** Busca por um faixa. Neste caso, o valor inicial e final deve ser enviado como o separador **";"** (ex: name=valorIni;ValorFim).<br>**_Lista:_** Busca por uma lista de valores. Neste caso, os valores devem ser enviados com o separador **","** (ex: country=BRA,USA,ARG).<br>**- Seleção de Atributo:** É possível indicar quais atributos da entidade devem ser retornados. Para isto, deve ser enviando o **QueryParam** **"fields"** com a lista de atributos (ex: fields=code,name).<br>**- Ordenação:** É possível indicar um atributo para realizar a ordenação dos dados retornados. Para isto, deve ser enviando o **QueryParam** **"order"** com o nome do atributo (ex: order=name). Utilizar o caracter '-' na frente do atributo para indicar que a ordenação seja descendente.|/customer?<br>name=João<br>&country=BRA<br>&order=name|
|**GET**|Retorna um registro específico. Para isto, deve ser enviado um **PathParam** com o valor da chave da entidade. Se a chave for composta, utilizar ';' para separar os valores (ex: 10;5). Caso o registro não exista, será retornado uma mesagem de erro.|/customer/7|
|**POST (create)**|Cria um novo registro. Os dados da entidade devem ser enviados no **Payload**. Caso já exista um registro com a chave da entidade, será retornado uma mensagem de erro.|/customer|
|**PUT (update)**|Altera um registro específico. Para isto, deve ser enviado um **PathParam** com o valor da chave da entidade. Se a chave for composta, utilizar ';' para separar os valores (ex: 10;5). E, no **Payload** os dados que devem ser alterados. Caso o registro não exista, será retornado uma mesagem de erro.|/customer/2|
|**DELETE**|Elimina um registro específico. Para isto, deve ser enviado um **PathParam** com o valor da chave da entidade. Se a chave for composta, utilizar ';' para separar os valores (ex: 10;5). Caso o registro não exista, será retornado uma mesagem de erro.|/customer/10|  
**Observações:**
- A busca (get/query) será realizada sobre os Registros existentes no parâmetro "database" do arquivo de configuração de entidade; 
- Sempre que a entidade for manipulada (inclusão/alteração/exclusão), as alterações serão salvas no parâmetro "database" do arquivo de configuração de entidade.
- Todas as buscas realizadas não são case sensitive.

# Utilizando o Serviço
- Utilize o projeto **"mock-totvs-builder-client"** para executar o **"mock-totvs-builder"**;
- O projeto está disponível em:<br>https://github.com/ModernizaDatasul/mock-totvs-builder-client/

# Implementações Futuras
- Method Custom (rota x method - aponta para padrão (get, query, etc...) ou uma nova no arq config)
- Chave composta
- Chave em Base64
- QueryParam Custom (de-param query-param x atrib-entity, ou cria este atrib na entity)
- Validate Custom
- ID auto incrementado
- File Custom (lógica customizada)

