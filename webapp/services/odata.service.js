sap.ui.define([
    "sap/ui/base/Object",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/m/MessageBox"
], function (UIObject, Filter, FilterOperator, MessageBox) {
    "use strict";

    return UIObject.extend("nttdata.massivegeneratorfiori.service.ServiceOData", {

        constructor: function (oModel) {
            this.initializeModel(oModel);
        },

        initializeModel: function (oModel) {

            this.oDataModel = oModel
                
            if (!this.oDataModel) {
                this.oDataModel = sap.ui.getCore().getModel("mainService");
            }

            if (!this.oDataModel) {
                throw new Error("No se pudo obtener el ODataModel");
            }

        },

        read: function (entitySet, params = {}) {
            return new Promise((resolve, reject) => {
                try {
                    const {
                        filters = [],
                        sorters = [],
                        urlParameters = {},
                        path = ""
                    } = params;

                    const oFinalUrlParameters = {
                        $expand: urlParameters.expand || "",
                        $select: urlParameters.select || "",
                        $top: urlParameters.top || 1000,
                        $skip: urlParameters.skip || 0,
                        $orderby: urlParameters.orderby,
                        $inlinecount: urlParameters.inlinecount || "allpages",
                        ...urlParameters
                    };

                    Object.keys(oFinalUrlParameters).forEach(key => {
                        if (oFinalUrlParameters[key] === "" || 
                            oFinalUrlParameters[key] === undefined || 
                            oFinalUrlParameters[key] === null) {
                            delete oFinalUrlParameters[key];
                        }
                    });

                    this.oDataModel.read(`/${entitySet}${path}`, {
                        filters: filters,
                        sorters: sorters,
                        urlParameters: oFinalUrlParameters,
                        success: function (oData, oResponse) {
                            resolve({
                                results: oData.results || oData,
                                count: oData.__count || oData.results?.length || (Array.isArray(oData) ? oData.length : 0),
                                response: oResponse
                            });
                        },
                        error: function (oError) {
                            reject(this._formatError(oError));
                        }.bind(this)
                    });
                } catch (error) {
                    reject(this._formatError(error));
                }
            });
        },

        create: function (entitySet, payload, params = {}) {
            return new Promise((resolve, reject) => {
                try {
                    this.oDataModel.create(`/${entitySet}`, payload, {
                        success: function (oData, oResponse) {
                            resolve({oData, oResponse});
                        },
                        error: function (oError, oResponse) {
                            reject({oError, oResponse, oErrorDetailed: this._formatError(oError)});
                            // reject(this._formatError(oError));
                        }.bind(this),
                        urlParameters: params.urlParameters,
                        headers: params.headers
                    });
                } catch (error) {
                    reject(this._formatError(error));
                }
            });
        },

        update: function (entitySet, key, payload, params = {}) {
            return new Promise((resolve, reject) => {
                try {
                    this.oDataModel.update(`/${entitySet}('${key}')`, payload, {
                        success: function (oData, oResponse) {
                            resolve({
                                data: oData,
                                response: oResponse
                            });
                        },
                        error: function (oError) {
                            reject(this._formatError(oError));
                        }.bind(this),
                        urlParameters: params.urlParameters,
                        headers: params.headers
                    });
                } catch (error) {
                    reject(this._formatError(error));
                }
            });
        },

        delete: function (entitySet, key, params = {}) {
            return new Promise((resolve, reject) => {
                try {
                    this.oDataModel.remove(`/${entitySet}('${key}')`, {
                        success: function (oData, oResponse) {
                            resolve({
                                response: oResponse
                            });
                        },
                        error: function (oError) {
                            reject(this._formatError(oError));
                        }.bind(this),
                        urlParameters: params.urlParameters,
                        headers: params.headers
                    });
                } catch (error) {
                    reject(this._formatError(error));
                }
            });
        },

        createFilters: function (filterArray) {
            return filterArray.map(filter => {
                return new Filter(
                    filter.path,
                    filter.operator || FilterOperator.EQ,
                    filter.value1,
                    filter.value2
                );
            });
        },

        submitChanges: function () {
            return new Promise((resolve, reject) => {
                this.oDataModel.submitChanges({
                    success: function (oData) {
                        resolve(oData);
                    },
                    error: function (oError) {
                        reject(this._formatError(oError));
                    }.bind(this)
                });
            });
        },

        refresh: function (forceUpdate) {
            this.oDataModel.refresh(forceUpdate);
        },

        resetChanges: function () {
            this.oDataModel.resetChanges();
        },

        onRequestFailed: function (oEvent) {
            const oError = oEvent.getParameter("response");
            console.error("Error en la solicitud OData:", this._formatError(oError));
        },

        onRequestCompleted: function (oEvent) {},

        onMetadataFailed: function (oEvent) {
            MessageBox.error("Error al cargar los metadatos del servicio OData");
            console.error("Error en metadata OData:", oEvent);
        },

        _formatError: function (oError) {
            let errorMessage = "Error desconocido";
            let errorDetails = null;
            let statusCode = 500;

            try {
                if (oError.responseText) {
                    const responseObject = JSON.parse(oError.responseText);
                    errorMessage = responseObject.error.message.value || responseObject.error.message;
                    errorDetails = responseObject.error;
                    statusCode = oError.statusCode;
                } else if (oError.message) {
                    errorMessage = oError.message;
                    errorDetails = oError.details;
                    statusCode = oError.statusCode;
                }
            } catch (e) {
                errorMessage = oError.message || oError.statusText || "Error en la solicitud";
            }

            return {
                status: statusCode,
                message: errorMessage,
                details: errorDetails,
                originalError: oError
            };
        },
        getModel: function () {
            return this.oDataModel;
        }
    });
});