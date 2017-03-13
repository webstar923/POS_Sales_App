/**
 * Created with JetBrains PhpStorm.
 * User: Gabriel Colita
 * Date: 2/8/14
 * Time: 2:30 AM
 * A JavaScript Cart class using HTML5 Local Storage
 */


$(document).ready(function () {
    /** Check if data is synced/used before **/
    if (Modernizr.localstorage) {
        var data = localStorage.getItem("posLastSynced");
        if (data == null) {
            /** No sync was made before, start syncing the app */
            var syncEr = new syncHandler();
            syncEr.doCompleteSync();
        } else {
            var v = localStorage.getItem('databaseVersion');
            if (v != null) {
                db = openDatabase('posapp', v, 'POS WebSql DB', 2 * 1024 * 1024);
            }
        }

    } else {
        alert('Your browser is not supporting LocalStorage which is required to run the app.');
    }

});

var syncHandler = function () {

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
        if (v == null) {
            v = '';
        }
        db = openDatabase('posapp', v, 'POS WebSql DB', 2 * 1024 * 1024);
    }();

    this.isLocal = function () {
        return localStorage.getItem("posLastSynced");
    }

    this.getDbInstance = function () {
        return db;
    }

    /**
     * Complete sync functions
     * Calling all sync methods and saves data to DB
     */
    this.doCompleteSync = function () {

        debugger;
        alert("44  ncvfj");
        loaderElement.html('<p>Preparing application for the first use...</p>');
        this.doAjaxRequest('doCompleteSync');
    }

    /**
     * Ajax Requests Handler
     * @param action
     */
    this.doAjaxRequest = function (action) {

        alert("45 nfgjk");
        debugger;
        var thisClass = this;
        $.ajax({
            url: "/data",
            type: "POST",
            context: document.body,
            data: {request: action}
        }).done(function (data) {
            if (data.sync !== undefined) {
                thisClass.createDbTables(data.sync);

                debugger;

                $.each(data.sync, function (key, value) {
                    loaderElement.html('<p>Syncing ' + key + '</p>');

                    thisClass.doAjaxRequest(value.action);
                });
            } else {
                //''
                for (var table_name in data) {
                    if (data.hasOwnProperty(table_name)) {
                        var col = [];
                        var sql = '';
                        for (var entry in data[table_name]) {
                            if (data[table_name].hasOwnProperty(entry)) {
                                sql += ' UNION SELECT ';
                                for (var k in data[table_name][entry]) {
                                    sql += '"' + encodeURI(data[table_name][entry][k]) + '" as "' + k + '", ';
                                    if (col.indexOf(k) == -1) {
                                        col.push(k);
                                    }
                                }
                                sql = sql.slice(0, -2);
                            }
                        }
                        sql = 'INSERT INTO "' + table_name + '"(' + col.join(', ') + ')' + sql.substr(6);
                        db.transaction(function (tx) {
                            //tx.executeSql(sql);
                        });
                    }
                }
                localStorage.setItem("posLastSynced", new Date().getTime());
            }

        });
    }

    /**
     * Data saver
     * @param entity
     * @param data
     */
    this.saveData = function (entity, data) {

    }

    this.createDbTables = function (data) {
        /** Check if this hasn't been done before */
        if (db.version != "1") {

            /*
             USE: WebSQL
             */
            db.changeVersion(db.version, "1", function (tx) {
                console.log(data);
                for (var index in data) {
                    if (data.hasOwnProperty(index)) {
                        var table = data[index].table;
                        tx.executeSql('CREATE TABLE ' + table.name + ' (' + table.columns.join(", ") + ');');
                    }
                }
            }, null, function () {
                localStorage.setItem("databaseVersion", '1');
            });

        }
    }

}