const express = require('express');
const http = require('http');
const cors = require('cors');
const path = require('path');

const methodCtrl = require('./method-control.js');
const indexView = require('./index-view.js'); 
const fileUts = require('../utils/file-utils.js');

module.exports = {

    startMock(projRootDir) {
        const app = express();
        app.use(cors());
        app.use(express.json());

        const dataFile = this.readDataFile(path.join(projRootDir, 'data'));
        this.createRouters(app, dataFile);

        const server = http.Server(app);

        return server;
    },

    readDataFile(dataFile) {
        // Faz a Leitura das Configurações de cada Entidade
        const entitiesFiles = fileUts.readDir(dataFile);
        const entitiesData = [];

        entitiesFiles.forEach(entityFile => {
            entitiesData.push({
                fileName: entityFile,
                config: JSON.parse(fileUts.readFile(entityFile))
            });
        });

        return entitiesData;
    },

    createRouters(app, entitiesData) {
        // Index - Mostra todas a Entidades carregadas
        this.makeIndexRoute(app, entitiesData);

        // Configura as Rotas para cada Entidade
        entitiesData.forEach(entityData => {
            this.makeCustomRoute(app, entityData.fileName, entityData.config);
            this.makeCRUDRoute(app, entityData.fileName, entityData.config);
        });
    },

    makeIndexRoute(app, entitiesData) {
        app.get('/', function (req, res) {
            return indexView.showIndex(req, res, entitiesData);
        });
    },

    makeCRUDRoute(app, fileName, entityCfg) {
        const entityPath = "/" + entityCfg.entityName;

        app.get(entityPath, function (req, res) {
            return methodCtrl.query(req, res, entityCfg);
        });

        app.get(entityPath + '/:id', function (req, res) {
            return methodCtrl.get(req, res, entityCfg);
        });

        app.post(entityPath, function (req, res) {
            return methodCtrl.create(req, res, entityCfg, fileName);
        });

        app.put(entityPath + '/:id', function (req, res) {
            return methodCtrl.update(req, res, entityCfg, fileName);
        });

        app.delete(entityPath + '/:id', function (req, res) {
            return methodCtrl.delete(req, res, entityCfg, fileName);
        });
    },

    makeCustomRoute(app, fileName, entityCfg) {
        if (!entityCfg.customRoutes) { return; }
        if (entityCfg.customRoutes.length === 0) { return; }

        entityCfg.customRoutes.forEach(customRoute => {
            const customPath = `/${entityCfg.entityName}${customRoute.path}`;

            switch (customRoute.method.toUpperCase()) {
                case 'GET':
                    app.get(customPath, function (req, res) {
                        return methodCtrl.customGet(req, res, entityCfg, customRoute);
                    });
                    break;
                case 'POST':
                    app.post(customPath, function (req, res) {
                        return methodCtrl.customPost(req, res, entityCfg, fileName, customRoute);
                    });
                    break;
                default:
                    console.log('customRoutes: Método Inválido -', customRoute.method);
            }
        });
    }
}
