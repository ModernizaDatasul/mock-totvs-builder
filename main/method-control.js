const dbUts = require('../utils/db-utils.js');
const fileUts = require('../utils/file-utils.js');

module.exports = {

    entityConfig(req, res, entityCfg) {
        this.logRequest('GET (entityCfg)', req);

        let response = entityCfg;

        if (req.query && req.query.config) {
            response = {};
            response[req.query.config] = entityCfg[req.query.config];
        }

        return res.json(response);
    },

    query(req, res, entityCfg) {
        this.logRequest('GET (query)', req);

        let response = this.applyAllQueryFilters(entityCfg.database, req);

        return res.json(response);
    },

    get(req, res, entityCfg) {
        this.logRequest('GET', req);

        const entityResponse = entityCfg.database.find((entity) => {
            return this.entityKeyCompare(entity, entityCfg.keys, req.params.id);
        });

        if (!entityResponse) {
            return res.status(400).json(
                { error: `${entityCfg.entityLabel || entityCfg.entityName} não encontrado com o código ${req.params.id}` }
            );
        }

        return res.json(entityResponse);
    },

    create(req, res, entityCfg, fileName) {
        this.logRequest('POST (create)', req);

        const entityDB = entityCfg.database;
        const newEntity = req.body;
        const id = newEntity[entityCfg.keys[0]]; // Alterar para tratar chave composta

        const index = entityDB.findIndex((entity) => {
            return this.entityKeyCompare(entity, entityCfg.keys, id);
        });

        if (index !== -1) {
            return res.status(400).json(
                this.errorBuilder(400, `Já existe ${entityCfg.entityLabel || entityCfg.entityName} com o código ${id}`)
            );
        }

        entityDB.push(newEntity);

        fileUts.saveFile(fileName, entityCfg);

        return res.json(newEntity);
    },

    update(req, res, entityCfg, fileName) {
        this.logRequest('PUT (update)', req);

        const entityDB = entityCfg.database;
        const index = entityDB.findIndex((entity) => {
            return this.entityKeyCompare(entity, entityCfg.keys, req.params.id);
        });

        if (index === -1) {
            return res.status(400).json(
                this.errorBuilder(400, `${entityCfg.entityLabel || entityCfg.entityName} não encontrado com o código ${req.params.id}`)
            );
        }

        Object.keys(req.body).forEach((property) => {
            if (!entityCfg.keys.includes(property)) {
                entityDB[index][property] = req.body[property];
            }
        });

        fileUts.saveFile(fileName, entityCfg);

        return res.json(entityDB[index]);
    },

    delete(req, res, entityCfg, fileName) {
        this.logRequest('DELETE', req);

        const entityDB = entityCfg.database;
        const index = entityDB.findIndex((entity) => {
            return this.entityKeyCompare(entity, entityCfg.keys, req.params.id);
        });

        if (index === -1) {
            return res.status(400).json(
                this.errorBuilder(400, `${entityCfg.entityLabel || entityCfg.entityName} não encontrado com o código ${req.params.id}`)
            );
        }

        entityDB.splice(index, 1);

        fileUts.saveFile(fileName, entityCfg);

        return res.json({
            message: `${entityCfg.entityLabel || entityCfg.entityName} removido com sucesso !`
        });
    },

    entityKeyCompare(entity, entityKeys, id) {
        const entityKey = entityKeys[0]; // Alterar para tratar chave composta

        if (typeof entity[entityKey] === 'string') {
            return entity[entityKey].toUpperCase() === id.toUpperCase();
        }
        return entity[entityKey] == id; // o "tipo" pode diferente, então usa "==" 
    },

    customGet(req, res, entityCfg, customRoute) {
        this.logRequest(`GET (${customRoute.name})`, req);

        let database = dbUts.copyArray(entityCfg[customRoute.database]);

        let response = this.applyAllQueryFilters(database, req);

        return this.makeCustomResponse(res, customRoute, response);
    },

    customPost(req, res, entityCfg, fileName, customRoute) {
        this.logRequest(`POST (${customRoute.name})`, req);

        if (req.body && Object.keys(req.body).length > 0) {
            entityCfg[customRoute.database].push(req.body);
            fileUts.saveFile(fileName, entityCfg);
        }

        let database = dbUts.copyArray(entityCfg[customRoute.database]);

        let response = this.applyAllQueryFilters(database, req);

        return this.makeCustomResponse(res, customRoute, response);
    },

    applyAllQueryFilters(dbConfig, req) {
        let database = dbUts.copyArray(dbConfig);

        if (req.params) { database = dbUts.applyQueryFilter(database, req.params); }

        if (req.query) { database = dbUts.applyQueryFilter(database, req.query); }

        const { pageSize = 20, page = 1, order, fields } = req.query;
        const entitiesResponse = database.slice((page - 1) * pageSize, pageSize * page);

        if (fields) { dbUts.applyFields(entitiesResponse, fields); }

        if (order) { dbUts.applyOrder(entitiesResponse, order); }

        return {
            items: entitiesResponse,
            hasNext: database.length > (page * pageSize),
            total: entitiesResponse.length
        }
    },

    makeCustomResponse(res, customRoute, response) {
        let statusCodeResponse = 200;
        
        if (customRoute.responseType !== "array") {
            let database = response.items;
            database = database.length > 0 ? database[0] : {};

            statusCodeResponse = (database['statusCodeResponse']) || 200;

            if (database['errorResponse']) {
                response = this.errorBuilder(statusCodeResponse, database['errorResponse']);
            } else {
                response = database;
            }
        }

        return res.status(statusCodeResponse).json(response);
    },

    logRequest(method, req) {
        console.log(
            new Date().toISOString().replace(/T/, ' ').replace(/\..+/, ''),
            '-', method,
            '- Path:', req.path,
            '- qryPrms:', req.query
        );
    },

    errorBuilder(cod, msg) {
        return {
            code: cod,
            message: msg,
            detailedMessage: msg
        }
    }
}