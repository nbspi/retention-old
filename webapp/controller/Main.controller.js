sap.ui.define([
  "jquery.sap.global",
	"sap/ui/Device",
	"sap/ui/core/Fragment",
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/json/JSONModel",
	"sap/m/Popover",
	"sap/m/Button",
	"sap/m/library",
	"sap/m/MessageToast",
	'sap/m/MessageBox'
], function(jQuery, Device, Fragment, Controller, JSONModel, Popover, Button, mobileLibrary, MessageToast, MessageBox) {
  "use strict";

  return Controller.extend("com.apptech.app-retention.controller.Main", {

    onInit: function () {

			this.oMdlMenu = new JSONModel("model/Menus.json");
			this.getView().setModel(this.oMdlMenu);

			this.router = this.getOwnerComponent().getRouter();

		},

		//-------------------------------------------
		onRoutePatternMatched: function (event) {
			var key = event.getParameter("name");
			this.byId("childViewSegmentedButton").setSelectedKey(key);
		},

		onAfterShow: function (router) {
			// router.navTo("Dashboard");
		},

		onSelect: function (event) {
			this.router = this.getOwnerComponent().getRouter();
			this.router.navTo(event.getParameter("key"));
		},

		//-------------------------------------------

		onMenuButtonPress: function () {
			var toolPage = this.byId("toolPage");
			toolPage.setSideExpanded(!toolPage.getSideExpanded());
		},

		onIconPress: function (oEvent) {
			// this.router.navTo("Dashboard");
		},

		onItemSelect: function (oEvent) {
			var sSelectedMenu = oEvent.getSource().getProperty("selectedKey");
			switch (sSelectedMenu) {
			case "paymentprocessing":
				this.router.navTo("RetentionPayable");
				break;
			case "configuration":
				// this.router.navTo("CreateUDT_UDF");
				break;
			default:

			}
		},

		onLogout: function (oEvent) {			

			$.ajax({
				url: "/destinations/BiotechSL/b1s/v1/Logout",
				type: "POST",
				contentType: "application/json",
				xhrFields: {
					withCredentials: true
				},
				error: function (xhr, status, error) {
					MessageToast.show(xhr.responseText);
				},
				context: this,
				success: function (json) {
					sap.m.MessageToast.show("Session End");
					jQuery.sap.storage.Storage.clear();
					sap.ui.core.UIComponent.getRouterFor(this).navTo("Login");
				}
			});
		}




  });
});
