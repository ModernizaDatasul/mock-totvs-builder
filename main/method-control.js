const genUts = require('../utils/generic-utils.js');
const dbUts = require('../utils/db-utils.js');
const fileUts = require('../utils/file-utils.js');

module.exports = {

    query(req, res, mainEntityCfg, type, entityName) {
        this.logRequest(type, entityName, 'GET (query)', req);

        let entityCfg = mainEntityCfg;
        let entityDB = entityCfg.database;

        if (type === "CHILDREN") {
            const childrenCfg = this.getChildrenCfg(req, res, entityCfg, entityName, entityDB);
            if (!childrenCfg.isChildrenCfg) {
                return childrenCfg;
            }
            entityCfg = childrenCfg;
            entityDB = childrenCfg.database;
        }

        let customVld = this.customValidationParams('GET', 'query', req, res, entityCfg);
        if (customVld) { return customVld; };

        let response = this.applyAllQueryFilters(entityDB, req, entityCfg.customSearchFields, entityCfg.queryCustomInf);

        return res.json(response);
    },

    get(req, res, mainEntityCfg, type, entityName) {
        this.logRequest(type, entityName, 'GET', req);

        let entityCfg = mainEntityCfg;
        let entityDB = entityCfg.database;

        if (type === "CHILDREN") {
            const childrenCfg = this.getChildrenCfg(req, res, entityCfg, entityName, entityDB);
            if (!childrenCfg.isChildrenCfg) {
                return childrenCfg;
            }
            entityCfg = childrenCfg;
            entityDB = childrenCfg.database;
        }

        const index = this.getRecordIndex('GET', 'get', req, res, entityCfg, type, entityDB);
        if (typeof (index) !== 'number') {
            return index;
        }

        return res.json(entityDB[index]);
    },

    create(req, res, mainEntityCfg, fileName, type, entityName) {
        this.logRequest(type, entityName, 'POST (create)', req);

        let entityCfg = mainEntityCfg;
        let entityDB = entityCfg.database;

        if (type === "CHILDREN") {
            const childrenCfg = this.getChildrenCfg(req, res, entityCfg, entityName, entityDB);
            if (!childrenCfg.isChildrenCfg) {
                return childrenCfg;
            }
            entityCfg = childrenCfg;
            entityDB = childrenCfg.database;
        }

        const newEntity = req.body;

        const entityId = this.getEntityKeyValue(newEntity, entityCfg.keys, entityCfg.keysSeparator);
        if (!req.params) req["params"] = {};
        if (type === "CHILDREN") {
            req.params["idSon"] = entityId;
        } else {
            req.params["id"] = entityId;
        }

        let customVld = this.customValidationParams('POST', 'create', req, res, entityCfg);
        if (customVld) { return customVld; };

        const index = entityDB.findIndex((entity) => {
            return this.entityKeyCompare(entity, entityCfg.keys, entityCfg.keysSeparator, entityId);
        });

        if (index !== -1) {
            return res.status(400).json(
                this.errorBuilderReturn([this.errorBuilder(400,
                    `Já existe ${entityCfg.entityLabel || entityCfg.entityName} com o código ${entityId}.`)])
            );
        }

        entityDB.push(newEntity);

        fileUts.saveFile(fileName, mainEntityCfg);

        return res.json(newEntity);
    },

    update(req, res, mainEntityCfg, fileName, type, entityName) {
        this.logRequest(type, entityName, 'PUT (update)', req);

        let entityCfg = mainEntityCfg;
        let entityDB = entityCfg.database;

        if (type === "CHILDREN") {
            const childrenCfg = this.getChildrenCfg(req, res, entityCfg, entityName, entityDB);
            if (!childrenCfg.isChildrenCfg) {
                return childrenCfg;
            }
            entityCfg = childrenCfg;
            entityDB = childrenCfg.database;
        }

        const index = this.getRecordIndex('PUT', 'update', req, res, entityCfg, type, entityDB);
        if (typeof (index) !== 'number') {
            return index;
        }

        Object.keys(req.body).forEach((property) => {
            if (!entityCfg.keys.includes(property)) {
                entityDB[index][property] = req.body[property];
            }
        });

        fileUts.saveFile(fileName, mainEntityCfg);

        return res.json(entityDB[index]);
    },

    delete(req, res, mainEntityCfg, fileName, type, entityName) {
        this.logRequest(type, entityName, 'DELETE', req);

        let entityCfg = mainEntityCfg;
        let entityDB = entityCfg.database;

        if (type === "CHILDREN") {
            const childrenCfg = this.getChildrenCfg(req, res, entityCfg, entityName, entityDB);
            if (!childrenCfg.isChildrenCfg) {
                return childrenCfg;
            }
            entityCfg = childrenCfg;
            entityDB = childrenCfg.database;
        }

        const index = this.getRecordIndex('DELETE', 'delete', req, res, entityCfg, type, entityDB);
        if (typeof (index) !== 'number') {
            return index;
        }

        entityDB.splice(index, 1);

        fileUts.saveFile(fileName, mainEntityCfg);

        return res.json({
            message: `${entityCfg.entityLabel || entityCfg.entityName} removido com sucesso !`
        });
    },

    getChildrenCfg(req, res, entityCfg, entityName, entityDB) {

        // Busca o Pai
        const index = this.getRecordIndex('GET', 'get', req, res, entityCfg, "FATHER", entityDB);
        if (typeof (index) !== 'number') {
            return index;
        }
        let entityFather = entityDB[index];

        let childrenCfgOrig = entityCfg.children.find((entity) => {
            return entity.entityName === entityName;
        });

        var childrenCfg = { ...childrenCfgOrig }

        childrenCfg["isChildrenCfg"] = true;

        let property = childrenCfg.property;
        if (!property) { property = childrenCfg.entityName; }

        if (!entityFather[property]) { entityFather[property] = []; }
        childrenCfg["database"] = entityFather[property];

        return childrenCfg;
    },

    getRecordIndex(method, route, req, res, entityCfg, type, entityDB) {
        let entityId = req.params.id;
        if (type === "FATHER") { entityId = req.params.idFather; }
        if (type === "CHILDREN") { entityId = req.params.idSon; }

        if (entityCfg.base64Key) { entityId = genUts.atob(entityId); }

        let customVld = this.customValidationParams(method, route, req, res, entityCfg);
        if (customVld) { return customVld; };

        const index = entityDB.findIndex((entity) => {
            return this.entityKeyCompare(entity, entityCfg.keys, entityCfg.keysSeparator, entityId);
        });

        if (index === -1) {
            return res.status(400).json(
                this.errorBuilderReturn([this.errorBuilder(400,
                    `${entityCfg.entityLabel || entityCfg.entityName} não encontrado com o código ${entityId}.`)])
            );
        }

        customVld = this.customValidationDatabase(method, route, entityDB[index], res, entityCfg);
        if (customVld) { return customVld; };

        return index;
    },

    customGet(req, res, entityCfg, customRoute) {
        this.logRequest("CUSTOM", customRoute.name, "GET", req);

        let customVld = this.customValidationParams('GET', customRoute.name, req, res, entityCfg);
        if (customVld) { return customVld; };

        let response = {};
        if (customRoute.database) {
            let database = genUts.copyArray(entityCfg[customRoute.database]);
            let queryCustomInf = customRoute.responseType == "array" ? customRoute.queryCustomInf : null;
            response = this.applyAllQueryFilters(database, req, entityCfg.customSearchFields, queryCustomInf);

            customVld = this.customValidationDatabase('GET', customRoute.name, response.items, res, entityCfg);
            if (customVld) { return customVld; };
        }

        return this.makeCustomResponse(res, customRoute, response);
    },

    customGetScript(req, res, entityCfg, customRoute, projRootDir) {
        this.logRequest("CUSTOM", customRoute.name, "GET (Script)", req);

        let customVld = this.customValidationParams('GET', customRoute.name, req, res, entityCfg);
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
            responseScript = customScript.get(req.params, req.query, database);
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
        }

        return res.status(statusCodeResponse).json(response);
    },

    customFile(req, res, method, entityCfg, customRoute) {
        this.logRequest("CUSTOM", customRoute.name, method + " (File)", req);

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

    customPost(req, res, entityCfg, fileName, customRoute) {
        this.logRequest("CUSTOM", customRoute.name, "POST", req);

        let customVld = this.customValidationParams('POST', customRoute.name, req, res, entityCfg);
        if (customVld) { return customVld; };

        let response = {};
        if (customRoute.database) {
            let database = genUts.copyArray(entityCfg[customRoute.database]);
            response = this.applyAllQueryFilters(database, req, entityCfg.customSearchFields, null);

            customVld = this.customValidationDatabase('POST', customRoute.name, response.items, res, entityCfg);
            if (customVld) { return customVld; };

            if (customRoute.savePayload && req.body && Object.keys(req.body).length > 0) {
                entityCfg[customRoute.database].push(req.body);
                fileUts.saveFile(fileName, entityCfg);
            }
        }

        return this.makeCustomResponse(res, customRoute, response);
    },

    customPostScript(req, res, entityCfg, fileName, customRoute, projRootDir) {
        this.logRequest("CUSTOM", customRoute.name, "POST (Script)", req);

        let customVld = this.customValidationParams('POST', customRoute.name, req, res, entityCfg);
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
            responseScript = customScript.post(req.params, req.query, req.body, database);
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
            if (responseScript.database) {
                entityCfg[customRoute.database] = responseScript.database;
                fileUts.saveFile(fileName, entityCfg);
            }
        }

        return res.status(statusCodeResponse).json(response);
    },

    customPostUpload(req, res, entityCfg, fileName, customRoute) {
        this.logRequest("CUSTOM", customRoute.name, "POST (Upload)", req);

        let customVld = this.customValidationParams('POST', customRoute.name, req, res, entityCfg);
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
        const entitiesResponse = database.slice((page - 1) * pageSize, pageSize * page);

        if (fields) { dbUts.applyFields(entitiesResponse, fields); }

        if (order) { dbUts.applyOrder(entitiesResponse, order); }

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