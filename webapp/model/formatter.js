sap.ui.define([], function () {
    "use strict";
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
        }
    };
});