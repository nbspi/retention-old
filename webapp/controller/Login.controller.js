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
			this.getAllRecords("getAllDB");

			//get User and Pass
			this.oLogin = new JSONModel("model/Login.json");
			this.getView().setModel(this.oLogin, "oLogin");

		},

		// ''--------------- LOGIN FUNCTION ---------------''

		onLogin: function (oEvent) {

			var sDBCompany = this.getView().byId("selectDatabase").getSelectedKey();
			var oLoginCredentials = {};
			oLoginCredentials.CompanyDB = sDBCompany;
			oLoginCredentials.UserName = this.oLogin.getData().Login.User;
			oLoginCredentials.Password = this.oLogin.getData().Login.Pass;
			$.ajax({
				url: "https://18.136.35.41:50000/b1s/v1/Login",
				data: JSON.stringify(oLoginCredentials),
				type: "POST",
				crossDomain: true,
                xhrFields: {
					withCredentials: true
				},
                error: function (xhr, status, error) {
                    MessageToast.show("Invalid Credentials");
                },
                context: this,
                success: function (json) { }
            }).done(function (results) {
                if (results) {
					sap.m.MessageToast.show("Welcome:" + this.oLogin.getData().Login.User);
					jQuery.sap.storage.put("Database", this.getView().byId("selectDatabase").getSelectedKey());
					jQuery.sap.storage.put("Usename", this.oLogin.getData().Login.User);
					jQuery.sap.storage.put("isLogin", true);
					jQuery.sap.intervalCall(1800000, this, "hidePanelAgain", [this]);
					sap.ui.core.UIComponent.getRouterFor(this).navTo("Main");
                }
		    }); 


		},
		//---- If Session is 30 mins Already 
		hidePanelAgain: function (passedthis) {
			MessageToast.show("Timed Out");
			jQuery.sap.storage.Storage.clear();
			this.oLogin.getData().Login.Pass = "";
			this.oLogin.refresh;
			sap.ui.core.UIComponent.getRouterFor(this).navTo("Login");
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
		},
		//---- Get All Database
		getAllRecords: function(queryTag){
			
			// var aReturnResult = [];
			$.ajax({
				url: "https://18.136.35.41:4300/app_xsjs/ExecQuery.xsjs?dbName=SBODEMOAU_SL&procName=spAppRetention&QUERYTAG="+ queryTag +"&value1=&value2=&value3=&value4=",
				type: "GET",
				dataType: "json",
				  beforeSend: function (xhr) {
					xhr.setRequestHeader("Authorization", "Basic " + btoa("SYSTEM:P@ssw0rd805~"));
			  	},
				error: function (xhr, status, error) {
					MessageToast.show(error);
				},
				success: function (json) {},
				context: this
			}).done(function (results) {
				if (results) {
					this.oMdlDatabase.setJSON("{\"Database\" : " + JSON.stringify(results) + "}");
					this.getView().setModel(this.oMdlDatabase, "oMdlDatabase");
				}
			});
		
		}

	});
});
