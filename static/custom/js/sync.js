/**
 * Created with JetBrains PhpStorm.
 * User: Gabriel Colita
 * Date: 2/8/14
 * Time: 2:30 AM
 * A JavaScript Cart class using HTML5 Local Storage
 */
//console.log=function(){}; //disable console.log for production


var deb = function () {
}

//if ((location.host).match(/deva$/).length) {
//    deb = function () {
//    }
//}

var _ajaxTimeoutCall = false,
        _ajaxTimeoutTime = 3000;

$.ajaxSetup({
    beforeSend: function () {
        $('body').append('<img src="1px.png" onload="$(this).remove();" onerror="new syncHandler().weAreOffline();"/>');
    },
    error: function () {
        //new syncHandler().weAreOffline();
    }
});

String.prototype.repeat = function (num) {
    return new Array(num + 1).join(this);
};

/* No of calls done already */
var numSyncCall = 0;
/*  Total number of calls needed for a complete sync */
var numSyncMustCall = 16;
var numSyncCallOptimised = 15;
var syncInterval = 3600000;
//var syncInterval = 5000;
var counter_of_failled_attempts_to_get_table = 16;


/**
 * Global/Default User Settings
 * - overwritten by local storage
 */
function globalSettingsHandler() {
    this.isOnline = true;
    this.showCall = true;
    this.tabCollapsed = false;
    this.defaultPrinter = 0;
    this.bashScript = 'No Script';
    this.currentUser = localStorage.getItem('currentUser');
    this.tiltOpened = false;
    this.defaultPrice = false;

    this.categoryCollapsed = true; //$.parseJSON( localStorage.getItem('settings'))['show_category_on'];
    this.alphaScroll = true;
    this.defaultDrawer = 0;

    this.defaultDrawerKickOpen = false;
    this.managersPrinter = 0;
    this.printParkOrder = false;
    this.customers_copies = 1;
    this.canDeleteOrders = false;




    this.returnBoolean = function (value) {
        if (value == 'true' || value === true) {
            return true;
        } else {
            return false;
        }
    }

    this.setCurrentUser = function (userid) {
        this.currentUser = userid;
    }

    /**
     * Get online/offline state of app
     * @returns {boolean|*}
     */
    this.getOnlineState = function () {
//        deb();
        if (localStorage.getItem('isOnline' + this.currentUser) === null) {
            this.setOnlineState(this.isOnline);
        }
        return this.returnBoolean(localStorage.getItem('isOnline' + this.currentUser));
    }

    /**
     * Set Online State
     * @param value
     */
    this.setOnlineState = function (value) {
        if (this.currentUser > 0) {
            localStorage.setItem('isOnline' + this.currentUser, value);
            this.isOnline = value;

            if (value == true) {
                $('.glyphicon.glyphicon-cog').removeClass('color-red').addClass('color-green');
            } else {
                $('.glyphicon.glyphicon-cog').removeClass('color-green').addClass('color-red');
            }
        }
    }

    /**
     * Get Show Call Dialog State
     * @returns {boolean|*}
     */
    this.getShowCall = function () {
        if (localStorage.getItem('showCall') === null) {
            this.setShowCall(this.showCall);
        }
        return this.returnBoolean(localStorage.getItem('showCall'));
        /*
        if (localStorage.getItem('showCall' + this.currentUser) === null) {
            this.setShowCall(this.showCall);
        }
        return this.returnBoolean(localStorage.getItem('showCall' + this.currentUser));
        */
    }
    /**
     * Set Show Call Dialog
     * @param value
     */
    this.setShowCall = function (value) {
        if (this.currentUser > 0) {
            localStorage.setItem('showCall', value);
            this.showCall = value;
        }
        /*
        if (this.currentUser > 0) {
            localStorage.setItem('showCall' + this.currentUser, value);
            this.showCall = value;
        }
        */
    }



    this.setPrintParkOrder = function (value) {
        if (this.currentUser > 0) {
            localStorage.setItem('printParkOrder', value);
            this.printParkOrder = value;
        }
        /*
        if (this.currentUser > 0) {
            localStorage.setItem('printParkOrder' + this.currentUser, value);
            this.printParkOrder = value;
        }
        */
    }

    this.getPrintParkOrder = function () {
        if (localStorage.getItem('printParkOrder') === null) {
            this.setPrintParkOrder(this.printParkOrder);
        }
        return this.returnBoolean(localStorage.getItem('printParkOrder'));
        /*
        if (localStorage.getItem('printParkOrder' + this.currentUser) === null) {
            this.setPrintParkOrder(this.printParkOrder);
        }
        return this.returnBoolean(localStorage.getItem('printParkOrder' + this.currentUser));
        */
    }



    this.getCustomersCopiesNumber = function () {
        if (localStorage.getItem('customers_copies') === null) {
            this.setCustomersCopiesNumber(this.customers_copies);
        }
        return localStorage.getItem('customers_copies');
        /*
        if (localStorage.getItem('customers_copies' + this.currentUser) === null) {
            this.setCustomersCopiesNumber(this.customers_copies);
        }
        return localStorage.getItem('customers_copies' + this.currentUser)
        */
    }

    this.setCustomersCopiesNumber = function (value) {
        if (this.currentUser > 0) {
            localStorage.setItem('customers_copies', value);
            this.customers_copies = value;
        }
        /*
        if (this.currentUser > 0) {
            localStorage.setItem('customers_copies' + this.currentUser, value);
            this.customers_copies = value;
        }
        */
    }

    /**
     * Get Tab Collapsed State
     * @returns {boolean|*}
     */
    this.getTabCollapsed = function () {
        if (localStorage.getItem('tabCollapsed') === null) {
            this.setTabCollapsed(this.tabCollapsed);
        }
        return this.returnBoolean(localStorage.getItem('tabCollapsed'));
        /*
        if (localStorage.getItem('tabCollapsed' + this.currentUser) === null) {
            this.setTabCollapsed(this.tabCollapsed);
        }
        return this.returnBoolean(localStorage.getItem('tabCollapsed' + this.currentUser));
        */
    }


    /**
     * Sets if Tab should be collapsed
     * @param value
     */
    this.setTabCollapsed = function (value) {
        if (this.currentUser > 0) {
            localStorage.setItem('tabCollapsed', value);
            this.tabCollapsed = value;
        }
        /*
        if (this.currentUser > 0) {
            localStorage.setItem('tabCollapsed' + this.currentUser, value);
            this.tabCollapsed = value;
        }
        */
    }


    this.getCanDeleteOrders = function () {

//    deb();
        if (localStorage.getItem('canDeleteOrders' + this.currentUser) === null) {
            this.setCanDeleteOrders(this.canDeleteOrders);
        }
        return (localStorage.getItem('canDeleteOrders' + this.currentUser));
    }


    /**
     *
     *  Sets if delete option should be enabled
     */
    this.setCanDeleteOrders = function (value) {
        if (this.currentUser > 0) {
            localStorage.setItem('canDeleteOrders' + this.currentUser, value);
            this.canDeleteOrders = value;
        }
    }


    /**
     * Get Category Collapsed State
     * @returns {boolean|*}
     */
    this.getCategoryCollapsed = function () {
//        deb();
        if (localStorage.getItem('categoryCollapsed') === null) {
                this.setCategoryCollapsed(this.categoryCollapsed);
        }
        return this.returnBoolean(localStorage.getItem('categoryCollapsed'));
        /*
            if (localStorage.getItem('categoryCollapsed' + this.currentUser) === null) {
                this.setCategoryCollapsed(this.categoryCollapsed);
            }
            return this.returnBoolean(localStorage.getItem('categoryCollapsed' + this.currentUser));
        }
        */
    }
    /**
     * Set if Category should be collapsed
     * @param value
     */
    this.setCategoryCollapsed = function (value) {
//        deb();
        if (this.currentUser > 0) {
            localStorage.setItem('categoryCollapsed', value);
            this.categoryCollapsed = value;
        }
        /*
        if (this.currentUser > 0) {
            localStorage.setItem('categoryCollapsed' + this.currentUser, value);
            this.categoryCollapsed = value;
        }
        */
    }


    this.getAlphaScroll = function () {
        if (localStorage.getItem('alphaScroll') === null) {
            this.setAlphaScroll(this.alphaScroll);
        }
        return this.returnBoolean(localStorage.getItem('alphaScroll'));

    }

    this.setAlphaScroll = function (value) {
            localStorage.setItem('alphaScroll', value);
            this.alphaScroll = value;
    }




    this.drawersIds = [];

    this.addDrawerToList = function (drawerId) {
        this.drawersIds.push(drawerId);
    }

    this.getlistOfDrawers = function () {
        return this.drawersIds;
    }

    this.getDefaultManagersPrinter = function ()
    {
        if (localStorage.getItem('managersPrinter') === null) {
            this.setDefaultManagersPrinter('managersPrinter');
        }
        return localStorage.getItem('managersPrinter');
        /*
        if (localStorage.getItem('managersPrinter' + this.currentUser) === null) {
            this.setDefaultManagersPrinter(this.managersPrinter);
        }
        return localStorage.getItem('managersPrinter' + this.currentUser);
        */
    }

    this.setDefaultManagersPrinter = function (value)
    {
//        deb();
        if (this.currentUser > 0) {
            localStorage.setItem('managersPrinter', value);
            this.managersPrinter = value;
        }
        /*
        if (this.currentUser > 0) {
            localStorage.setItem('managersPrinter' + this.currentUser, value);
            this.managersPrinter = value;
        }
        */
    }


    /**
     * Get Default Drawer
     * @returns  number of printer
     */
    this.getDefaultDrawer = function () {
//        deb();
        if (localStorage.getItem('defaultDrawer') === null) {
            this.setDefaultDrawer(this.defaultDrawer);
        }
//        return this.returnBoolean(localStorage.getItem('defaultDrawer'+this.currentUser));
//        return this.defaultDrawer;
        return localStorage.getItem('defaultDrawer');
        /*
        if (localStorage.getItem('defaultDrawer' + this.currentUser) === null) {
            this.setDefaultDrawer(this.defaultDrawer);
        }
//        return this.returnBoolean(localStorage.getItem('defaultDrawer'+this.currentUser));
//        return this.defaultDrawer;
        return localStorage.getItem('defaultDrawer' + this.currentUser);
        */
    }

    /**
     * Sets number of default printer
     * @param value
     */
    this.setDefaultDrawer = function (value) {
//        deb();
        if (this.currentUser > 0) {
            localStorage.setItem('defaultDrawer', value);
            this.defaultDrawer = value;
        }
        /*
        if (this.currentUser > 0) {
            localStorage.setItem('defaultDrawer' + this.currentUser, value);
            this.defaultDrawer = value;
        }
        */
    }

    /**
     * Get Tab Collapsed State
     * @returns {boolean|*}
     */
    this.getDefaultPrinter = function () {
        if (localStorage.getItem('defaultPrinter') === null) {
            this.setDefaultPrinter(this.defaultPrinter);
        }
        return localStorage.getItem('defaultPrinter');
        /*
        if (localStorage.getItem('defaultPrinter' + this.currentUser) === null) {
            this.setDefaultPrinter(this.defaultPrinter);
        }
        return localStorage.getItem('defaultPrinter' + this.currentUser);
        */
    }

    /**
     * Set Default Printer
     * @param value
     */
    this.setDefaultPrinter = function (value) {
        if (this.currentUser > 0) {
            localStorage.setItem('defaultPrinter', value);
            this.defaultPrinter = value;
        }
        /*
        if (this.currentUser > 0) {
            localStorage.setItem('defaultPrinter' + this.currentUser, value);
            this.defaultPrinter = value;
        }
        */
    }

    /**
     * Get Bash script
     * @returns {boolean|*}
    */
    this.getBashScript = function () {
        if (localStorage.getItem('bashScript') === null) {
            this.setBashScript(this.bashScript);
        }
        return localStorage.getItem('bashScript');
        /*
        if (localStorage.getItem('bashScript' + this.currentUser) === null) {
            this.setBashScript(this.bashScript);
        }
        return localStorage.getItem('bashScript' + this.currentUser);
        */
    }

    /**
     * Set Bash script
     * @param value
     */

    this.setBashScript = function (value) {
        localStorage.setItem('bashScript', value);
        this.bashScript = value;
        /*
        if (this.currentUser > 0) {
            localStorage.setItem('bashScript' + this.currentUser, value);
            this.bashScript = value;
        }
        */
    }

    this.getSimpleDisplay = function () {
        if (localStorage.getItem('simpleDisplay') === null) {
            this.setSimpleDisplay(this.simpleDisplay);
        }
        return localStorage.getItem('simpleDisplay');
    }


    this.setSimpleDisplay = function (value) {
            localStorage.setItem('simpleDisplay', value);
            this.simpleDisplay = value;
    }


    this.getTiltOpened = function () {
        if (localStorage.getItem('tiltOpened') === null) {
            this.settiltOpened(this.tiltOpened);
        }
        return localStorage.getItem('tiltOpened');
    }

    this.setTiltOpened = function (value) {
        if (this.currentUser > 0) {
            localStorage.setItem('tiltOpened', value);
            this.tiltOpened = value;
        }
    }

    this.getDefaultPrice = function () {
        if (localStorage.getItem('defaultPrice') === null) {
            this.setDefaultPrice(this.defaultPrice);
        }
        return localStorage.getItem('defaultPrice');
        /*
        if (localStorage.getItem('defaultPrice' + this.currentUser) === null) {
            this.setDefaultPrice(this.defaultPrice);
        }
        return localStorage.getItem('defaultPrice' + this.currentUser);
        */
    }

    this.setDefaultPrice = function (value) {
        if (this.currentUser > 0) {
            localStorage.setItem('defaultPrice', value);
            this.defaultPrice = value;
        }
        /*
        if (this.currentUser > 0) {
            localStorage.setItem('defaultPrice' + this.currentUser, value);
            this.defaultPrice = value;
        }
        */
    }


}
var globalSettings = new globalSettingsHandler();

function setSyncComplete(tableCounter) {
    var numberOfTables = 17;
    console.log("sync_finished " + ' ' + numSyncCall);

    numSyncCall++;
    console.log("tablecounter " + tableCounter);
    if (tableCounter == numberOfTables)
    {
        console.log("yes , equal");

        $.ajax({
            url: "/data",
            type: "POST",
            context: document.body,
            data: {'request': 'getServerTime2', 'token': getToken()},
            success: function (data)
            {
                saveToken(data._token);
                localStorage.setItem("posLastSynced", data.time);

//                setTimeout(function() {
//                alert("1 reloading");
                window.location.reload();
//                },4000);

                counter_of_failled_attempts_to_get_table = 16;
            },
            error: function () {
                console.log("error on synccomplete");
                alert("error on synccomplete");
            }
        });
    }


}




var nameOfDbCurrent = 'posapp';
var namesOfDbReserved = ['posappReserved', 'posapp'];

// a strange error is experienced, sometimes name of db gets locked so we need change it
var syncHandler = function () {
    /*
     var loaderElement = $('#loader');
     var useIndexedDb = false;
     var db = false;

     var __construct = function() {
     var v = localStorage.getItem('databaseVersion');

     v += "";
     if (v == null || v == 'null') {
     v = '';
     }
     try {
     db = openDatabase('posapp', v, 'POS WebSql DB', 2 * 1024 * 1024);
     } catch (err) {
     console.log("Caught Error: " + err);
     }
     */
    var loaderElement = $('#loader');
    var useIndexedDb = false;
    var db = false;

    /**
     * Constructor Class
     * - Saves what type of database is being used
     * - Creates/opens the database
     */
    var __construct = function () {

        var v = localStorage.getItem('databaseVersion');
        v += "";
        if (v == null || v == 'null') {
            v = '';
        }

        try {
            db = openDatabase(nameOfDbCurrent, v, 'POS WebSql DB', 2 * 1024 * 1024);
        }
        catch (e) {


            // Error handling code goes here.
            if (e == 2) {
                // Version number mismatch.
                console.log("Invalid database version.");
            } else {
                console.log("Unknown error " + e + ".");
            }

            if (nameOfDbCurrent == namesOfDbReserved[0]) {
                nameOfDbCurrent = namesOfDbReserved[1];
            } else {
                nameOfDbCurrent = namesOfDbReserved[0];
            }

            try {
                db = openDatabase(nameOfDbCurrent, v, 'POS WebSql DB', 2 * 1024 * 1024);
            }
            catch (e) {
                // Error handling code goes here.
                if (e == 2) {
                    // Version number mismatch.
                    console.log(" Second time Invalid database version.");
                } else {
                    console.log("Second time Unknown error " + e + ".");
                }

            }


        }
    }();

    this.weAreOffline = function () {
        if (window.tryOutOnline == undefined) {
            globalSettings.setOnlineState(false);
            $.sidr('close', 'sidr-options');
            toastr.options = {
                "closeButton": false,
                "debug": false,
                "positionClass": "toast-top-full-width",
                "onclick": null,
                "showDuration": "300",
                "hideDuration": "1000",
                "timeOut": "10000",
                "extendedTimeOut": "1000",
                "showEasing": "swing",
                "hideEasing": "linear",
                "showMethod": "fadeIn",
                "hideMethod": "fadeOut"
            };

            toastr.error('Api host is unreachable or internet connection is missing.<br />Please check your internet connection and switch to "Online" mode (from user settings) to try again.', 'Internet Connection Error');
            window.tryOutOnline = true;
            this.stopLazySync();
            globalSettings.setOnlineState(false);

        }
    };

    this.dismissCallForGood = function (number) {
        $.ajax({
            url: 'http://' + window.location.host + '/call_handler/capture/' + number + '/hang',
            type: "GET",
            context: document.body
        });
    };


    this.tables = '';
    this.getTable = function (nameOfTable)
    {
        $.ajax({
            url: "/data",
            type: "POST",
            context: document.body,
            data: {request: nameOfTable, 'token': getToken()},
            success: function (data) {
                saveToken(data._token);
                this.tables = data.sync;


            },
            error: function (XMLHttpRequest, textStatus, errorThrown) {
                console.log("failed downloading ");
                alert("failed getting list of tables");
            }
        });
    }

    var numberOfLoads = 0;
    this.doCompleteSync = function (tables) {
        if (numberOfLoads == 0)
        {
            numberOfLoads++;
            loaderElement.html('<p>Preparing application for the first use...</p>');
//
//      if (typeof  tables == 'undefined')
//      {
//        this.getTable('doCompleteSync');
//      } else {
//
//      }
//            alert("starting");

            this.doAjaxRequest('doCompleteSync');
        }

    };


    var allTables = [], tableCounter = 0;

    var numberOfLoggingOut = 0;
    this.doAjaxRequest = function (action) {


        var thisClass = this;
        var sentAction = action;

        console.log("doing ajax request " + action);

        $.ajax({
            url: "/data",
            type: "POST",
            context: document.body,
            data: {request: action, 'token': getToken()},
            success: function (data) {
                saveToken(data._token);

                if (data.sync !== undefined)
                {
                    thisClass.createDbTables(data.sync);

                    for (var key in data.sync) {
                        if (data.sync.hasOwnProperty(key)) {
                            loaderElement.html('<p>Syncing ' + key + '</p>');

                            console.log('<p>Syncing ' + key + '</p>');
                            if (numberOfLoggingOut == 0) {


                                for (var key in data.sync) {
                                    if (data.sync.hasOwnProperty(key))
                                    {
                                        allTables.push(data.sync[key].action);
                                        thisClass.doAjaxRequest(data.sync[key].action);
                                    }
                                }
                                numberOfLoggingOut++;
                            }
                        }
                    }
                } else
                {


                    for (var table_name in data) {
                        if (data.hasOwnProperty(table_name) && table_name != '_token') {
                            var col = [],
                                    db_data = [],
                                    sql = '',
                                    insert = {};
                            for (var entry in data[table_name]) {
                                if (data[table_name].hasOwnProperty(entry))
                                {
                                    db_data = [];
                                    for (var k in data[table_name][entry]) {
                                        if (data[table_name][entry].hasOwnProperty(k)) {
                                            db_data.push(data[table_name][entry][k]);
                                            if (col.indexOf(k) == -1) {
                                                col.push(k);
                                            }
                                        }
                                    }
                                    if (sql.length == 0) {
//                                        console.log(table_name + ' ' + date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds());

                                        sql = 'INSERT INTO "' + table_name + '"("' + col.join('", "') + '") VALUES (' + "?,".repeat(col.length).slice(0, -1) + ')';
                                        insert['sql'] = sql;
                                        insert['data'] = [];
                                    }
                                    insert['data'].push(db_data);
                                }
                            }

//        if (action =='getUsers'){
//            alert("this data");
//        }

//                            thisClass.lazyQuery(insert, 0, "setSyncComplete");
                            thisClass.lazyQueryOptimised(insert, 0, "setSyncComplete", '', thisClass);
                        }
                    }
                }
            },
            error: function (XMLHttpRequest, textStatus, errorThrown) {

                console.log("failed downloading ");

                setTimeout(function () {
                    console.log("started waiting ");
                    thisClass.doAjaxRequest(sentAction);
                }, 4000);


            }


        });
    };

    this.isLocal = function () {
        return localStorage.getItem("posLastSynced");
    };

    this.getDbInstance = function () {
        return db;
    };

    counter = 0;
    counter2 = 0;
    this.lazyQueryOptimised = function (q, i, callback, params, thisClass)
    {
//        thisClass.doAjaxRequest(allTables[tableCounter]);
//        tableCounter++;

        if (q != undefined && q.sql != undefined && q.data != undefined && q.data.length > i)
        {
            db.transaction(function (tx)
            {
                var totLength = q.data.length;
                for (var i = 0; i < totLength; i++)
                {
                    tx.executeSql(q.sql, q.data[i], function ()
                    {
//                        thisClass.lazyQuery(q, parseInt(i) + 1, callback, params);
                    }, function (el, er) {
                        console.warn('We have an lazyQueryOptimised error :');
                        console.log(q);
                        console.log("at index " + q);
                        console.warn(el);
                        console.warn(er);
                        console.warn('-------------------------------------');
                    });
                }
            }, function () {
                console.log(q.sql + '__' + "faileeeed!!!!");
                alert(q.sql + '__' + "faileeeed!!!!");
            }, function () {
                // all is fine
                var date = new Date();
                console.log(q.sql + '__' + date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds());
                console.log('counter is ' + counter);

                counter++;
//                loaderElement.html('<p>loading ' + allTables[tableCounter] + '</p>');
       //         $('#status_text').text('<p>loading ' + allTables[tableCounter] + '</p>');
//                <span id="status_text">Fetching online data </span>
//                $('#fullScreenLoader').text('Fetching ' +allTables[tableCounter]);

//                if (typeof allTables[tableCounter] == 'undefined')
                {
                    setSyncComplete(tableCounter);
                    tableCounter++;
                    return true;
                }

//                thisClass.doAjaxRequest(allTables[tableCounter]);
//                tableCounter++;

//                setSyncComplete();

            });

        }
        else
        {
//            if (typeof allTables[tableCounter] == 'undefined')
//            {

            setSyncComplete(tableCounter);
            tableCounter++;
            return true;
//            }

//            thisClass.doAjaxRequest(allTables[tableCounter]);
//            tableCounter++;
//             alert("vcjknf");
            console.log("table was empty");
//            setSyncComplete();

        }

    };


    this.lazyQuery = function (q, i, callback, params) {
        var thisClass = this;

        if (q.sql != undefined && q.data != undefined && q.data.length > i)
        {
            db.transaction(function (tx) {
                tx.executeSql(q.sql, q.data[i], function ()
                {
                    thisClass.lazyQuery(q, parseInt(i) + 1, callback, params);
                }, function (el, er) {
                    console.warn('We have an lazy query error here:');
                    console.log(q);
                    console.warn(el);
                    console.warn(er);
                    console.warn('-------------------------------------');
                });
            });
        } else {
            if (window[callback] != undefined) {
                if (params == undefined) {
                    window[callback]();
                } else {
                    params = base64_decode(params);
                    params = JSON.parse(params);
                    window[callback](params[0], params[1]);
                }
            }
        }
    };

    this.dropDatabase = function (fromLogoutBtn) {
        fromLogoutBtn = fromLogoutBtn || false;
        db.changeVersion(db.version, "-1", function (tx) {
            tx.executeSql('SELECT "name" FROM "sqlite_master" WHERE "type"="table" AND "name" NOT LIKE "|_%" ESCAPE "|"', [], function (tx, results) {
                for (var i = 0; i < results.rows.length; i++) {
                    tx.executeSql('DROP TABLE ' + results.rows.item(i).name);
                }
            });
        },
                function (a, b) {
                    console.warn(a);
                    console.warn(b);
                }, function () {
            /*
             Surf through all local storage items and delete all except
             user settings
             */


//              this.isOnline        = true;
//    this.showCall        = true;
//    this.tabCollapsed    = false;
//    this.defaultPrinter  = 1;
//    this.bashScript      = 'scriptA';
//    this.currentUser     = localStorage.getItem('currentUser');
//	this.tiltOpened 	 = false;
//	this.defaultPrice 	 = false;
//
//    this.categoryCollapsed =  false; //$.parseJSON( localStorage.getItem('settings'))['show_category_on'];
//
//
//    this.defaultDrawerKickOpen = false;
//


            for (var i = 0; i < localStorage.length; i++) {
                var str = localStorage.key(i);

                if (
                        str.indexOf('isOnline') > -1 ||
                        str.indexOf('showCall') > -1 ||
                        str.indexOf('tabCollapsed') > -1 ||
                        str.indexOf('defaultPrinter') > -1 ||
                        str.indexOf('defaultPrice') > -1 ||
                        str.indexOf('categoryCollapsed') > -1 ||
                        str.indexOf('defaultDrawer') > -1 ||
                        str.indexOf('managersPrinter') > -1 ||
                        str.indexOf('printParkOrder') > -1 ||
                        str.indexOf('customers_copies') > -1 || //VV
                        str.indexOf('simpleDisplay') > -1 ||
                        str.indexOf('alphaScroll') > -1
                        ) {
                    // do nothing, keep data for later
                } else {
                    localStorage.removeItem(str);
                }
            }
//            localStorage.clear();
            localStorage.setItem("databaseVersion", '-1');
            localStorage.setItem("mustLogOut", 'ok');
            sessionStorage.removeItem('admin_login');
            sessionStorage.removeItem('order_type');


            /* var cookies = document.cookie.split(";");

             for (var i = 0; i < cookies.length; i++) {
             var cookie = cookies[i];
             var eqPos = cookie.indexOf("=");
             var name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
             document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT";
             }*/
            if (fromLogoutBtn)
            {
                var bashScript = globalSettings.getBashScript();
                if (bashScript != 'no')
                {
                    $.ajax({
                        url: "/data",
                        type: "POST",
                        context: document.body,
                        data: {
                            'request': 'execScript',
                            'scriptName': bashScript,
                        },
                        success: function (data) {
                            window.location.href = '/login';
                        }
                    });
                }
                else
                {
                    window.location.href = '/login';
                }
            }
            else
            {
                window.location.href = '/login';
            }
        });
    };

    this.createDbTables = function (data) {

        /** Check if this hasn't been done before */
        if (db.version != "1")
        {

            /*
             USE: WebSQL
             */
            db.changeVersion(db.version, "1", function (tx) {
                for (var index in data) {
                    if (data.hasOwnProperty(index)) {
                        var table = data[index].table;

                        var a = 'CREATE TABLE "' + table.name + '" (' + table.columns.join(", ") + ');';

                        tx.executeSql('CREATE TABLE "' + table.name + '" (' + table.columns.join(", ") + ');', [], null, function (a, b) {
                            console.log(table.name);
                            console.log('CREATE TABLE "' + table.name + '" (' + table.columns.join(", ") + ');');
                            console.log(a);
                            console.log(b);
                        });
                    }
                }
            }, null, function () {
                localStorage.setItem("databaseVersion", '1');
            });

        }
        else
        {
            if(window.location.pathname == '/reports') {
              window.location.reload();
            }
            else {
              window.location.href = '/';
            }

        }
    };

    this.pushData = function (table, data, callback, callback_data, obj_stored, Syncronisation) {


        if (globalSettings.getOnlineState() === false) {
            db.transaction(function (tx) {


                tx.executeSql('INSERT INTO "local_sync"("table","data") VALUES(?,?)', [table, JSON.stringify(data)]);
            });
        } else {
            $.ajax({
                url: "/data",
                type: "POST",
                context: document.body,
                data: {'request': 'pushData', 'data': data, 'table': table,
                    'curtime': parseInt(new Date().getTime() / 1000), 'token': getToken()},
                success: function (data) {

                    saveToken(data._token);

                    if (callback != undefined) {
                        callback_data = JSON.parse(callback_data);
                        if (callback_data != undefined) {
                            window[callback](data, callback_data);
                        } else {
                            window[callback](data);
                        }
                    }

                    if (typeof Syncronisation != 'undefined') {
//                        var order_code = obj_stored.order_code;

                        obj_stored.obj.updateDisplayID(Syncronisation.order_code, Syncronisation.unique_id, obj_stored.printing);

                        //                this.updateDisplayID(dd['order_code']);

//                    var order_code = data['order_code'];
//                    thisClass.updateDisplayID(data['order_code']);
                    }

                },
                error: function (XMLHttpRequest, textStatus, errorThrown) {
                }

            });
        }
    };

    this.delData = function (table, data, callback, callback_data) {

        $.ajax({
            url: "/data",
            type: "POST",
            context: document.body,
            data: {'request': 'delData', 'data': data, 'table': table, 'token': getToken()},
            success: function (data) {
                saveToken(data._token);
                if (callback != undefined) {
                    callback_data = JSON.parse(callback_data);
                    if (callback_data != undefined) {
                        window[callback](data, callback_data);
                    } else {
                        window[callback](data);
                    }
                }
            },
            error: function (XMLHttpRequest, textStatus, errorThrown) {
                console.log("failed");
            }
        });
    };

    this.print_invoice = function (print, print2, data, callback, callback_data) {


//        windo w.alert('print invoice');

        if (globalSettings.getOnlineState()) {
            $.ajax({
                url: "/data",
                type: "POST",
                context: document.body,
                data: {'request': 'print', 'print': print, 'print2': print2, 'data': data, 'token': getToken(), 'managerPrinter': getManagerPrinterId()},
                success: function (data) {
                    saveToken(data._token);
                    if (callback != undefined) {
                        callback_data = JSON.parse(callback_data);
                        if (callback_data != undefined) {
                            window[callback](data, callback_data);
                        } else {
                            window[callback](data);
                        }
                    }
                }
            });
        } else {
            var db = this.getDbInstance();

            db.transaction(function (tx) {
                tx.executeSql('SELECT "value" FROM "settings" WHERE "name"=?', ['local_ip'], function (tx, results) {
                    var local = results.rows.item(0).value;
                    var print_var = [];
                    for (var i in print) {
                        if (print.hasOwnProperty(i)) {
                            print_var.push(i);
                        }
                    }
                    tx.executeSql('SELECT "id", "ip", "port" FROM "printers" WHERE "id" IN (?)', [print_var.join(',')], function (tx, results) {
                        var p = {};
                        for (var i = 0; i < results.rows.length; i++) {
                            p[results.rows.item(i).id] = {
                                'count': print[results.rows.item(i).id],
                                'ip': results.rows.item(i).ip,
                                'port': results.rows.item(i).port
                            };
                        }

                        $.ajax({
                            url: 'http://' + local + '/print.php',
                            type: "POST",
                            context: document.body,
                            dataType: 'jsonp',
                            data: {'request': 'print', 'print': p, 'data': data, 'token': getToken(), 'managerPrinter': getManagerPrinterId()},
                            success: function (data) {
                                saveToken(data._token);
                                if (callback != undefined) {
                                    callback_data = JSON.parse(callback_data);
                                    if (callback_data != undefined) {
                                        window[callback](data, callback_data);
                                    } else {
                                        window[callback](data);
                                    }
                                }
                            }
                        });
                    });
                });
            });
        }
    };

    this.dismissCall = function (callback, callback_data) {
        $('#in-call-status-bar-container').addClass('hide');
        var d = JSON.parse(localStorage.getItem('call_client'));
        sessionStorage.setItem('dismissCheckpoint', d.checkpoint);
    };

    this.checkCoupon = function (coupon, callback) {
        $.ajax({
            url: "/data",
            type: "POST",
            context: document.body,
            data: {'request': 'getCoupons', 'coupon': coupon, 'token': getToken()},
            success: function (data) {
                saveToken(data._token);
                if (callback != undefined) {
                    window[callback](data);
                }
            }
        });
    };

    this.stopLazySync = function () {
        clearInterval(localStorage.getItem('syncInt'));
        localStorage.removeItem('syncInt');
    };

    this.lazySync = function () {
        $.ajax({
            url: "/data",
            type: "POST",
            context: document.body,
            data: {'request': 'lazySync', 'last': localStorage.getItem('posLastSynced'), 'token': getToken()},
            success: function (data) {
                saveToken(data._token);
                new syncHandler()._lazySync({'items': data}, 0);
            }
        });
        var syncInt = setInterval(function () {
            $.ajax({
                url: "/data",
                type: "POST",
                context: document.body,
                data: {'request': 'lazySync', 'last': localStorage.getItem('posLastSynced'), 'token': getToken()},
                success: function (data) {
                    saveToken(data._token);
                    new syncHandler()._lazySync({'items': data}, 0);
                }
            });
        }, syncInterval);
        localStorage.setItem('syncInt', syncInt);
    };

    this._lazySync = function (coll, i, extra) {
        if (coll['items'].length > i) {
            $.ajax({
                url: "/data",
                type: "POST",
                context: document.body,
                data: {'request': 'selectiveSync', 'action': coll['items'][i].action, 'table': coll['items'][i].type, 'id': coll['items'][i].type_id, 'i': i, 'coll': JSON.stringify(coll), 'token': getToken()},
                success: function (data) {
                    saveToken(data._token);
                    var cols = [];
                    var vals = [];
                    var sql = '';
                    var sql_insert = '';

                    var coll = JSON.parse(data.info.coll);

                    if (data.info.multi != undefined && data.info.multi) {
                        var db_data = [];
                        var tmp = [];
                        var tmp_data = {};
                        for (var i = 0; i < data['data'].length; i++) {
                            tmp = [];
                            tmp_data = data['data'][i];
                            for (var j in tmp_data) {
                                if (tmp_data.hasOwnProperty(j)) {
                                    cols.push(j);
                                    tmp.push(tmp_data[j]);
                                }
                            }
                            db_data.push(tmp);
                        }
                        cols.splice(cols.length / data['data'].length);

                        switch (data.info.table) {
                            case 'order_items':
                                sql = 'INSERT OR IGNORE INTO "' + data.info.table + '"("' + cols.join('","') + '") VALUES(' + "?,".repeat(cols.length).slice(0, -1) + ')';
                                break;
                        }

                        new syncHandler().lazyQuery({
                            'sql': sql,
                            'data': db_data
                        }, 0, 'lazySyncing', base64_encode(JSON.stringify({'0': coll, '1': parseInt(data.info.i) + 1})));
                    } else {
                        if (data.action == 'delete') {

                            switch (data.info.table) {
                                case 'products':
                                    db.transaction(function (tx) {
                                        tx.executeSql('DELETE FROM "products" WHERE "id"=?', [data.info.id], function (tx, results) {
                                            tx.executeSql('DELETE FROM "product_options" WHERE "product_id"=?', [data.info.id], function (tx, results) {
                                                coll['extra'] = 'updateFrontProducts';
                                                new syncHandler()._lazySync(coll, parseInt(data.info.i) + 1);
                                            });
                                        });
                                    });
                                    break;
                            }
                        } else {
                            for (var i in data['data']) {
                                if (data['data'].hasOwnProperty(i)) {
                                    cols.push(i);
                                    vals.push(data['data'][i]);
                                }
                            }
                            vals.push(data.info.id);

                            switch (data.info.table) {
                                case 'products':
                                    sql = 'UPDATE "' + data.info.table + '" SET ' + cols.map(function (a) {
                                        return '"' + a + '"=?';
                                    }).join(', ') + ' WHERE "id"=?';
                                    sql_insert = 'INSERT INTO "' + data.info.table + '"("' + cols.join('","') + '") VALUES(' + "?,".repeat(cols.length).slice(0, -1) + ')';
                                    coll['extra'] = 'updateFrontProducts';
                                    break;
                                case 'product_options':
                                    sql = 'UPDATE "' + data.info.table + '" SET ' + cols.map(function (a) {
                                        return '"' + a + '"=?';
                                    }).join(', ') + ' WHERE "product_id"=?';
                                    sql_insert = 'INSERT INTO "' + data.info.table + '"("' + cols.join('","') + '") VALUES(' + "?,".repeat(cols.length).slice(0, -1) + ')';
                                    break;
                                case 'orders':
                                    vals.pop();
                                    sql = 'INSERT OR IGNORE INTO "' + data.info.table + '"("' + cols.join('","') + '") VALUES(' + "?,".repeat(cols.length).slice(0, -1) + ')';
                                    break;
                                case 'order_items':
                                    alert('uncomplete');
                                    console.log(data);
                                    return false;
                                    break;
                            }

                            db.transaction(function (tx) {
                                tx.executeSql(sql, vals, function (tx, results) {
                                    if (!results.rowsAffected && sql_insert != '') {
                                        vals.pop();
                                        tx.executeSql(sql_insert, vals, function (tx, results) {
                                            new syncHandler()._lazySync(coll, parseInt(data.info.i) + 1);
                                        }, function (a, b) {
                                            console.warn('We have a _lazySync error here:');
                                            console.warn('sql:' + sql_insert);
                                            console.warn(vals);
                                            console.warn(a);
                                            console.warn(b);
                                        });
                                    } else {
                                        new syncHandler()._lazySync(coll, parseInt(data.info.i) + 1);
                                    }
                                }, function (a, b) {
                                    console.warn('We have a _lazySync error here:');
                                    console.warn('sql2:' + sql);
                                    console.warn(vals);
                                    console.warn(a);
                                    console.warn(b);
                                });
                            });
                        }
                    }
                }
            });
        } else {
            if (coll.extra != undefined) {
                switch (coll.extra) {
                    case 'updateFrontProducts':
                        document.mySwipe.removeAllSlides();
                        populateProductsByCategoryId(null);
                        break;
                }
            }
            $.ajax({
                url: "/data",
                type: "POST",
                context: document.body,
                data: {'request': 'getServerTime', 'token': getToken()},
                success: function (data) {
                    saveToken(data._token);
                    localStorage.setItem("posLastSynced", data.time);
                }
            });
        }
    };

    this.pushLocalData = function () {

        if (db.version == '-1' || db.version == "null")
        {
            alert("no db, logging out gnfjnfkj");
            var sy = new syncHandler();
            sy.dropDatabase();
        }

        var _this = this;
        db.transaction(function (tx) {
            tx.executeSql('SELECT * FROM "local_sync"', [], function (tx, results) {
                var d = [];
                var orderCodes = [];
                for (var i = 0; i < results.rows.length; i++) {

                    var aa = results.rows.item(i);
                    d.push(results.rows.item(i));
                    orderCodes.push(JSON.parse(results.rows.item(i).data)['order_code']);
                }

                $.ajax({
                    url: "/data",
                    type: "POST",
                    context: document.body,
                    data: {'request': 'pushLocalData', 'data': d, 'token': getToken()},
                    success: function (data) {
                        saveToken(data._token);
                        //
//                        alert("dropping 5");
//                        var sy = new syncHandler(),
//                                db = sy.getDbInstance();
                        db.transaction(function (tx) {
                            tx.executeSql('DELETE FROM "local_sync"', [], null, null);
                        });
                    },
                    error: function (XMLHttpRequest, textStatus, errorThrown) {
                    }
                });

            }, function () {
                var sy = new syncHandler();
                sy.dropDatabase();
            });
        });
    };

};

function lazySyncing(a, b) {
    new syncHandler()._lazySync(a, b);
}

function reprintPaidOrder() {
    var db = new syncHandler().getDbInstance();

    db.transaction(function (tx) {
        tx.executeSql('SELECT * FROM "orders" WHERE "id"=?', [voided_order_printer], function (tx, results) {
            var order_data = $.extend({}, results.rows.item(0));

//            order_data['managers_printer'] = getManagerPrinterId();

            var can_print = false,
                    print = {}, print2 = {};

            $('.btn-printer-voidPopup').each(function () {
                if ($(this).data('count') > 0) {
                    can_print = true;
                    print[$(this).data('id')] = $(this).data('count');
                }
            });

            $('.btn-printer-voidPopup_second').each(function () {
                if ($(this).data('count') > 0) {
                    can_print = true;
                    print2[$(this).data('id')] = $(this).data('count');
                }
            });
            //VV
            var print_managers_copy = $("#print_managers_copy").prop('checked');
            if (print_managers_copy == true){
                print_managers_copy = getManagerPrinterId();
            }else{
                print_managers_copy = '';
            }
            //VV

            $.ajax({
                url: "/data",
                type: "POST",
                context: document.body,
                //data: {'request': 'print', 'print': print, 'print2': print2, 'data': JSON.stringify(order_data), 'token': getToken(), 'managerPrinter': getManagerPrinterId()},
                data: {'request': 'print', 'print': print, 'print2': print2, 'data': JSON.stringify(order_data), 'token': getToken(), 'managerPrinter': print_managers_copy}, //VV1

                success: function (data) {
                    saveToken(data._token);
                }
            });
        });
    });
}

$.fn.extend({
    disableSelection: function () {
        this.each(function () {
            this.onselectstart = function () {
                return false;
            };
            this.unselectable = "on";
            $(this).css('-moz-user-select', 'none');
            $(this).css('-webkit-user-select', 'none');
        });
    }
});

$(document).ready(function () {
    $('.notSelectable').disableSelection();
});