sap.ui.define([], function () {
    "use strict";
    const HTTP_STATUS_MESSAGES = {
        201: "Creado exitosamente",
        204: "Operación exitosa sin contenido",
        400: "Error en la solicitud",
        401: "No autorizado",
        403: "Acceso prohibido",
        404: "No encontrado",
        500: "Error interno del servidor"
    };
    return {
        formatHighlight: function(sStatusTitle, sStatusTM) {
            const isStatusTitleOK = sStatusTitle.includes('OK');
            const isStatusTMOK = sStatusTM.includes('OK');
            
            if (isStatusTitleOK && isStatusTMOK) {
                return 'Success';
            } else if (isStatusTitleOK || isStatusTMOK) {
                return 'Warning';
            } else {
                return 'Error';
            }
        },
        
        getStatusMessage: function(oResponse) {
           return `OK (${oResponse.statusCode} - ${oResponse.statusText || HTTP_STATUS_MESSAGES[oResponse.statusCode] || `Status Code: ${oResponse.statusCode}`})`;
        }
    };
});