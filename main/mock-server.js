const express = require('express');
const multer = require('multer');
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

        if (!this.validEntitiesData(dataFile)) { return null; }
        this.createRouters(app, projRootDir, dataFile);

        const server = http.Server(app);
        return server;
    },

    readDataFile(dataFile) {
        // Faz a Leitura das Configurações de cada Entidade
        const entitiesFiles = fileUts.readDir(dataFile, '.json');
        const entitiesData = [];

        entitiesFiles.forEach(entityFile => {
            entitiesData.push({
                fileName: entityFile,
                config: JSON.parse(fileUts.readFileString(entityFile))
            });
        });

        return entitiesData;
    },

    validEntitiesData(entitiesData) {
        if (!entitiesData) { return false; }

        entitiesData.forEach(entityData => {
            if (entityData.config) {
                if (!entityData.config.mainPath) {
                    entityData.config.mainPath = "/" + entityData.config.entityName;
                }

                // Tratamento de Parâmetro descontinuado
                if (entityData.config.searchField) {
                    if (!entityData.config.customSearchFields) { entityData.config.customSearchFields = {}; }
                    entityData.config.customSearchFields["search"] = entityData.config.searchField;
                }
            }

            // Em desenvolvimento - Fazer a validação os arquivos

        });

        return true;
    },

    createRouters(app, projRootDir, entitiesData) {
        // Index - Mostra todas a Entidades carregadas
        this.makeIndexRoute(app, entitiesData);

        // Configura as Rotas para cada Entidade
        entitiesData.forEach(entityData => {
            this.makeCustomRoute(app, projRootDir, entityData.fileName, entityData.config);
            this.makeCHILDRENRoute(app, entityData.fileName, entityData.config);
            this.makeCRUDRoute(app, entityData.fileName, entityData.config);
        });
    },

    makeIndexRoute(app, entitiesData) {
        app.get('/', function (req, res) {
            return indexView.showIndex(req, res, entitiesData);
        });
    },

    makeCRUDRoute(app, fileName, entityCfg) {
        this.makeDefaultRoute(app, fileName, entityCfg, entityCfg.mainPath, "CRUD", entityCfg.entityName);
    },

    makeCHILDRENRoute(app, fileName, entityCfg) {
        if (!entityCfg.children) { return; }
        if (entityCfg.children.length === 0) { return; }

        entityCfg.children.forEach((children) => {
            let entityPath = entityCfg.mainPath + "/:idFather/" + children.entityName;
            this.makeDefaultRoute(app, fileName, entityCfg, entityPath, "CHILDREN", children.entityName);
        });
    },

    makeDefaultRoute(app, fileName, entityCfg, entityPath, type, entityName) {
        let idParam = '/:id';
        if (type === "CHILDREN") { idParam = '/:idSon' }

        app.get(entityPath, function (req, res) {
            return methodCtrl.query(req, res, entityCfg, type, entityName);
        });

        app.get(entityPath + idParam, function (req, res) {
            return methodCtrl.get(req, res, entityCfg, type, entityName);
        });

        app.post(entityPath, function (req, res) {
            return methodCtrl.create(req, res, entityCfg, fileName, type, entityName);
        });

        app.put(entityPath + idParam, function (req, res) {
            return methodCtrl.update(req, res, entityCfg, fileName, type, entityName);
        });

        app.delete(entityPath + idParam, function (req, res) {
            return methodCtrl.delete(req, res, entityCfg, fileName, type, entityName);
        });
    },

    makeCustomRoute(app, projRootDir, fileName, entityCfg) {
        if (!entityCfg.customRoutes) { return; }
        if (entityCfg.customRoutes.length === 0) { return; }

        entityCfg.customRoutes.forEach(customRoute => {
            const customPath = `${entityCfg.mainPath}${customRoute.path}`;

            switch (customRoute.method.toUpperCase()) {
                case 'GET':
                    if (customRoute.responseType && customRoute.responseType === "file") {
                        app.get(customPath, function (req, res) {
                            return methodCtrl.customFile(req, res, 'GET', entityCfg, customRoute);
                        });
                    } else {
                        if (customRoute.script) {
                            app.get(customPath, function (req, res) {
                                return methodCtrl.customGetScript(req, res, entityCfg, customRoute, projRootDir);
                            });
                        } else {
                            app.get(customPath, function (req, res) {
                                return methodCtrl.customGet(req, res, entityCfg, customRoute);
                            });
                        }
                    }
                    break;
                case 'POST':
                    if (customRoute.responseType && customRoute.responseType === "file") {
                        app.post(customPath, function (req, res) {
                            return methodCtrl.customFile(req, res, 'POST', entityCfg, customRoute);
                        });
                    } else {
                        if (customRoute.fileParam) {
                            const upload = this.makeUploadConfig(customRoute.fileParam);
                            app.post(customPath, upload.single('files'), function (req, res) {
                                return methodCtrl.customPostUpload(req, res, entityCfg, fileName, customRoute);
                            });
                        } else {
                            if (customRoute.script) {
                                app.post(customPath, function (req, res) {
                                    return methodCtrl.customPostScript(req, res, entityCfg, fileName, customRoute, projRootDir);
                                });
                            } else {
                                app.post(customPath, function (req, res) {
                                    return methodCtrl.customPost(req, res, entityCfg, fileName, customRoute);
                                });
                            }
                        }
                    }
                    break;
                default:
                    console.log('customRoutes: Método Inválido -', customRoute.method);
            }
        });
    },

    makeUploadConfig(fileParam) {
        const storage = multer.diskStorage({
            destination: function (req, file, cb) {
                cb(null, fileParam.directory);
            },
            filename: function (req, file, cb) {
                let fileName = fileUts.makeFileName(fileParam.fileName, file.originalname, req.params);
                cb(null, fileName);
            }
        });

        return multer({ storage });
    }
}
