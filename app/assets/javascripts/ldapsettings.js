$(document).ready(function() {
    var ldapEnabled = $("#ldap-enabled");

    $("#additionalDefaultGroups")
      .chosen({search_contains:true, width:"250px", inherit_select_classes:true});

    var uri = new URI($(".uri-edit-component").data("uri"));
    var updateSchemeElement = function(uri) {
        $("#ldap-uri-scheme").text(uri.scheme() + "://")
    };

    var updateUriField = function(uri) {
        updateSchemeElement(uri);
        $("#ldap-uri").val(uri.toString());
    };

    var connectTestButton = $("#ldap-test-connection");
    var ldapUriHost = $("#ldap-uri-host");
    var ldapUriPort = $("#ldap-uri-port");

    var resetConnectTestButton = function() {
        connectTestButton.removeClass().addClass("btn btn-warning").text("Test Server connection");
    };

    var toggleConnectTestButton = function () {
        var enabled = ldapEnabled.is(":checked") && (ldapUriHost.val() !== "") && (ldapUriPort.val() !== "");
        connectTestButton.prop("disabled", !enabled);
    };

    var ldapTestLoginButton = $("#ldap-test-login");
    var ldapTestUsername = $("#ldap-test-username");

    var toggleTestLoginButton = function() {
        var enabled = ldapEnabled.is(":checked") && ldapTestUsername.val() !== "";
        ldapTestLoginButton.prop("disabled", !enabled);
    };

    // initialize editor from data-uri attribute
    (function(){
        updateSchemeElement(uri);
        ldapUriHost.attr("value", uri.hostname());
        ldapUriPort.attr("value", uri.port());
        if (uri.scheme() === "ldaps") {
            $("#ldap-uri-ssl").prop("checked", true)
        }
    })();

    $("#ldap-uri-ssl").change(function() {
        if ($("#ldap-uri-starttls").is(":checked")) {
            $("#ldap-uri-starttls").prop("checked", false);
        }
        if ($("#ldap-uri-ssl").is(":checked")) {
            uri.scheme("ldaps");
        } else {
            uri.scheme("ldap");
        }
        updateUriField(uri);
    });

    $("#ldap-uri-starttls").change(function() {
        if ($("#ldap-uri-ssl").is(":checked")) {
            $("#ldap-uri-ssl").prop("checked", false);
        }
        uri.scheme("ldap");
        updateUriField(uri);
    });

    ldapUriHost.on("keyup change", function() {
        uri.hostname($(this).val());
        updateUriField(uri);
        resetConnectTestButton();
        toggleConnectTestButton();
    });
    ldapUriPort.on("keyup change", function() {
        uri.port($(this).val());
        updateUriField(uri);
        resetConnectTestButton();
        toggleConnectTestButton();
    });

    var toggleFormEditableState = function(enabled){
        // toggle the disabled state of all input fields
        $("form#ldap-settings input").not(ldapEnabled).prop("disabled", !enabled);
        toggleConnectTestButton();
        toggleTestLoginButton();
    };
    ldapEnabled.change(function(){
        var enabledState = $(this).is(":checked");
        toggleFormEditableState(enabledState);
    });
    toggleFormEditableState(ldapEnabled.is(":checked"));

    var displayLdapHelp = function () {
        var ldapForm = $("#ldap-settings");
        ldapForm.find(".ldap-help").removeClass("hidden");
        ldapForm.find(".ad-help").addClass("hidden");
    };
    $("#type-ldap").change(displayLdapHelp);


    var displayAdHelp = function () {
        var ldapForm = $("#ldap-settings");
        ldapForm.find(".ldap-help").addClass("hidden");
        ldapForm.find(".ad-help").removeClass("hidden");
    };
    $("#type-activedirectory").change(displayAdHelp);

    // display correct fields
    (function(){
        if ($("#type-ldap").is(":checked")) {
            displayLdapHelp();
        } else {
            displayAdHelp();
        }
    })();

    connectTestButton.on("click", function() {
        $(this).text("Testing connection...").removeClass().addClass("btn").prop("disabled", true);

        var errorContainer = $("#ldap-connectionfailure-reason");

        $.ajax({
            type: "POST",
            url: appPrefixed("/a/system/ldap/testconnect"),

            data: {
                url: $("#ldap-uri").val(),
                systemUsername: $("#systemUsername").val(),
                systemPassword: $("#systemPassword").val(),
                useStartTls: $("#ldap-uri-starttls").is(":checked"),
                trustAllCertificates: $("#trust-all-certificates").is(":checked"),
                ldapType: $("#type-activedirectory").is(":checked") ? "ad" : "ldap"
            },
            success: function(connectResult) {
                if (connectResult.connected) {
                    connectTestButton.removeClass().addClass("btn btn-success").text("Connection ok!");
                    errorContainer.hide();
                } else {
                    connectTestButton.removeClass().addClass("btn btn-danger").text("Connection failed!");
                    if (connectResult.exception !== "") {
                        errorContainer.show().text("Connection failed: " + connectResult.exception);
                    }
                }
            },
            complete: function() {
                connectTestButton.prop("disabled", false);
            },
            error: function() {
                connectTestButton.removeClass().addClass("btn btn-danger").text("Test Server connection");
                errorContainer.show().text("Unable to check connection, please try again.");
            }
        });
    });

    ldapTestUsername.on("keyup change", function() {
        toggleTestLoginButton();
    });

    ldapTestLoginButton.on("click", function() {
        $(this).prop("disabled", true);
        $("#ldap-entry-attributes").html("");
        $("#ldap-group-list").html("");
        $("#attr-well").addClass("hidden");
        $.ajax({
            type: "POST",
            url: appPrefixed("/a/system/ldap/testlogin"),
            data: {
                url: $("#ldap-uri").val(),
                systemUsername: $("#systemUsername").val(),
                systemPassword: $("#systemPassword").val(),
                useStartTls: $("#ldap-uri-starttls").is(":checked"),
                trustAllCertificates: $("#trust-all-certificates").is(":checked"),
                ldapType: $("#type-activedirectory").is(":checked") ? "ad" : "ldap",
                searchBase: $("#searchBase").val(),
                searchPattern: $("#searchPattern").val(),
                displayNameAttribute: $("#displayNameAttribute").val(),
                principal: $("#ldap-test-username").val(),
                password: $("#ldap-test-password").val(),
                groupSearchBase: $("#groupSearchBase").val(),
                groupIdAttribute: $("#groupIdAttribute").val(),
                groupSearchPattern: $("#groupSearchPattern").val()
            },
            success: function(loginResult) {
                var isEmptyEntry = $.isEmptyObject(loginResult.entry);

                if (loginResult.connected && (loginResult.login_authenticated || !isEmptyEntry) ) {
                    var buttonMessage = loginResult.login_authenticated ? "Login ok!" : "User found!";
                    ldapTestLoginButton.removeClass().addClass("btn btn-success").text(buttonMessage);

                    Object.keys(loginResult.entry).forEach(function (element) {
                        $("#ldap-entry-attributes")
                          .append("<dt>" + element + "</dt>")
                          .append("<dd>" + loginResult.entry[element] + "</dd>");
                    });
                    if (typeof(loginResult.groups) !== "undefined") {
                        loginResult.groups.map(function (group) {
                            $("#ldap-group-list").append("<li>" + group + "</li>");
                        });
                    }
                    var login_auth_classes = "";
                    var entry_exists_classes = "";
                    if (loginResult.login_authenticated) {
                        login_auth_classes = "fa fa-check ldap-success";
                    } else {
                        if ($("ldap-test-password").val() === "") {
                            // we didn't even try to log in, just reading the entry.
                            login_auth_classes = "fa fa-meh-o";
                        } else {
                            login_auth_classes = "fa fa-meh-o ldap-failure";
                        }
                    }
                    if (isEmptyEntry) {
                        entry_exists_classes = "fa fa-meh-o ldap-failure";
                    } else {
                        entry_exists_classes = "fa fa-check ldap-success";
                    }

                    $("#login-authenticated").attr('class', login_auth_classes);
                    $("#entry-exists").attr('class', entry_exists_classes);

                    if (loginResult.exception) {
                        $("#login-exception").removeClass("hidden").text(loginResult.exception);
                    } else {
                        $("#login-exception").attr("class", "hidden").text("");
                    }
                    $("#attr-well").removeClass("hidden");
                } else {
                    ldapTestLoginButton.removeClass().addClass("btn btn-danger").text("Login failed!");
                    if (loginResult.exception) {
                        $("#login-exception").removeClass("hidden").text(loginResult.exception);
                    }
                    $("#attr-well").addClass("hidden");
                }
            },
            complete: function() {
                ldapTestLoginButton.prop("disabled", false);
            },
            error: function() {
                $("#attr-well").addClass("hidden");
                ldapTestLoginButton.removeClass().addClass("btn btn-danger").text("Test login");
            }
        });
    });
});