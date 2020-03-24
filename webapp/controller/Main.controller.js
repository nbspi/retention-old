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

            this.router = this.getOwnerComponent().getRouter();


        },

        //-------------------------------------------
        onRoutePatternMatched: function(event) {
            var key = event.getParameter("name");
            this.byId("childViewSegmentedButton").setSelectedKey(key);
        },

        onAfterShow: function(router) {
            // router.navTo("Dashboard");
        },

        onSelect: function(event) {
            this.router = this.getOwnerComponent().getRouter();
            this.router.navTo(event.getParameter("key"));
        },

        //-------------------------------------------

        onMenuButtonPress: function() {
            var toolPage = this.byId("toolPage");
            toolPage.setSideExpanded(!toolPage.getSideExpanded());
        },

        onIconPress: function(oEvent) {
            // this.router.navTo("Dashboard");
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
                    // this.router.navTo("CreateUDT_UDF");
                    break;
                case "contractreport":
                    // this.router.navTo("CreateUDT_UDF");
                    break;
                case "transactionrecords":
                    this.router.navTo("TransactionOrder");
                    break;
                default:

            }
        },

        //ACTION BUTTON---------------------------
        handleOpen: function(oEvent) {
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
        onLogout: function() {

            $.ajax({
                url: "https://18.136.35.41:50000/b1s/v1/Logout",
                type: "POST",
                xhrFields: {
					withCredentials: true
				},
				crossDomain: true,
				error: function (xhr, status, error) {
					MessageToast.show("Invalid Credentials");
				},
				context: this,
                success: function(json) {
                    sap.m.MessageToast.show("Session End");
                    jQuery.sap.storage.Storage.clear();
                    sap.ui.core.UIComponent.getRouterFor(this).navTo("Login");
                }
            });
        }
    });
});