sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/json/JSONModel",
	"sap/m/MessageToast"
], function (Controller, JSONModel, MessageToast) {
	"use strict";

	return Controller.extend("com.apptech.app-retention.controller.Login", {

		onInit: function () {
			//get all databse
			this.oMdlDatabase = new JSONModel("model/Database.json");
			this.getView().setModel(this.oMdlDatabase, "oMdlDatabase");

			//get User and Pass
			this.oLogin = new JSONModel("model/Login.json");
			this.getView().setModel(this.oLogin, "oLogin");

		},

		// ''--------------- LOGIN FUNCTION ---------------''

		onLogin: function (oEvent) {
			// //	sap.ui.core.UIComponent.getRouterFor(this).navTo("Dashboard");
			var sUserName = this.getView().byId("Username");
			// // this.getView().byId("Username");
			// var sPassword = this.getView().byId("Password");
			var sDBCompany = this.getView().byId("selectDatabase").getSelectedKey();
			var oLoginCredentials = {};
			oLoginCredentials.CompanyDB = sDBCompany;
			oLoginCredentials.UserName = this.oLogin.getData().Login.User;
			oLoginCredentials.Password = this.oLogin.getData().Login.Pass;
			$.ajax({
				url: "https://18.136.35.41:50000/b1s/v1/Login",
				data: JSON.stringify(oLoginCredentials),
				type: "POST",
				xhrFields: {
					withCredentials: true
				},
				crossDomain: true,
				error: function (xhr, status, error) {
					MessageToast.show("Invalid Credentials");
				},
				context: this,
				success: function (json) {}
			}).done(function (results) {
				if (results) {
					sap.m.MessageToast.show("Welcome:" + sUserName.getValue());
					sap.ui.core.UIComponent.getRouterFor(this).navTo("Main");
				}
			});

		},

		action: function (oEvent) {
			var that = this;
			var actionParameters = JSON.parse(oEvent.getSource().data("wiring").replace(/'/g, "\""));
			var eventType = oEvent.getId();
			var aTargets = actionParameters[eventType].targets || [];
			aTargets.forEach(function (oTarget) {
				var oControl = that.byId(oTarget.id);
				if (oControl) {
					var oParams = {};
					for (var prop in oTarget.parameters) {
						oParams[prop] = oEvent.getParameter(oTarget.parameters[prop]);
					}
					oControl[oTarget.action](oParams);
				}
			});
			var oNavigation = actionParameters[eventType].navigation;
			if (oNavigation) {
				var oParams = {};
				(oNavigation.keys || []).forEach(function (prop) {
					oParams[prop.name] = encodeURIComponent(JSON.stringify({
						value: oEvent.getSource().getBindingContext(oNavigation.model).getProperty(prop.name),
						type: prop.type
					}));
				});
				if (Object.getOwnPropertyNames(oParams).length !== 0) {
					this.getOwnerComponent().getRouter().navTo(oNavigation.routeName, oParams);
				} else {
					this.getOwnerComponent().getRouter().navTo(oNavigation.routeName);
				}
			}
		}

	});
});
