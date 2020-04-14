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

        onInit: function() {
            this.Database = jQuery.sap.storage.get("Database");
            this.UserName = jQuery.sap.storage.get("Usename");

            this.router = this.getOwnerComponent().getRouter();

            this.oMdlMenu = new JSONModel("model/Menus.json");
            this.getView().setModel(this.oMdlMenu);
            
            this.getView().byId("Admin").setText(this.UserName);

        },
        onRoutePatternMatched: function(event) {
            var key = event.getParameter("name");
            this.byId("childViewSegmentedButton").setSelectedKey(key);
        },
        onSelect: function(event) {
            this.router = this.getOwnerComponent().getRouter();
            this.router.navTo(event.getParameter("key"));
        },
        fMenuButtonPress: function() {
            var toolPage = this.byId("toolPage");
            toolPage.setSideExpanded(!toolPage.getSideExpanded());
        },
        onItemSelect: function(oEvent) {
            var sSelectedMenu = oEvent.getSource().getProperty("selectedKey");
            switch (sSelectedMenu) {
                case "purchaseorder":
                    this.router.navTo("PurchaseOrder");
                    break;
                case "paymentprocessing":
                    this.router.navTo("RetentionPayable");
                    break;
                case "configuration":
                     this.router.navTo("CreateUdtUdf");
                    break;
                case "contractreport":
                    // this.router.navTo("CreateUDT_UDF");
                    break;
                case "transactionrecords":
                    this.router.navTo("TransactionOrder");
                    break;
                case "projectCode":
                    this.router.navTo("ProjectCode");
                    break;
                default:

            }
        },
        //ACTION BUTTON---------------------------
        onHandleOpen: function(oEvent) {
            var oButton = oEvent.getSource();

            // create action sheet only once
            if (!this._actionSheet) {
                this._actionSheet = sap.ui.xmlfragment(
                    "com.apptech.app-retention.view.fragments.UserActionFragment",
                    this
                );

                this.getView().addDependent(this._actionSheet);
            }

            this._actionSheet.openBy(oButton);
        },
        fLogout: function() {

            $.ajax({
                url: "https://18.136.35.41:50000/b1s/v1/Logout",
                type: "POST",
                xhrFields: {
					withCredentials: true
				},
				crossDomain: true,
				error: function (xhr, status, error) {
					BusyIndicator.hide();
					var ErrorMassage = xhr.responseJSON["error"].message.value;
					MessageToast.show(ErrorMassage);
					AppUI5.fErrorLogs("OUSR","LogOut",this.UserName,"null",ErrorMassage,"Retention Logout",this.UserName,"null",this.Database,"null");        
				},
				context: this,
                success: function(json) {
                    sap.m.MessageToast.show("Session End");
                    jQuery.sap.storage.Storage.clear();
                    sap.ui.core.UIComponent.getRouterFor(this).navTo("Login");
                    this._data.UserAccount = "";
                }
            });
        }
    }); 
});