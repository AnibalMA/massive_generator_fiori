sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "../model/map",
    "../services/s4hana.service",
    "../model/formatter"
], (Controller, Map, S4HService, formatter) => {
    "use strict";
    const oHTTPCodes = {
        OK: 200,
        CREATED: 201,
        ACCEPTED: 202,
        NO_CONTENT: 204,
        BAD_REQUEST: 400,
        UNAUTHORIZED: 401,
        FORBIDDEN: 403,
        NOT_FOUND: 404,
        INTERNAL_SERVER_ERROR: 500
    };
    return Controller.extend("nttdata.massivegeneratorfiori.controller.Home", {
        formatter: formatter,
        onInit() {
            this.fnListOTs();
            this.fnGetDefaultPackage();
            this.getView().setModel(new sap.ui.model.json.JSONModel([]), "oProcessResult");
            this.getView().setModel(new sap.ui.model.json.JSONModel([]), "OTWorkbenchs");
            this.getView().setModel(new sap.ui.model.json.JSONModel({}), "Package");
        },
        onLeerExcel: function () {
            let oFileUploader = this.byId("fileUploader");
            let oFile = oFileUploader.oFileUpload.files?.[0] || false;

            if (!oFile) {
                sap.m.MessageBox.error("Por favor seleccione un archivo Excel");
                return;
            }

            let fileName = oFile.name;
            let fileExtension = fileName.split('.').pop().toLowerCase();

            if (fileExtension !== "xlsx" && fileExtension !== "xls") {
                sap.m.MessageBox.error("Por favor seleccione un archivo Excel válido (.xlsx o .xls)");
                return;
            }

            return new Promise((resolve, reject) => {

                let reader = new FileReader();

                reader.onload = function (e) {
                    let data = new Uint8Array(e.target.result);
                    let workbook = XLSX.read(data, {
                        type: 'array'
                    });

                    let firstSheet = workbook.SheetNames[0];
                    let worksheet = workbook.Sheets[firstSheet];

                    let result = XLSX.utils.sheet_to_json(worksheet, {
                        raw: true,
                        defval: ""
                    });

                    let processedData = result.map(function (row) {
                        if (!row.ID_CATALOG) {
                            sap.m.MessageBox.error("El archivo no contiene la columna ID_CATALOG");
                            resolve([]);
                        }
                        return ({
                            oBodyTile: Map.fnGetTileJson(row),
                            oBodyTM: Map.fnGetTMJson(row)
                        });
                    });

                    console.log(processedData);
                    resolve(processedData);
                }.bind(this);

                reader.onerror = function (ex) {
                    console.log(ex);
                    sap.m.MessageBox.error("Error al procesar el archivo: " + ex.message);
                };

                reader.readAsArrayBuffer(oFile);
            });
        },
        onPressProcesar: async function () {
            let oKeyWB = this.getView().getModel("OTWorkbenchs").getProperty("/selectedOT").toString().trim();
            let oKeyPackage = this.getView().getModel("Package").getProperty("/id")?.toString().trim();

            if (!oKeyWB) {
                sap.m.MessageBox.error("Por favor seleccione una OT Workbench");
                return;
            }

            if (!oKeyPackage) {
                sap.m.MessageBox.error("Por favor ingrese un Paquete");
                return;
            }

            let oDefaultWB = await S4HService.fnGetOTs(true);
            let oDefaultPackage = await S4HService.fnGetPackage(true);

            if (!oDefaultWB || !oDefaultWB?.[0] || oDefaultWB[0].id != oKeyWB) {
                try {
                    await S4HService.fnPutOT({
                        id: oKeyWB,
                        isDefaultRequest: true
                    });
                } catch (oError) {
                    sap.m.MessageBox.error(oError.message);
                    return;
                }
            }

            if (!oDefaultPackage || !oDefaultPackage?.[0] || oDefaultPackage[0].id != oKeyPackage) {
                try {
                    await S4HService.fnPutPackage({
                        id: oKeyPackage,
                        isDefaultPackage: true
                    });
                } catch (oError) {
                    sap.m.MessageBox.error(oError.message);
                    return;
                }
            }

            let oData = await this.onLeerExcel();
            let aPromises = [];

            if (!oData) {
                return;
            }
            
            this.getView().byId("_IDGenButton").setBusy(true);

            oData.forEach((item) => {
                aPromises.push(S4HService.fnPostTileTM(item.oBodyTile, item.oBodyTM));
            });

            Promise.all(aPromises).then((oResult) => {
                console.log(oResult);
                
                let aFinalResult = [];

                oResult.forEach((oRow, iRowIndex) => {
                    aFinalResult.push({
                        id: iRowIndex + 1,
                        name: JSON.parse(JSON.parse(oData[iRowIndex].oBodyTile.configuration).tileConfiguration).display_title_text + " / " + JSON.parse(JSON.parse(oData[iRowIndex].oBodyTM.configuration).tileConfiguration).transaction?.code,
                        statusTile: oRow.oResTile.oErrorDetailed ? `Error (${oRow.oResTile.oErrorDetailed.status} - ${oRow.oResTile.oErrorDetailed.message})` : `OK (${oRow.oResTile.oResponse.statusCode} - ${oRow.oResTile.oResponse.statusText})`,
                        statusTM: oRow.oResTM.oErrorDetailed ? `Error (${oRow.oResTM.oErrorDetailed.status} - ${oRow.oResTM.oErrorDetailed.message})` : `OK (${oRow.oResTM.oResponse.statusCode} - ${oRow.oResTM.oResponse.statusText})` 
                    });
                });
                console.log("aFinalResult", aFinalResult);
                this.getView().getModel("oProcessResult").setData(aFinalResult);
                sap.m.MessageToast.show("Proceso terminado");
                this.getView().byId("fileUploader").clear();
                this.getView().byId("_IDGenButton").setBusy(false);
            }, this);
        },
        fnListOTs: async function () {
            let aData = await S4HService.fnGetOTs();
            let oDataSet = {
                selectedOT: aData.filter((item) => item.isDefaultRequest === true)?.[0]?.id,
                items: aData
            };
            this.getView().getModel("OTWorkbenchs").setData(oDataSet);
        },
        fnGetDefaultPackage: async function () {
            let oData = await S4HService.fnGetPackage(true);
            this.getView().getModel("Package").setData(oData?.[0] || {});
        }
    });
});