const genUts = require('../utils/generic-utils.js');
const dbUts = require('../utils/db-utils.js');
const fileUts = require('../utils/file-utils.js');

module.exports = {

    async query(req, res, mainEntityCfg, type, entityName, entityFatherName) {
        this.logRequest(type, entityName, 'GET (query)', req);

        await this.doDelayedRoute(mainEntityCfg, 'query');

        let entityCfg = this.getConfigByType(req, res, mainEntityCfg, type, entityName, entityFatherName);
        if (!entityCfg) {
            return this.errorBuilderReturn([this.errorBuilder(404, `Configuração da Entidade ${entityName} não encontrada.`)]);
        }

        let customVld = this.customValidationParams('GET', 'query', req, res, entityCfg);
        if (customVld) { return customVld; };

        let response = this.applyAllQueryFilters(entityCfg.database, req, entityCfg.customSearchFields, entityCfg.queryCustomInf);

        return res.json(response);
    },

    async get(req, res, mainEntityCfg, type, entityName, entityFatherName) {
        this.logRequest(type, entityName, 'GET', req);

        await this.doDelayedRoute(mainEntityCfg, 'get');

        let entityCfg = this.getConfigByType(req, res, mainEntityCfg, type, entityName, entityFatherName);
        if (!entityCfg) {
            return this.errorBuilderReturn([this.errorBuilder(404, `Configuração da Entidade ${entityName} não encontrada.`)]);
        }

        const index = this.getRecordIndex('GET', 'get', req, res, entityCfg, type);
        if (typeof (index) !== 'number') {
            return index;
        }

        return res.json(entityCfg.database[index]);
    },

    async create(req, res, mainEntityCfg, fileName, type, entityName, entityFatherName) {
        this.logRequest(type, entityName, 'POST (create)', req);

        await this.doDelayedRoute(mainEntityCfg, 'create');

        let entityCfg = this.getConfigByType(req, res, mainEntityCfg, type, entityName, entityFatherName);
        if (!entityCfg) {
            return this.errorBuilderReturn([this.errorBuilder(404, `Configuração da Entidade ${entityName} não encontrada.`)]);
        }

        const newEntity = req.body;

        const entityId = this.getEntityKeyValue(newEntity, entityCfg.keys, entityCfg.keysSeparator);
        if (!req.params) req["params"] = {};
        if (type === "GRANDSON") {
            req.params["idGrandson"] = entityId;
        } else if (type === "CHILDREN") {
            req.params["idSon"] = entityId;
        } else {
            req.params["id"] = entityId;
        }

        let customVld = this.customValidationParams('POST', 'create', req, res, entityCfg);
        if (customVld) { return customVld; };

        const index = entityCfg.database.findIndex((entity) => {
            return this.entityKeyCompare(entity, entityCfg.keys, entityCfg.keysSeparator, entityId);
        });

        if (index !== -1) {
            return res.status(400).json(
                this.errorBuilderReturn([this.errorBuilder(400,
                    `Já existe ${entityCfg.entityLabel || entityCfg.entityName} com o código ${entityId}.`)])
            );
        }

        entityCfg.database.push(newEntity);

        fileUts.saveFile(fileName, mainEntityCfg);

        return res.json(newEntity);
    },

    async update(req, res, mainEntityCfg, fileName, type, entityName, entityFatherName) {
        this.logRequest(type, entityName, 'PUT (update)', req);

        await this.doDelayedRoute(mainEntityCfg, 'update');

        let entityCfg = this.getConfigByType(req, res, mainEntityCfg, type, entityName, entityFatherName);
        if (!entityCfg) {
            return this.errorBuilderReturn([this.errorBuilder(404, `Configuração da Entidade ${entityName} não encontrada.`)]);
        }

        const index = this.getRecordIndex('PUT', 'update', req, res, entityCfg, type);
        if (typeof (index) !== 'number') {
            return index;
        }

        Object.keys(req.body).forEach((property) => {
            if (!entityCfg.keys.includes(property)) {
                entityCfg.database[index][property] = req.body[property];
            }
        });

        fileUts.saveFile(fileName, mainEntityCfg);

        return res.json(entityCfg.database[index]);
    },

    async delete(req, res, mainEntityCfg, fileName, type, entityName, entityFatherName) {
        this.logRequest(type, entityName, 'DELETE', req);

        await this.doDelayedRoute(mainEntityCfg, 'delete');

        let entityCfg = this.getConfigByType(req, res, mainEntityCfg, type, entityName, entityFatherName);
        if (!entityCfg) {
            return this.errorBuilderReturn([this.errorBuilder(404, `Configuração da Entidade ${entityName} não encontrada.`)]);
        }

        const index = this.getRecordIndex('DELETE', 'delete', req, res, entityCfg, type);
        if (typeof (index) !== 'number') {
            return index;
        }

        entityCfg.database.splice(index, 1);

        fileUts.saveFile(fileName, mainEntityCfg);

        return res.json({
            message: `${entityCfg.entityLabel || entityCfg.entityName} removido com sucesso !`
        });
    },

    getConfigByType(req, res, entityCfg, type, entityName, entityFatherName) {
        if (type === "CHILDREN") {
            const childrenCfg = this.getChildrenCfg(req, res, entityCfg, entityName, "FATHER", "isChildrenCfg");
            if (!childrenCfg.isChildrenCfg) {
                return childrenCfg;
            }
            entityCfg = childrenCfg;
        }

        if (type === "GRANDSON") {
            const grandsonCfg = this.getGrandsonCfg(req, res, entityCfg, entityName, entityFatherName);
            if (!grandsonCfg.isGrandsonCfg) {
                return grandsonCfg;
            }
            entityCfg = grandsonCfg;
        }

        return entityCfg;
    },

    getChildrenCfg(req, res, entityCfg, entityName, fatherType, cfgType) {
        // Busca o Pai
        const index = this.getRecordIndex('GET', 'get', req, res, entityCfg, fatherType);
        if (typeof (index) !== 'number') {
            return index;
        }
        let entityFather = entityCfg.database[index];

        let childrenCfgOrig = entityCfg.children.find((entity) => {
            return entity.entityName === entityName;
        });

        var childrenCfg = { ...childrenCfgOrig }

        childrenCfg[cfgType] = true;

        let property = childrenCfg.property;
        if (!property) { property = childrenCfg.entityName; }

        if (!entityFather[property]) { entityFather[property] = []; }
        childrenCfg["database"] = entityFather[property];

        return childrenCfg;
    },

    getGrandsonCfg(req, res, entityCfg, entityName, entityFatherName) {

        // Busca configuração do Filho
        const childrenCfg = this.getChildrenCfg(req, res, entityCfg, entityFatherName, "FATHER", "isChildrenCfg");
        if (!childrenCfg.isChildrenCfg) {
            return childrenCfg;
        }

        // Busca configuração do Neto
        const grandsonCfg = this.getChildrenCfg(req, res, childrenCfg, entityName, "CHILDREN", "isGrandsonCfg");
        if (!grandsonCfg.isGrandsonCfg) {
            return grandsonCfg;
        }

        return grandsonCfg;
    },

    getRecordIndex(method, route, req, res, entityCfg, type) {
        let entityId = req.params.id;
        if (type === "FATHER") { entityId = req.params.idFather; }
        if (type === "CHILDREN") { entityId = req.params.idSon; }
        if (type === "GRANDSON") { entityId = req.params.idGrandson; }

        if (entityCfg.base64Key) { entityId = genUts.atob(entityId); }

        let customVld = this.customValidationParams(method, route, req, res, entityCfg);
        if (customVld) { return customVld; };

        const index = entityCfg.database.findIndex((entity) => {
            return this.entityKeyCompare(entity, entityCfg.keys, entityCfg.keysSeparator, entityId);
        });

        if (index === -1) {
            return res.status(400).json(
                this.errorBuilderReturn([this.errorBuilder(400,
                    `${entityCfg.entityLabel || entityCfg.entityName} não encontrado com o código ${entityId}.`)])
            );
        }

        customVld = this.customValidationDatabase(method, route, entityCfg.database[index], res, entityCfg);
        if (customVld) { return customVld; };

        return index;
    },

    async customMethod(method, req, res, entityCfg, fileName, customRoute) {
        this.logRequest("CUSTOM", customRoute.name, method, req);

        await this.doDelayedRoute(entityCfg, customRoute.name);

        let customVld = this.customValidationParams(method, customRoute.name, req, res, entityCfg);
        if (customVld) { return customVld; };

        let response = {};
        if (customRoute.database) {
            let database = genUts.copyArray(entityCfg[customRoute.database]);

            let queryCustomInf = null;
            if (method == 'GET' && customRoute.responseType == "array") {
                queryCustomInf = customRoute.queryCustomInf;
            }
            response = this.applyAllQueryFilters(database, req, entityCfg.customSearchFields, queryCustomInf);

            customVld = this.customValidationDatabase(method, customRoute.name, response.items, res, entityCfg);
            if (customVld) { return customVld; };

            if (method !== 'GET') {
                if (customRoute.savePayload && req.body && Object.keys(req.body).length > 0) {
                    entityCfg[customRoute.database].push(req.body);
                    fileUts.saveFile(fileName, entityCfg);
                }
            }
        }

        return this.makeCustomResponse(res, customRoute, response);
    },

    async customMethodScript(method, req, res, entityCfg, fileName, customRoute, projRootDir) {
        this.logRequest("CUSTOM", customRoute.name, method + " (Script)", req);

        await this.doDelayedRoute(entityCfg, customRoute.name);

        let customVld = this.customValidationParams(method, customRoute.name, req, res, entityCfg);
        if (customVld) { return customVld; };

        let arqScript = fileUts.pathJoin(projRootDir, 'data');
        arqScript = fileUts.pathJoin(arqScript, customRoute.script);

        if (!fileUts.pathExist(arqScript)) {
            return res.status(500).json(
                this.errorBuilderReturn([this.errorBuilder(500, `Script da Rota não encontrado: ${arqScript}`)])
            );
        }

        let database = genUts.copyArray(entityCfg[customRoute.database]);
        let customScript = null;
        let responseScript = null;

        try {
            customScript = require(arqScript);

            switch (method) {
                case 'GET':
                    responseScript = customScript.get(req.params, req.query, database);
                    break;
                case 'PUT':
                    responseScript = customScript.put(req.params, req.query, req.body, database);
                    break;
                case 'POST':
                    responseScript = customScript.post(req.params, req.query, req.body, database);
                    break;
                case 'DELETE':
                    responseScript = customScript.delete(req.params, req.query, req.body, database);
                    break;
                default:
                    console.log('customScript: Método Inválido -', method);
            }
        }
        catch (errorScript) {
            return res.status(500).json(
                this.errorBuilderReturn([this.errorTryCatchBuilder(500, 'Erro ao executar o Script da Rota !', errorScript)])
            );
        }

        let statusCodeResponse = 200;
        let response = {};
        if (responseScript) {
            if (responseScript.statusCode) { statusCodeResponse = responseScript.statusCode };
            if (responseScript.response) { response = responseScript.response };

            if (method !== 'GET') {
                if (responseScript.database) {
                    entityCfg[customRoute.database] = responseScript.database;
                    fileUts.saveFile(fileName, entityCfg);
                }
            }
        }

        return res.status(statusCodeResponse).json(response);
    },

    async customMethodFile(method, req, res, entityCfg, customRoute) {
        this.logRequest("CUSTOM", customRoute.name, method + " (File)", req);

        await this.doDelayedRoute(entityCfg, customRoute.name);

        let customVld = this.customValidationParams(method, customRoute.name, req, res, entityCfg);
        if (customVld) { return customVld; };

        let fileName = null;
        if (customRoute.fileParam && customRoute.fileParam.fileName) {
            fileName = fileUts.makeFileName(customRoute.fileParam.fileName, null, req.params);
        }

        if (!fileName) {
            return res.status(404).json(
                this.errorBuilderReturn([this.errorBuilder(404, 'O nome do Arquivo deve ser informado na configuração da Rota !')])
            );
        }

        let fileDir = null;
        if (customRoute.fileParam && customRoute.fileParam.directory) {
            fileDir = customRoute.fileParam.directory;
        }

        let fileArq = null;
        if (fileName && fileDir) {
            fileArq = fileUts.pathJoin(fileDir, fileName);

            if (fileUts.pathExist(fileArq)) {
                fileArq = fileUts.pathFull(fileArq);
            } else {
                fileArq = null;
            }
        }

        if (!fileArq) {
            return res.status(404).json(
                this.errorBuilderReturn([this.errorBuilder(404, `Arquivo ${fileName} não encontrado, no caminho ${fileDir} !`)])
            );
        }

        return this.makeCustomResponse(res, customRoute, fileArq);
    },

    async customMethodUpload(method, req, res, entityCfg, fileName, customRoute) {
        this.logRequest("CUSTOM", customRoute.name, method + " (Upload)", req);

        await this.doDelayedRoute(entityCfg, customRoute.name);

        let customVld = this.customValidationParams(method, customRoute.name, req, res, entityCfg);
        if (customVld) { return customVld; };

        let uploadFile = {
            originalName: req.file.originalname,
            size: req.file.size,
            destination: req.file.destination,
            fileName: req.file.filename
        }

        if (customRoute.database) {
            entityCfg[customRoute.database].push(uploadFile);
            fileUts.saveFile(fileName, entityCfg);
        }

        return this.makeCustomResponse(res, customRoute, { items: [uploadFile] });
    },

    customValidationParams(method, route, req, res, entityCfg) {
        if (!entityCfg.customValidation || entityCfg.customValidation.length === 0) {
            return null;
        }

        if (!req.params && !req.query && !req.body) {
            return null;
        }

        let errorList = [];
        let errorCustVld = null;

        entityCfg.customValidation.forEach(custVld => {
            let vldMethod = (!custVld.method || custVld.method.length === 0 || custVld.method.includes(method));
            let vldRoute = (!custVld.route || custVld.route.length === 0 || custVld.route.includes(route));
            let vldPathParam = (!custVld.from || custVld.from.length === 0 || custVld.from.includes('pathParam'));
            let vldQueryParam = (!custVld.from || custVld.from.length === 0 || custVld.from.includes('queryParam'));
            let vldPayload = (!custVld.from || custVld.from.length === 0 || custVld.from.includes('payload'));

            if (vldMethod && vldRoute) {
                if (vldPathParam && req.params) {
                    errorCustVld = this.executeCustomValidation(req.params, custVld);
                    if (errorCustVld) { errorList = [...errorList, ...errorCustVld] };
                }

                if (vldQueryParam && req.query) {
                    errorCustVld = this.executeCustomValidation(req.query, custVld);
                    if (errorCustVld) { errorList = [...errorList, ...errorCustVld] };
                }

                if (vldPayload && req.body) {
                    errorCustVld = this.executeCustomValidation(req.body, custVld);
                    if (errorCustVld) { errorList = [...errorList, ...errorCustVld] };
                }
            }
        });

        if (errorList.length > 0) {
            return res.status(400).json(this.errorBuilderReturn(errorList));
        }

        return null;
    },

    customValidationDatabase(method, route, database, res, entityCfg) {
        if (!entityCfg.customValidation || entityCfg.customValidation.length === 0) {
            return null;
        }

        if (!database) { database = []; }
        if (!Array.isArray(database)) { database = [database]; }

        if (database.length === 0) {
            return null;
        }

        let errorList = [];
        let errorCustVld = null;

        entityCfg.customValidation.forEach(custVld => {
            let vldMethod = (!custVld.method || custVld.method.length === 0 || custVld.method.includes(method));
            let vldRoute = (!custVld.route || custVld.route.length === 0 || custVld.route.includes(route));
            let vldDatabase = (!custVld.from || custVld.from.length === 0 || custVld.from.includes('database'));

            if (vldMethod && vldRoute && vldDatabase) {
                database.forEach(item => {
                    errorCustVld = this.executeCustomValidation(item, custVld);
                    if (errorCustVld) { errorList = [...errorList, ...errorCustVld] };
                });
            }
        });

        if (errorList.length > 0) {
            return res.status(400).json(this.errorBuilderReturn(errorList));
        }

        return null;
    },

    executeCustomValidation(param, custVld) {
        let errorCustVld = [];

        if (custVld.operation === "required") {
            custVld.field.forEach(vldField => {
                if (custVld.value === "false") {
                    if (param[vldField]) { errorCustVld.push(this.makeCustomValidError(custVld, vldField)); }
                } else {
                    if (!param[vldField]) { errorCustVld.push(this.makeCustomValidError(custVld, vldField)); }
                }
            });
        } else {
            Object.keys(param).forEach((property) => {
                if (custVld.field.includes(property)) {
                    let paramValue = param[property];
                    let custValue = custVld.value;

                    if (typeof paramValue === 'string') { paramValue = paramValue.toUpperCase(); }
                    if (typeof custValue === 'string') { custValue = custValue.toUpperCase(); }

                    let custVldError = false;

                    if (custVld.operation === "=" && paramValue == custValue) { custVldError = true; }
                    if (custVld.operation === "!=" && paramValue != custValue) { custVldError = true; }
                    if (custVld.operation === ">" && paramValue > custValue) { custVldError = true; }
                    if (custVld.operation === ">=" && paramValue >= custValue) { custVldError = true; }
                    if (custVld.operation === "<" && paramValue < custValue) { custVldError = true; }
                    if (custVld.operation === "<=" && paramValue <= custValue) { custVldError = true; }
                    if (typeof paramValue === 'string') {
                        if (custVld.operation === "begins" && paramValue.startsWith(custValue)) { custVldError = true; }
                        if (custVld.operation === "!begins" && !paramValue.startsWith(custValue)) { custVldError = true; }
                        if (custVld.operation === "contains" && paramValue.includes(custValue)) { custVldError = true; }
                        if (custVld.operation === "!contains" && !paramValue.includes(custValue)) { custVldError = true; }
                    }

                    if (custVldError) { errorCustVld.push(this.makeCustomValidError(custVld, property)); }
                }
            });
        }

        if (errorCustVld.length === 0) {
            return null;
        }
        return errorCustVld;
    },

    async doDelayedRoute(entityCfg, routeName) {
        if (!entityCfg.delayRoute || entityCfg.delayRoute.length === 0) { return; }

        let routeFound = entityCfg.delayRoute.find(route => route.name === routeName);
        if (!routeFound) { return; }
        if (!routeFound.delay || routeFound.delay <= 0) { return; }

        console.log(`Delaying route '${routeName}' for ${routeFound.delay} ms`);

        // Simulate slow route - wait for the configured delay
        await new Promise(resolve => setTimeout(resolve, routeFound.delay));
    },

    makeCustomValidError(custVld, field) {
        return this.errorBuilder(400, `${custVld.msgError} (${field}).`,
            `${custVld.msgError} (${field}). customValidation: ${custVld.name}.`);
    },

    getEntityKeyValue(entity, entityKeys, keysSeparator) {
        let listValues = [];
        entityKeys.forEach(entityKey => {
            listValues.push(entity[entityKey]);
        });

        if (!keysSeparator) { keysSeparator = ";"; }

        let entityKeyValue = listValues.join(keysSeparator);

        if (typeof entityKeyValue === 'string') {
            entityKeyValue = entityKeyValue.toUpperCase();
        }
        return entityKeyValue;
    },

    entityKeyCompare(entity, entityKeys, keysSeparator, id) {
        if (typeof id === 'string') {
            id = id.toUpperCase();
        }

        const entityKeyValue = this.getEntityKeyValue(entity, entityKeys, keysSeparator);

        return entityKeyValue == id; // o "tipo" pode diferente, então usa "==" 
    },

    applyAllQueryFilters(dbConfig, req, customSearchFields, queryCustomInf) {
        let database = genUts.copyArray(dbConfig);

        if (req.params) { database = dbUts.applyQueryFilter(database, req.params, customSearchFields); }

        if (req.query) { database = dbUts.applyQueryFilter(database, req.query, customSearchFields); }

        if (req.body) { database = dbUts.applyQueryFilter(database, req.body, customSearchFields); }

        const { pageSize = 20, page = 1, order, fields } = req.query;

        if (order) { dbUts.applyOrder(database, order); }

        const entitiesResponse = database.slice((page - 1) * pageSize, pageSize * page);

        if (fields) { dbUts.applyFields(entitiesResponse, fields); }

        let returnResponse = {
            items: entitiesResponse,
            hasNext: database.length > (page * pageSize),
            total: entitiesResponse.length
        }

        if (queryCustomInf) { returnResponse = { ...returnResponse, ...queryCustomInf }; }

        return returnResponse;
    },

    makeCustomResponse(res, customRoute, response) {
        let statusCodeResponse = 200;

        if (customRoute.responseType !== "array" && customRoute.responseType !== "file") {
            let database = response.items || [];
            database = database.length > 0 ? database[0] : {};

            statusCodeResponse = (database['statusCodeResponse']) || 200;

            if (database['errorResponse']) {
                response = this.errorBuilderReturn([this.errorBuilder(statusCodeResponse, database['errorResponse'])]);
            } else {
                response = database;
            }
        }

        if (customRoute.responseType === "file") {
            return res.status(statusCodeResponse).download(response);
        } else {
            return res.status(statusCodeResponse).json(response);
        }
    },

    logRequest(type, entityName, method, req) {
        console.log(
            new Date().toISOString().replace(/T/, ' ').replace(/\..+/, ''),
            '-', type,
            '-', entityName,
            '-', method,
            '- Path:', req.path,
            '- qryPrms:', req.query
        );
    },

    errorBuilder(cod, msg, help = null) {
        return {
            code: cod,
            message: msg,
            detailedMessage: help || msg
        }
    },

    errorTryCatchBuilder(cod, msg, error) {
        let descError = null;
        if (error.name) { descError = error.name; }
        if (error.message) { descError = `${descError} - ${error.message}`; }
        if (error.stack) { descError = `${descError} - ${error.stack}`; }

        return {
            code: cod,
            message: msg,
            detailedMessage: descError || msg
        }
    },

    errorBuilderReturn(errorList) {
        let errorReturn;
        let errorDetails;

        if (errorList.length === 1) {
            errorReturn = errorList[0];
            errorDetails = null;
        } else {
            errorReturn = this.errorBuilder(400, "Ocorreram vários erros, verifique os detalhes.");
            errorDetails = errorList;
        }

        if (errorDetails) { errorReturn["details"] = errorDetails; }

        return errorReturn;
    }
}