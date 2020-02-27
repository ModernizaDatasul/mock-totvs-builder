const express = require('express');
const http = require('http');
const cors = require('cors');
const path = require('path');
const genUts = require('../utils/generic-utils.js');

const fileUts = require('../utils/file-utils.js');
const methodCtrl = require('./method-control.js');

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
            this.makeConfigRoute(app, entityData.config);
            this.makeCustomRoute(app, entityData.fileName, entityData.config);
            this.makeCRUDRoute(app, entityData.fileName, entityData.config);
        });
    },

    makeIndexRoute(app, entitiesData) {
        app.get('/', function (req, res) {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.write('<meta charset="utf-8">');

            res.write('<style>');
            res.write(' table { font-family: sans-serif; border-collapse: collapse; }');
            res.write(' th { font-size: 15px; border: 2px solid #000000; text-align: left; padding: 8px; }');
            res.write(' td { font-size: 14px; border: 2px solid #000000; text-align: left; padding: 8px; }');
            //res.write(' tr:nth-child(even) { background-color: #EEE7DB; }');
            res.write(' tr:first-child { background-color: #dddddd; }');
            res.write(' tr:nth-child(2) { background-color: #dddddd; }');
            res.write('</style>');

            res.write('<h1>MOCK TOTVS BUILDER - No Ar !!<h1>');
            res.write('<h3>Entidades Configuradas:<h3>');

            res.write('<table>');
            res.write(' <tr>');
            res.write('  <th colspan="4">Entidades</th>');
            res.write('  <th colspan="5">Rotas</th>');
            res.write(' </tr>');
            res.write(' <tr>');
            res.write('  <th>entityName</th>');
            res.write('  <th>entityLabel</th>');
            res.write('  <th>keys</th>');
            res.write('  <th>b64Key</th>');
            res.write('  <th>Name</th>');
            res.write('  <th style="text-align: center">method</th>');
            res.write('  <th>path</th>');
            res.write('  <th>responseType</th>');
            res.write('  <th style="text-align: center">database</th>');
            res.write(' </tr>');

            entitiesData.forEach(entityData => {
                const entityCfg = entityData.config;
                const entityRoutes = genUts.copyArray(entityData.config.customRoutes);

                entityRoutes.unshift({
                    name: "CRUD",
                    method: "get/post/put/delete",
                    path: "",
                    responseType: "object/array",
                    database: "database"
                });

                res.write(' <tr>');
                res.write(`  <td rowspan="${entityRoutes.length}">${entityCfg.entityName}</td>`);
                res.write(`  <td rowspan="${entityRoutes.length}">${entityCfg.entityLabel || ''}</td>`);
                res.write(`  <td rowspan="${entityRoutes.length}">${entityCfg.keys}</td>`);
                res.write(`  <td rowspan="${entityRoutes.length}">${entityCfg.base64Key || false}</td>`);

                entityRoutes.forEach((entityRoute, idx) => {
                    let dbRoute = entityCfg[entityRoute.database] || [];
                    let queryParam = `config=${entityRoute.database}&tableView=yes`;

                    if (idx != 0) {
                        res.write(' <tr>');
                    }
                    res.write(`  <td>${entityRoute.name}</td>`);
                    res.write(`  <td style="text-align: center">${entityRoute.method}</td>`);
                    res.write(`  <td>/${entityCfg.entityName}${entityRoute.path}</td>`);
                    res.write(`  <td>${entityRoute.responseType || 'object'}</td>`);
                    res.write('  <td style="text-align: center">');
                    res.write(`   <a href="http://localhost:3000/${entityCfg.entityName}/entityConfig?${queryParam}">`);
                    res.write(`    [${entityRoute.database} x${dbRoute.length}]`);
                    res.write('   </a>');
                    res.write('  </td>');
                    if (idx !== entityRoutes.length - 1) {
                        res.write(' </tr>');
                    }
                });

                res.write(' </tr>');
            });

            res.write('</table>');

            res.end();
        });
    },

    makeConfigRoute(app, entityCfg) {
        const configPath = `/${entityCfg.entityName}/entityConfig`;

        app.get(configPath, function (req, res) {
            return methodCtrl.entityConfig(req, res, entityCfg);
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
