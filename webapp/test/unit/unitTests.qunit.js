/* global QUnit */
QUnit.config.autostart = false;

sap.ui.getCore().attachInit(function () {
	"use strict";

	sap.ui.require([
		"nttdata/massive_generator_fiori/test/unit/AllTests"
	], function () {
		QUnit.start();
	});
});
