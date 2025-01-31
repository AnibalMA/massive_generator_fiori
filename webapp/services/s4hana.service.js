sap.ui.define([
    "sap/ui/core/Component",
    "./odata.service"
], function (Component, ServiceOData) {
    "use strict";
    const getComponentID = () => {
        let oComponentRegistry = Object.entries(Component.registry.all()).filter(([key]) => key.toLowerCase().includes("application") || key.toLowerCase().includes("container"))?.[0];
        if(oComponentRegistry) return oComponentRegistry?.[0];
        else console.log("No se encontró Component ID");
    };
    const COMPONENT_ID = getComponentID();
    let oDataService = new ServiceOData(Component.get(COMPONENT_ID).getModel());
    let oDataServiceTransport = new ServiceOData(Component.get(COMPONENT_ID).getModel("transport"));
    //oDataService.oDataModel.setUseBatch(false);

    return {
        /** 
         * Obtiene las OT's
         * @param {boolean} bisDefaultRequest - Indica si se debe obtener la OT por defecto
         * @returns {Promise} - Promesa con el resultado de la operación
        */
        fnGetOTs: function (bisDefaultRequest = false) {
            return new Promise((resolve, reject) => {
                let aFilters = [];
                if (bisDefaultRequest) {
                    aFilters.push(new sap.ui.model.Filter("isDefaultRequest", sap.ui.model.FilterOperator.EQ, true));
                }
                oDataServiceTransport.read("WorkbenchRequests", {
                    filters: aFilters
                })
                .then(response => {
                    resolve(response.results || []);
                })
                .catch(error => {
                    console.error("Error al obtener listado de OT's WB:", error);
                    reject(error);
                });
            });
        },
        /**
        * Obtiene el paquete por defecto
        @param {boolean} bisDefaultPackage - Indica si se debe obtener el paquete por defecto
        @returns {Promise} - Promesa con el resultado de la operación
        */
        fnGetPackage: function (bisDefaultPackage = false) {
            return new Promise((resolve, reject) => {
                let aFilters = [];
                if (bisDefaultPackage) {
                    aFilters.push(new sap.ui.model.Filter("isDefaultPackage", sap.ui.model.FilterOperator.EQ, true));
                }
                oDataServiceTransport.read("Packages",{
                    filters: aFilters
                })
                .then(response => {
                    resolve(response.results || []);
                })
                .catch(error => {
                    console.error("Error al obtener paquete:", error);
                    reject(error);
                });
            });
        },
        /**
         * 
         * @param {*} oData Objeto con los datos a actualizar {id: string, isDefaultPackage: boolean}
         * @returns {Promise} Promesa con el resultado de la operación
         */
        fnPutPackage: function (oData = {}) {
            return new Promise((resolve, reject) => {
                oDataServiceTransport.update(`Packages`, oData.id, oData)
                .then(response => {
                    resolve(response.results?.[0] || {});
                })
                .catch(error => {
                    console.error("Error al actualizar WB por defecto", error);
                    reject(error);
                });
            });
        },
        /**
         * 
         * @param {*} oData Objeto con los datos a actualizar {id: string, isDefaultRequest: boolean}
         * @returns {Promise} Promesa con el resultado de la operación
         */
        fnPutOT: function (oData = {}) {
            return new Promise((resolve, reject) => {
                oDataServiceTransport.update(`WorkbenchRequests`, oData.id, oData)
                .then(response => {
                    resolve(response.results?.[0] || {});
                })
                .catch(error => {
                    console.error("Error al actualizar paquete por defecto", error);
                    reject(error);
                });
            });
        },
        /**
         * 
         * @param {*} oBodyTile Objeto con los datos del Tile
         * @param {*} oBodyTM Objeto con los datos del Target Mapping
         * @returns {Promise} Promesa con el resultado de la operación
         */
        fnPostTileTM: function (oBodyTile, oBodyTM) {
            return new Promise(async (resolve, reject) => {
                let oResTile = await this.fnPostTile(oBodyTile);
                let oResTM = await this.fnPostTM(oBodyTM)

                resolve({oResTile, oResTM});
            });
        },
        fnPostTile: function(oBodyTile){
            return new Promise((resolve, reject) => {
                oDataService.create("PageChipInstances", oBodyTile).then((oData) => {
                    resolve(oData)
                }).catch((oErr) => {
                    resolve(oErr);
                });
            });
        },
        fnPostTM: function(oBodyTM){
            return new Promise((resolve, reject) => {
                oDataService.create("PageChipInstances", oBodyTM).then((oData) => {
                    resolve(oData)
                }).catch((oErr) => {
                    resolve(oErr);
                });
            });
        }
    };
});