var pos_settings;
var pos_user_settings = false;
var global_user_id = 0;

if (!Array.prototype.map)
{
    Array.prototype.map = function(fun /*, thisp*/)
    {
        var len = this.length;
        if (typeof fun != "function")
            throw new TypeError();

        var res = new Array(len);
        var thisp = arguments[1];
        for (var i = 0; i < len; i++)
        {
            if (i in this)
                res[i] = fun.call(thisp, this[i], i, this);
        }

        return res;
    };
}

jQuery.fn.extend({
    activeMenu: function() {
        var el = this;
        $('.admin-menu-item').each(function(){
            $(this).removeClass('active-menu');
        });
        $(el).addClass('active-menu');
    }
});

function number_format(f,c,h,e){f=(f+"").replace(/[^0-9+\-Ee.]/g,"");var b=!isFinite(+f)?0:+f,a=!isFinite(+c)?0:Math.abs(c),j=(typeof e==="undefined")?",":e,d=(typeof h==="undefined")?".":h,i="",g=function(o,m){var l=Math.pow(10,m);return""+(Math.round(o*l)/l).toFixed(m)};i=(a?g(b,a):""+Math.round(b)).split(".");if(i[0].length>3){i[0]=i[0].replace(/\B(?=(?:\d{3})+(?!\d))/g,j)}if((i[1]||"").length<a){i[1]=i[1]||"";i[1]+=new Array(a-i[1].length+1).join("0")}return i.join(d)};

function Admin() {
    this.ls_name = 'admin_login';
    this._db = new syncHandler().getDbInstance();

    document.pos_settings = JSON.parse(localStorage.getItem('settings'));

    this.logIn = function(data) {
        var tmp = $.extend({}, data);

        sessionStorage.setItem(this.ls_name,JSON.stringify(tmp));
    };

    this.logOut = function() {
        sessionStorage.removeItem(this.ls_name);
        window.location.href = '/reports';
    };

    this.isLogged = function() {
        return sessionStorage.getItem(this.ls_name);
    };

    this.protectedArea = function(sammy) {
        if (!this.isLogged()) {
            sammy.redirect('/reports');
        } else {
            $('body').removeClass('only-login');
        }
    };

    this.getUserSettings = function() {
        if (!document.pos_user_settings) {
            this._db.transaction(function(tx){
                tx.executeSql('SELECT * FROM "user_settings" WHERE "user_id"=?', [localStorage.getItem('currentUser')], function(tx, results){



                    if (results.rows.length > 0) {
                        var tmp = {};
                        for (var i=0;i<results.rows.length;i++) {
                            tmp[results.rows.item(i).setting] = results.rows.item(i).value;
                        }
                        document.pos_user_settings = tmp;
                    }
                });
            });
        } else {
            return document.pos_user_settings;
        }
    };
}

var Admin = new Admin();

// Set the Sammy Application

var app = $.sammy(function() {

    /**
     * Home page
     * Check if the user is logged in, if is logged in redirect to #/dashboard, else show the login form
     */
    this.get('/reports', function(context) {
        if (Admin.isLogged()) {
            this.redirect('#/dashboard');
        } else {
            var html = Mustache.to_html($('#admin-login-page').html());

            $('#admin-content').html(html);
        }
    });

    /**
     * Login form process
     */
    this.post('#/login-me', function(context){
        var sy = new syncHandler(),
            db = sy.getDbInstance(),
            s = this;

        db.transaction(function(tx){
            tx.executeSql('SELECT * FROM "users" WHERE "id"=? AND "isadmin"="1"',[localStorage.getItem('currentUser')],function(tx,resuts){
                if (resuts.rows.length > 0) {

                    $.ajax({
                        url: "/data",
                        type: "POST",
                        context: document.body,
                        data: {
                            'request':      'checkCode',
                            'code':         s.params['password'],
                            'user_id':      localStorage.getItem('currentUser'),
                            'device_name':  '_admin'
                        }
                    }).done(function(data) {
                        if (data.status) {
                            Admin.logIn(resuts.rows.item(0));
                            s.redirect('#/dashboard');
                        } else {
                            toastr.error('You entered an invalid code', 'Invalid code!')
                        }
                    });
                } else {
                    alert('You dont have access here!');
                }
            });
        });
    });

    /**
     * Dashboard
     */
    this.get('#/dashboard', function(context){
        Admin.protectedArea(this);

        if (Admin.isLogged()) {
            $('#admin-menu-item-dashboard').activeMenu();

            var sy = new syncHandler(),
                db = sy.getDbInstance(),
                s = this,
                pieData = [],
                top_prod = [],
                data_today = [],
                data_sdays = [],
                dd = [],
                html;

            db.transaction(function(tx){
                tx.executeSql('SELECT "users"."username", COUNT("orders"."userId") AS "count" FROM "users" LEFT JOIN "orders" ON "orders"."userId" = "users"."id" GROUP BY "orders"."userId"', [], function(tx,results){
                    if (results.rows.length > 0) {
                        for (var i=0;i<results.rows.length;i++) {
                            pieData.push({
                                'name': results.rows.item(i).username.charAt(0).toUpperCase() + results.rows.item(i).username.slice(1),
                                'value': results.rows.item(i).count,
                                'color': '#'+Math.floor(Math.random()*16777215).toString(16)
                            });
                        }
                    }
                    tx.executeSql('SELECT "products"."name", SUM("order_items"."quantity") AS "count" FROM "order_items", "products" WHERE "products"."id" = "order_items"."product_id" GROUP BY "order_items"."product_id" ORDER BY "count" DESC LIMIT 10', [],function(tx,results){
                        if (results.rows.length > 0) {
                            for (var i=0;i<results.rows.length;i++) {
                                top_prod.push({
                                    'id': (i+1),
                                    'name': results.rows.item(i).name
                                });
                            }
                        }

                        tx.executeSql('SELECT COUNT("hour") AS "count", "hour" FROM "orders" WHERE "date" > strftime("%Y-%m-%d","now") GROUP BY "hour"', [],function(tx, results){
                            for (var i=0;i<24;i++) {
                                data_today[i] = 0;
                                data_sdays[i] = 0;
                            }
                            if (results.rows.length > 0) {
                                for (var i=0;i<results.rows.length;i++) {
                                    data_today[results.rows.item(i).hour] = results.rows.item(i).count;
                                }
                            }

                            tx.executeSql('SELECT COUNT("hour") AS "count", "hour" FROM "orders" WHERE "date" BETWEEN strftime("%Y-%m-%d","now","-6 days") AND strftime("%Y-%m-%d","now","-5 days") GROUP BY "hour"', [],function(tx, results){
                                if (results.rows.length > 0) {
                                    for (var i=0;i<results.rows.length;i++) {
                                        data_sdays[results.rows.item(i).hour] = results.rows.item(i).count;
                                    }
                                }

                                dd['top_prod'] = top_prod;

                                html = Mustache.to_html($('#admin-dashboard-page').html(),dd);
                                $('#admin-content').html(html);

                                new Chart(document.getElementById("pie-chart").getContext("2d")).Pie(pieData);
                                var lineChartData = {
                                    labels: ["0:00", "1:00", "2:00", "3:00", "4:00", "5:00", "6:00", "7:00", "8:00", "9:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00", "21:00", "22:00", "23:00"],
                                    datasets: [
                                        {
                                            fillColor: "rgba(32,118,17,0.5)",
                                            strokeColor: "rgba(32,118,17,1)",
                                            pointColor: "rgba(32,118,17,1)",
                                            pointStrokeColor: "#fff",
                                            data: data_today
                                        },
                                        {
                                            fillColor: "rgba(229,107,93,0.5)",
                                            strokeColor: "rgba(229,107,93,1)",
                                            pointColor: "rgba(229,107,93,1)",
                                            pointStrokeColor: "#fff",
                                            data: data_sdays
                                        }
                                    ]

                                };
                                //$('#area-chart').attr('width',(parseInt($('#area-chart-container').width())-30) + 'px');

                                new Chart(document.getElementById("area-chart").getContext("2d")).Line(lineChartData);

                                html = Mustache.to_html($('#admin-dashboard-page-piechart-template').html(), pieData);
                                $('#admin-dashboard-page-piechart-legend').html(html);
                            });
                        });
                    });
                });
            });
        }
    });

    /**
     * Generate report form submitted
     */
    this.get('#/generate-report', function(context){
        Admin.protectedArea(this);

        if (Admin.isLogged()) {
            $('#admin-menu-item-reports').activeMenu();
            var on = true,
                type = '',
                perpag = 4,
                curpag = 0,
                all_pags = 0,
                pages = [],
                pag_link = '',
                sel_tmp = '',
                search = '',
                tmp, ttmp,
                myCart = new gcLsCart(),
                s = this,
                exts;

            if (on) {

                // Get the params from the URL
                if (this.params['type'] != undefined) {
                    type = this.params['type'];
                } else {
                    type = 'today';
                }

                if (this.params['order_type'] != undefined) {
                    exts = type + '|' + this.params['order_type'];
                } else {
                    exts = type;
                }

                if (this.params['pag'] != undefined) {
                    curpag = this.params['pag'];
                }

                search = this.params['search'] || ''

                // Build page url
                pag_link = '#/generate-report?type=' + type
                + '&start=' + this.params['start']
                + '&end=' + this.params['end']
                + '&order_type=' + this.params['order_type']
                + '&search=' + this.params['search']
                + '&pag=';



                $.ajax({
                    url: "/data",
                    type: "POST",
                    context: document.body,
                    data: {
                        'request' : 'queryAdmin',
                        'table':    'orders',
                        'extra':    exts,
                        'perpag': perpag,
                        'pag': curpag,
                        'token': getToken(),
                        'search' : search
                    }
                }).done(function(data) {
                    saveToken(data._token);
                    for (var i=0;i<data['all'];i++) {
                        if (i == curpag) {
                            sel_tmp = true;
                        } else {
                            sel_tmp = false;
                        }
                        pages.push({
                            'pag': (i+1),
                            'link': pag_link + i,
                            'sel': sel_tmp
                        });
                    }


                    for (var i=0;i<data['data'].length;i++) {
                        var date = data['data'][i].date;
                        data['data'][i].contents = myCart.formatCartContent(data['data'][i].contents);
                        data['data'][i].date = moment(date,"X").format("HH:mm DD/MM/YYYY");
                    }

                    if (isNaN(parseFloat(data['total']['cash']))) {
                        data['total']['cash'] = 0;
                    }
                    if (isNaN(parseFloat(data['total']['creditcard']))) {
                        data['total']['creditcard'] = 0;
                    }
                    var total_cash = number_format(parseFloat(data['total']['cash']), 2);
                    var total_cc = number_format(parseFloat(data['total']['creditcard']), 2);

                    var dd = {
                        'have_reports': (data['data'].length > 0),
                        'reports': data['data'],
                        'pages': pages,
                        'type': type,
                        'start': s.params['start'],
                        'end': s.params['end'],
                        'total_cash': total_cash,
                        'total_cc': total_cc
                    };

                    var db = new syncHandler().getDbInstance();
                    db.transaction(function(tx){
                        tx.executeSql('SELECT * FROM "order_types"',[],function(tx, results){
                            var types = [],
                                tasmp;
                            if (results.rows.length > 0) {
                                for (var i=0;i<results.rows.length;i++) {
                                    tasmp = $.extend({}, results.rows.item(i));
                                    tasmp.name = (tasmp.name).charAt(0).toUpperCase() + (tasmp.name).slice(1);
                                    if (tasmp.id == s.params['order_type']) {
                                        tasmp.selected = true;
                                    } else {
                                        tasmp.selected = false;
                                    }
                                    types.push(tasmp);
                                }
                            }

                            dd['order_types'] = types;
                            dd['search'] = s.params['search'];
                            var html = Mustache.to_html($('#admin-salesReports-page').html(), dd);
                            $('#admin-content').html(html);

                            $('#select_order_type').on('change', function(){
                                window.location.href = '#/generate-report?type=' + s.params['type'] +
                                '&start=' + s.params['start'] +
                                '&end=' + s.params['end'] +
                                '&search='+s.params['search'] +
                                '&order_type=' + $(this).val();
                            });


                            $('#order_search_empty').on('click',function(e){
                              e.preventDefault();
                              window.location.href = '#/generate-report?type=' + s.params['type'] +
                                '&start=' + s.params['start'] +
                                '&end=' + s.params['end'] +
                                '&search=' +
                                '&order_type=' + s.params['order_type'];
                            });

                            $('#order_search').on('click',function(e){
                              e.preventDefault();
                              var value = $(this).prev().val();
                              window.location.href = '#/generate-report?type=' + s.params['type'] +
                                '&start=' + s.params['start'] +
                                '&end=' + s.params['end'] +
                                '&search='+value +
                                '&order_type=' + s.params['order_type'];
                            });
                        });
                    });
                });

            } else {
                var sy = new syncHandler(),
                    db = sy.getDbInstance(),
                    type = '',
                    data = [],
                    perpag = 4,
                    curpag = 0,
                    all_pags = 0,
                    pages = [],
                    pag_link = '',
                    sel_tmp = '',
                    tmp, ttmp,
                    sql,sql_all,limit,
                    myCart = new gcLsCart(),
                    s = this;

                if (this.params['type'] != undefined) {
                    type = this.params['type'];
                } else {
                    type = 'today';
                }

                if (this.params['pag'] != undefined) {
                    curpag = this.params['pag'];
                }

                pag_link = '#/generate-report?type=' + type  +
                '&start=' + this.params['start'] +
                '&end=' + this.params['end']
                '&search=' + this.params['search']
                + '&pag=';
                var where_search = '';
                if(search != ''){
                  where_search = 'WHERE'+
                      'CONCAT_WS('|',`orders.content`,`orders.address`)'+ // single condition, many columns
                      'LIKE "%'+search+'%"';
                }
                limit = (curpag*perpag) + ", " + perpag;

                switch (type) {
                    case 'today':
                        sql = 'SELECT "orders".*, "taxes"."name" AS "payment_method", "users"."username" ' +
                            'FROM "orders" ' +
                            'LEFT JOIN "taxes" ON "taxes"."id" = "orders"."pay_type"' +
                            'JOIN "users" ON "orders"."userId" = "users"."id" ' +
                            'WHERE date > strftime("%Y-%m-%d","now")'+
                            where_search+
                            'ORDER BY "date" DESC LIMIT ' + limit;

                        sql_all = 'SELECT COUNT(*) as "total" ' +
                            'FROM "orders" ' +
                            'LEFT JOIN "taxes" ON "taxes"."id" = "orders"."pay_type"' +
                            'JOIN "users" ON "orders"."userId" = "users"."id" ' +
                            'WHERE date > strftime("%Y-%m-%d","now")'
                            where_search;
                        break;
                    case 'last_week':
                        sql = 'SELECT "orders".*, "taxes"."name" AS "payment_method", "users"."username" ' +
                            'FROM "orders" ' +
                            'LEFT JOIN "taxes" ON "taxes"."id" = "orders"."pay_type"' +
                            'JOIN "users" ON "orders"."userId" = "users"."id" ' +
                            'WHERE date BETWEEN datetime("now", " -6 days") AND datetime("now")'+
                            where_search+
                            'ORDER BY "date" DESC LIMIT ' + limit;

                        sql_all = 'SELECT COUNT(*) as "total" ' +
                            'FROM "orders" ' +
                            'LEFT JOIN "taxes" ON "taxes"."id" = "orders"."pay_type"' +
                            'JOIN "users" ON "orders"."userId" = "users"."id" ' +
                            'WHERE date BETWEEN datetime("now", " -6 days") AND datetime("now")'
                            where_search;
                        break;
                    case 'last_month':
                        sql = 'SELECT "orders".*, "taxes"."name" AS "payment_method", "users"."username" ' +
                            'FROM "orders" ' +
                            'LEFT JOIN "taxes" ON "taxes"."id" = "orders"."pay_type"' +
                            'JOIN "users" ON "orders"."userId" = "users"."id" ' +
                            'WHERE date BETWEEN datetime("now", "start of month") AND datetime("now")'+
                            where_search+
                            'ORDER BY "date" DESC LIMIT ' + limit;

                        sql_all = 'SELECT COUNT(*) as "total" ' +
                            'FROM "orders" ' +
                            'LEFT JOIN "taxes" ON "taxes"."id" = "orders"."pay_type"' +
                            'JOIN "users" ON "orders"."userId" = "users"."id" ' +
                            'WHERE date BETWEEN datetime("now", "start of month") AND datetime("now")'
                            where_search;
                        break;
                    case 'last_3_months':
                        sql = 'SELECT "orders".*, "taxes"."name" AS "payment_method", "users"."username" ' +
                            'FROM "orders" ' +
                            'LEFT JOIN "taxes" ON "taxes"."id" = "orders"."pay_type"' +
                            'JOIN "users" ON "orders"."userId" = "users"."id" ' +
                            'WHERE date BETWEEN datetime("now", "-3 months") AND datetime("now")'+
                            where_search+
                            'ORDER BY "date" DESC LIMIT ' + limit;

                        sql_all = 'SELECT COUNT(*) as "total" ' +
                            'FROM "orders" ' +
                            'LEFT JOIN "taxes" ON "taxes"."id" = "orders"."pay_type"' +
                            'JOIN "users" ON "orders"."userId" = "users"."id" ' +
                            'WHERE date BETWEEN datetime("now", "-3 months") AND datetime("now")'
                            where_search;
                        break;
                    case 'other':
                        var d = new Date(this.params['start']);
                        var m = ((d.getMonth()+1)<10) ? '0' + (d.getMonth()+1) : (d.getMonth()+1);
                        var date_start = d.getFullYear() + '-' + m + '-' + d.getDate();

                        d = new Date(this.params['end']);
                        m = ((d.getMonth()+1)<10) ? '0' + (d.getMonth()+1) : (d.getMonth()+1);
                        var date_end = d.getFullYear() + '-' + m + '-' + d.getDate();

                        sql = 'SELECT "orders".*, "taxes"."name" AS "payment_method", "users"."username" ' +
                            'FROM "orders" ' +
                            'LEFT JOIN "taxes" ON "taxes"."id" = "orders"."pay_type"' +
                            'JOIN "users" ON "orders"."userId" = "users"."id" ' +
                            'WHERE date BETWEEN datetime("' + date_start + '") AND datetime("' + date_end + '")'+
                            where_search+
                            'ORDER BY "date" DESC LIMIT ' + limit;

                        sql_all = 'SELECT COUNT(*) as "total" ' +
                            'FROM "orders" ' +
                            'LEFT JOIN "taxes" ON "taxes"."id" = "orders"."pay_type"' +
                            'JOIN "users" ON "orders"."userId" = "users"."id" ' +
                            'WHERE date BETWEEN datetime("' + date_start + '") AND datetime("' + date_end + '")'
                            where_search;
                        break;
                }

                db.transaction(function(tx){
                    tx.executeSql(sql_all, [], function(tx, results){
                        all_pags = results.rows.item(0).total;
                        all_pags = Math.ceil(parseInt(all_pags)/perpag);
                        for (var i=0;i<all_pags;i++) {
                            if (i == curpag) {
                                sel_tmp = true;
                            } else {
                                sel_tmp = false;
                            }
                            pages.push({
                                'pag': (i+1),
                                'link': pag_link + i,
                                'sel': sel_tmp
                            });
                        }

                        tx.executeSql(sql, [], function(tx, results){
                            if (results.rows.length > 0) {
                                for (var i=0;i<results.rows.length; i++) {
                                    tmp = $.extend({}, results.rows.item(i));
                                    ttmp = $.extend({}, JSON.parse(tmp['contents']));
                                    tmp.contents = myCart.formatCartContent(tmp.contents)
                                    for (var j in ttmp) {
                                        if (ttmp.hasOwnProperty(j)) {
                                            if (ttmp[j].extra_cart != undefined && ttmp[j].extra_cart != '') {
                                                tmp.contents += '<br />' + ttmp[j].extra_cart;
                                            }
                                        }
                                    }
                                    data.push(tmp);
                                }

                                var dd = {
                                    'have_reports': true,
                                    'reports': data,
                                    'pages': pages,
                                    'type': type,
                                    'start': s.params['start'],
                                    'end': s.params['end']
                                };

                                var html = Mustache.to_html($('#admin-salesReports-page').html(), dd);
                                $('#admin-content').html(html);
                            } else {
                                var dd = {
                                    'have_reports': false,
                                    'type': type,
                                    'start': s.params['start'],
                                    'end': s.params['end']
                                };

                                var html = Mustache.to_html($('#admin-salesReports-page').html(), dd);
                                $('#admin-content').html(html);
                            }
                        });
                    });
                });
            }
        }
    });

    /**
     * Tops page
     */
    this.get('#/tops',function(context){
        Admin.protectedArea(this);

        if (Admin.isLogged()) {
            $('#admin-tops-menu-item').activeMenu();

            var on = true;

            if (on) {
                var data = [],
                    dd = {},
                    type,
                    sql = '',
                    perpag = 10,
                    curpag = 0,
                    limit,
                    s = this;

                $('#admin-tops-menu-item').parent().find('ul').addClass('in').find('li').each(function(){
                    $e = $(this).find('a');
                    if ($e.data('type') == s.params['type']) {
                        $e.addClass('active-menu');
                    } else {
                        $e.removeClass('active-menu');
                    }
                });

                $.ajax({
                    url: "/data",
                    type: "POST",
                    context: document.body,
                    data: {
                        'request': 'queryAdmin',
                        'table':    'tops',
                        'extra': this.params['type'],
                        'perpag': perpag,
                        'pag': curpag,
                        'token': getToken()
                    }
                }).done(function(data) {
                    saveToken(data._token);
                    dd['data'] = data['data'];
                    dd['have_data'] = (data['data'].length > 0);
                    dd['selected_type'] = 'client';
                    dd['type'] = 'client';
                    dd['perpag'] = 100;

                    switch (s.params['type']) {
                        default:
                        case 'staff':
                            dd['title'] = 'Top Staff';
                            break;
                        case 'client':
                            dd['title'] = 'Top Clients';
                            break;
                        case 'products':
                            dd['title'] = 'Top Products';
                            break;
                    }

                    var html = Mustache.to_html($('#admin-tops-page').html(), dd);
                    $('#admin-content').html(html);
                    $('#top-select').find('option').each(function(){
                        if ($(this).val() == perpag) {
                            $(this).attr('selected',true);
                        } else {
                            $(this).attr('selected',false);
                        }
                    });
                });
            } else {
                var sy = new syncHandler(),
                    db = sy.getDbInstance(),
                    data = [],
                    dd = {},
                    type,
                    sql = '',
                    perpag = 10,
                    limit,
                    s = this;

                if (this.params['pag'] != undefined) {
                    curpag = this.params['pag'];
                }

                if (this.params['perpag'] != undefined) {
                    perpag = this.params['perpag'];
                }

                limit = "0, " + perpag;

                switch (this.params['type']) {
                    default:
                    case 'staff':
                        dd['title'] = 'Top Staff';
                        sql = 'SELECT "users"."id", "users"."firstname" || " " || "users"."lastname" as "name", COUNT("orders"."userId") AS "count" FROM "orders", "users" WHERE "orders"."userId" = "users"."id" GROUP BY "orders"."userId" ORDER BY "count" DESC LIMIT ' + limit;
                        type = 'staff';
                        break;
                    case 'client':
                        type = 'client';
                        dd['title'] = 'Top Clients';
                        break;
                    case 'products':
                        dd['title'] = 'Top Products';
                        sql = 'SELECT "products"."id", "products"."name", SUM("order_items"."quantity") AS "count" FROM "order_items", "products" WHERE "products"."id" = "order_items"."product_id" GROUP BY "order_items"."product_id" ORDER BY "count" DESC LIMIT ' + limit;
                        type = 'products';
                        break;
                }

                if (['staff', 'products'].indexOf(this.params['type']) !== -1) {
                    db.transaction(function(tx){
                        tx.executeSql(sql, [], function(tx, results){
                            for (var i=0;i<results.rows.length; i++) {
                                data.push({
                                    'id': results.rows.item(i).id,
                                    'name': results.rows.item(i).name,
                                    'count': results.rows.item(i).count
                                });
                            }

                            dd['data'] = data;
                            dd['have_data'] = (data.length > 0);
                            dd['selected_type'] = 'client';
                            dd['type'] = 'client';
                            dd['perpag'] = 100;

                            var html = Mustache.to_html($('#admin-tops-page').html(), dd);
                            $('#admin-content').html(html);
                            $('#top-select').find('option').each(function(){
                                if ($(this).val() == perpag) {
                                    $(this).attr('selected',true);
                                } else {
                                    $(this).attr('selected',false);
                                }
                            });
                        });
                    },function(a,b){
                        console.warn(a);
                        console.warn(b);
                    });
                } else {
                    $.ajax({
                        url: "/data",
                        type: "POST",
                        context: document.body,
                        data: {'request': 'getAdminCustomerDetails'}
                    }).done(function(data) {
                        dd['data'] = data;
                        dd['have_data'] = (data.length > 0);
                        dd['selected_type'] = type;
                        dd['type'] = type;
                        dd['perpag'] = perpag;

                        var html = Mustache.to_html($('#admin-tops-page').html(), dd);
                        $('#admin-content').html(html);
                    });
                }
            }
        }
    });

    this.get('#/staff-reports', function(context){
        Admin.protectedArea(this);

        if (Admin.isLogged()) {
            $('#admin-menu-item-staff-reports').activeMenu();

            var on = true;

            if (on) {
                var users = [],
                    first = false,
                    reports = [],
                    dd = {},
                    curpag = 0,
                    perpag = 5,
                    limit, user_id,
                    all_pags = 0,
                    pages = [],
                    pag_link = '',
                    sel_tmp = '',
                    s = this,
                    tmp, ttmp,
                    myCart = new gcLsCart(),
                    staff;

                if (this.params['staff'] != undefined) {
                    staff = this.params['staff'];
                } else {
                    staff = 1;
                }

                if (s.params['pag'] != undefined) {
                    curpag = s.params['pag'];
                }

                $.ajax({
                    url: "/data",
                    type: "POST",
                    context: document.body,
                    data: {
                        'request': 'queryAdmin',
                        'table':    'staff-reports',
                        'extra': staff,
                        'perpag': perpag,
                        'pag': curpag,
                        'token': getToken()
                    }
                }).done(function(data) {
                    saveToken(data._token);
                    var staff = data['staff'];
                    pag_link = '#/staff-reports?staff=' + staff + '&pag=';
                    for (var i=0;i<data['all'];i++) {
                        if (i == curpag) {
                            sel_tmp = true;
                        } else {
                            sel_tmp = false;
                        }
                        pages.push({
                            'pag': (i+1),
                            'link': pag_link + i,
                            'sel': sel_tmp
                        });
                    }

                    var d;
                    for (var i=0;i<data['data'].length;i++) {
                        d = new Date(data['data'][i].date*1000);
                        data['data'][i].contents = myCart.formatCartContent(data['data'][i].contents);
                        data['data'][i].date = d.getHours() + ':'
                            + d.getMinutes().toString().replace(/\d{0,2}/,function(m){return '0'.slice(m.length-1) + m;})
                            + ' ' + d.getDate().toString().replace(/\d{0,2}/,function(m){return '0'.slice(m.length-1) + m;})
                            + '/' + (new Date().getMonth()+1).toString().replace(/\d{0,2}/,function(m){return '0'.slice(m.length-1) + m;})
                            + '/' + d.getFullYear();
                    }

                    dd['pages'] = pages;

                    dd['reports'] = data['data'];
                    dd['staff'] = staff;
                    dd['users'] = data['users'];

                    if (isNaN(parseFloat(data['total']))) {
                        data['total'] = 0;
                    }
                    dd['total'] = number_format(parseFloat(data['total']), 2);

                    var html = Mustache.to_html($('#admin-staff-report-page').html(), dd);
                    $('#admin-content').html(html);
                    $('#staff-select').find('option').each(function(){
                        if ($(this).val() == staff) {
                            $(this).attr('selected',true);
                        } else {
                            $(this).attr('selected',false);
                        }
                    });
                });
            } else {
                var sy = new syncHandler(),
                    db = sy.getDbInstance(),
                    users = [],
                    first = false,
                    reports = [],
                    dd = {},
                    curpag = 0,
                    perpag = 5,
                    limit, user_id,
                    all_pags = 0,
                    pages = [],
                    pag_link = '',
                    sel_tmp = '',
                    s = this,
                    tmp, ttmp,
                    myCart = new gcLsCart();

                db.transaction(function(tx){
                    tx.executeSql('SELECT * FROM "users"', [], function(tx, results){
                        for (var i=0;i<results.rows.length;i++) {
                            if (!first) {
                                first = results.rows.item(i).id;
                            }
                            users.push(results.rows.item(i));
                        }

                        if (s.params['staff'] != undefined) {
                            user_id = s.params['staff'];
                        } else {
                            user_id = first;
                        }

                        dd['users'] = users;

                        if (s.params['pag'] != undefined) {
                            curpag = s.params['pag'];
                        }

                        limit = curpag*perpag;

                        pag_link = '#/staff-reports?staff=' + user_id + '&pag=';

                        tx.executeSql('SELECT COUNT(*) AS "total" FROM "orders" WHERE "userId"=?', [user_id], function(tx, results){
                            all_pags = results.rows.item(0).total;
                            all_pags = Math.ceil(parseInt(all_pags)/perpag);
                            for (var i=0;i<all_pags;i++) {
                                if (i == curpag) {
                                    sel_tmp = true;
                                } else {
                                    sel_tmp = false;
                                }
                                pages.push({
                                    'pag': (i+1),
                                    'link': pag_link + i,
                                    'sel': sel_tmp
                                });
                            }

                            dd['pages'] = pages;

                            tx.executeSql('SELECT * FROM "orders" WHERE "userId"=? LIMIT ?,?', [user_id, limit, perpag], function(tx, results){
                                for (var i=0;i<results.rows.length;i++) {
                                    tmp = $.extend({}, results.rows.item(i));
                                    ttmp = $.extend({}, JSON.parse(tmp['contents']));
                                    tmp.contents = myCart.formatCartContent(tmp.contents)
                                    for (var j in ttmp) {
                                        if (ttmp.hasOwnProperty(j)) {
                                            if (ttmp[j].extra_cart != undefined && ttmp[j].extra_cart != '') {
                                                tmp.contents += '<br />' + ttmp[j].extra_cart;
                                            }
                                        }
                                    }
                                    reports.push(tmp);
                                }

                                dd['reports'] = reports;
                                dd['staff'] = user_id;

                                var html = Mustache.to_html($('#admin-staff-report-page').html(), dd);
                                $('#admin-content').html(html);
                                $('#staff-select').find('option').each(function(){
                                    if ($(this).val() == user_id) {
                                        $(this).attr('selected',true);
                                    } else {
                                        $(this).attr('selected',false);
                                    }
                                });
                            });
                        });
                    });
                });
            }
        }
    });
    this.get('#/logout', function(context){
        Admin.logOut()
    });
    this.get('#/balance-reports', function(context){
        Admin.protectedArea(this);

        if (Admin.isLogged()) {
            $('#admin-menu-item-balance-reports').activeMenu();

            var on = true;

            if (on) {
                var sy = new syncHandler(),
                    db = sy.getDbInstance(),
                    data = {},
                    dd = {},
                    sql;

                dd['start'] = '';
                dd['end'] = '';

                $.ajax({
                    url: "/data",
                    type: "POST",
                    context: document.body,
                    data: {
                        'request': 'queryAdmin',
                        'table':    'pos_balances',
                        'extra': JSON.stringify(dd),
                        'token': getToken()
                    }
                }).done(function(data) {
                    saveToken(data._token);
                    var reports = [],
                        tmp;
                    for (var i in data['data']) {
                        if (data['data'].hasOwnProperty(i)) {
                            tmp = $.extend({}, data['data'][i]);
                            tmp['date'] = i;
                            if (tmp['cash'] == undefined) {
                                tmp['cash'] = 0;
                            } else {
                                tmp['cash'] = number_format(tmp['cash'], 2);
                            }
                            if (tmp['creditcard'] == undefined) {
                                tmp['creditcard'] = 0;
                            } else {
                                tmp['creditcard'] = number_format(tmp['creditcard'], 2);
                            }
                            if (tmp['cc_in'] == undefined) {
                                tmp['cc_in'] = 0;
                            } else {
                                tmp['cc_in'] = number_format(tmp['cc_in'], 2);
                            }
                            if (tmp['money_in'] == undefined) {
                                tmp['money_in'] = 0;
                            } else {
                                tmp['money_in'] = number_format(tmp['money_in'], 2);
                            }
                            reports.push(tmp);
                        }
                    }

                    dd['reports'] = reports;
                    var html = Mustache.to_html($('#admin-balance-reports-page').html(), dd);
                    $('#admin-content').html(html);
                });

            } else {
                var sy = new syncHandler(),
                    db = sy.getDbInstance(),
                    data = {},
                    dd = {},
                    sql;

                dd['start'] = '';
                dd['end'] = '';

                sql = 'SELECT * FROM "balances"';
                if (this.params['start'] != undefined && this.params['start'] != '' && this.params['end'] != undefined && this.params['end'] != '') {
                    dd['start'] = this.params['start'];
                    dd['end'] = this.params['end'];

                    sql = 'SELECT * FROM "balances" WHERE "date" BETWEEN "' + this.params['start'] + '" AND "' + this.params['end'] + '"';
                }

                db.transaction(function(tx){
                    tx.executeSql(sql, [], function(tx, results){
                        if (results.rows.length > 0) {
                            for (var i=0;i<results.rows.length;i++) {
                                if (data[results.rows.item(i).date] == undefined) {
                                    data[results.rows.item(i).date] = {};
                                    data[results.rows.item(i).date]['date'] = results.rows.item(i).date;
                                }
                                data[results.rows.item(i).date][results.rows.item(i).type] = results.rows.item(i).value;
                            }
                        }

                        var data_array = $.map(data, function(value, index) {
                            return [value];
                        });

                        dd['reports'] = data_array;

                        var html = Mustache.to_html($('#admin-balance-reports-page').html(), dd);
                        $('#admin-content').html(html);
                    },function(a,b){
                        console.log(a);
                        console.log(b);
                    });
                });
            }
        }
    });
});


$(function () {

    FastClick.attach(document.body);

    app.run();
    var $pass_inp = $('#passcode');

    $(document).on('click', '.admin-login-helper', function(){
        var i = $(this).data('val');
        $pass_inp.parent().removeClass('has-error');
        if (i == 'del') {
            $pass_inp.val($pass_inp.val().slice(0,-1));
        } else {
            $pass_inp.val($pass_inp.val() + '' + i);
        }
    });

    $(document).on('click', '#login-button', function(){
        if ($pass_inp.val() == '') {
            alert('Please enter your passcode.');
        } else {
            $.ajax({
                url: "/data",
                type: "POST",
                context: document.body,
                data: {
                    'request': 'loginUser',
                    'password': md5($pass_inp.val()),
                    'fp': 'non-fp-user'
                }
            }).done(function(data) {
                if (data.success && data.id != undefined) {
                    global_user_id = data.id;
                    $.ajax({
                         url: "/data",
                         type: "POST",
                         context: document.body,
                         data: {
                             'request': 'issueCode',
                             'user_id': data.id,
                             'token': getToken()
                         }
                     });

                     toastr.options = {
                         "closeButton": false,
                         "debug": false,
                         "positionClass": "toast-bottom-full-width",
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

                     toastr.success('Please allow a few minutes to arrive', 'SMS code was sent.');
                    $('#modal-sms-code').modal('show');
                } else {
                    $pass_inp.val('');
                    alert('Passcode incorrect.');
                }
            });
        }
    });

    $(document).on('click', '#enter-2fa', function(){
        $.ajax({
            url: "/data",
            type: "POST",
            context: document.body,
            data: {
                'request':      'checkCode',
                'code':         $('#password').val(),
                'user_id':      global_user_id,
                'device_name':  '_admin',
                'token': getToken()
            }
        }).done(function(data) {
            saveToken(data._token);
            if (data.status) {
                Admin.logIn({'id':global_user_id});
                $('#fullScreenLoader').removeClass('hide').css('height', ($(window).height()+100) + 'px');
                localStorage.setItem('currentUser', global_user_id);
                var syncEr = new syncHandler();
                syncEr.doCompleteSync();
            } else {
                toastr.error('You entered an invalid code', 'Invalid code!')
            }
        });
    });

    $(document).on('change', '#for-select', function(){
        if ($(this).val() == 'other') {
            $('.report-datepicker').removeClass('hide');
        } else {
            $('.report-datepicker').addClass('hide');
        }
    });

    $('.report-datepicker input').datetimepicker({});


    $(document).on('change', '#staff-select', function(){
        window.location.href = '#/staff-reports?staff=' + $(this).val() + '&pag=0';
    });

    $(document).on('change', '#top-select', function(){
        window.location.href = '#/tops?type=' + $(this).data('type') + '&perpag=' + $(this).val();
    });

    $(document).on('click', '.admin-salesReports-page-delete', function(){
        document.myCart = new gcLsCart();
        $('#admin-salesReports-page-delete-confirm').modal('show').find('#admin-salesReports-page-delete-id').val($(this).data('id'));
    });

    $(document).on('click', '#resend-code', function(e){
        e.preventDefault();

        $.ajax({
            url: "/data",
            type: "POST",
            context: document.body,
            data: {
                'request': 'issueCode',
                'user_id': global_user_id,
                'token': getToken()
            }
        });

        toastr.options = {
            "closeButton": false,
            "debug": false,
            "positionClass": "toast-bottom-full-width",
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

        toastr.success('Code was resent. Please allow a few minutes to arrive', 'SMS code was sent.');

        return false;
    });

});

function sales_report_export_csv(type, start, end) {
    var sy = new syncHandler(),
        db = sy.getDbInstance(),
        sql,
        myCart = new gcLsCart();

    switch (type) {
        case 'today':
            sql = 'SELECT "orders".*, "taxes"."name" AS "payment_method", "users"."username" ' +
                'FROM "orders" ' +
                'LEFT JOIN "taxes" ON "taxes"."id" = "orders"."pay_type"' +
                'JOIN "users" ON "orders"."userId" = "users"."id" ' +
                'WHERE date > strftime("%Y-%m-%d","now")';
            break;
        case 'last_week':
            sql = 'SELECT "orders".*, "taxes"."name" AS "payment_method", "users"."username" ' +
                'FROM "orders" ' +
                'LEFT JOIN "taxes" ON "taxes"."id" = "orders"."pay_type"' +
                'JOIN "users" ON "orders"."userId" = "users"."id" ' +
                'WHERE date BETWEEN datetime("now", " -6 days") AND datetime("now")';
            break;
        case 'last_month':
            sql = 'SELECT "orders".*, "taxes"."name" AS "payment_method", "users"."username" ' +
                'FROM "orders" ' +
                'LEFT JOIN "taxes" ON "taxes"."id" = "orders"."pay_type"' +
                'JOIN "users" ON "orders"."userId" = "users"."id" ' +
                'WHERE date BETWEEN datetime("now", "start of month") AND datetime("now")';
            break;
        case 'last_3_months':
            sql = 'SELECT "orders".*, "taxes"."name" AS "payment_method", "users"."username" ' +
                'FROM "orders" ' +
                'LEFT JOIN "taxes" ON "taxes"."id" = "orders"."pay_type"' +
                'JOIN "users" ON "orders"."userId" = "users"."id" ' +
                'WHERE date BETWEEN datetime("now", "-3 months") AND datetime("now")';
            break;
        case 'other':
            var d = new Date(start);
            var m = ((d.getMonth()+1)<10) ? '0' + (d.getMonth()+1) : (d.getMonth()+1);
            var date_start = d.getFullYear() + '-' + m + '-' + d.getDate();

            d = new Date(end);
            m = ((d.getMonth()+1)<10) ? '0' + (d.getMonth()+1) : (d.getMonth()+1);
            var date_end = d.getFullYear() + '-' + m + '-' + d.getDate();

            sql = 'SELECT "orders".*, "taxes"."name" AS "payment_method", "users"."username" ' +
                'FROM "orders" ' +
                'LEFT JOIN "taxes" ON "taxes"."id" = "orders"."pay_type"' +
                'JOIN "users" ON "orders"."userId" = "users"."id" ' +
                'WHERE date BETWEEN datetime("' + date_start + '") AND datetime("' + date_end + '")';
            break;
    }

    db.transaction(function(tx){
        tx.executeSql(sql, [], function(tx, results){
            if (results.rows.length > 0) {
                var csvRows = [],
                    tmp, ttmp, a,
                    csvString;

                for(var i=0;i<results.rows.length;i++){

                    tmp = $.extend({}, results.rows.item(i));

                    ttmp = $.extend({}, JSON.parse(tmp['contents']));

                    tmp.contents = myCart.formatCartContent(tmp.contents);

                    for (var j in ttmp) {
                        if (ttmp.hasOwnProperty(j)) {
                            if (ttmp[j].extra_cart != undefined && ttmp[j].extra_cart != '') {
                                tmp.contents += '<br />' + ttmp[j].extra_cart;
                            }
                        }
                    }

                    ttmp = $.map(tmp, function(value, index) {
                        if ((''+value).indexOf(',') !== -1) {
                            return ['"' + strip_tags(value+'') + '"'];
                        }
                        return [strip_tags(value+'')];
                    });

                    csvRows.push(ttmp.join(','));   // unquoted CSV row
                }

                csvString = csvRows.join('\r\n');

                a = document.createElement('a');
                a.href     = 'data:attachment/csv,' + encodeURI(csvString);
                a.target   = '_blank';
                a.download = 'report.csv';
                document.body.appendChild(a);

                a.click();

            } else {
                alert('No data to export');
            }
        });
    });
}

function tops_export_csv(type, perpag) {
    if (perpag == undefined || perpag == '') {
        perpag = 10;
    }
    var sy = new syncHandler(),
        db = sy.getDbInstance(),
        limit = "0, " + perpag,
        sql;

    switch (type) {
        default:
        case 'staff':
            sql = 'SELECT "users"."id", "users"."firstname" || " " || "users"."lastname" as "name", COUNT("orders"."userId") AS "count" FROM "orders", "users" WHERE "orders"."userId" = "users"."id" GROUP BY "orders"."userId" ORDER BY "count" DESC LIMIT ' + limit;
            break;
        case 'client':
            break;
        case 'products':
            sql = 'SELECT "products"."id", "products"."name", SUM("order_items"."quantity") AS "count" FROM "order_items", "products" WHERE "products"."id" = "order_items"."product_id" GROUP BY "order_items"."product_id" ORDER BY "count" DESC LIMIT ' + limit;
            break;
    }

    db.transaction(function(tx){
        tx.executeSql(sql, [], function(tx, results){
            var csvRows = [],
                a, csvString;

            for (var i=0;i<results.rows.length; i++) {
                csvRows.push([
                    results.rows.item(i).id,
                    results.rows.item(i).name,
                    results.rows.item(i).count
                ].join(','));
            }

            csvString = csvRows.join('\r\n');

            a = document.createElement('a');
            a.href     = 'data:attachment/csv,' + encodeURI(csvString);
            a.target   = '_blank';
            a.download = 'report.csv';
            document.body.appendChild(a);
            a.click();

        },function(a,b){
            console.warn(a);
            console.warn(b);
        });
    });
}

function staff_report_export_csv(user_id) {
    var sy = new syncHandler(),
        db = sy.getDbInstance(),
        myCart = new gcLsCart();

    db.transaction(function(tx){
        tx.executeSql('SELECT * FROM "orders" WHERE "userId"=?', [user_id], function(tx, results){
            if (results.rows.length > 0) {
                var csvRows = [],
                    tmp, ttmp, a,
                    csvString;

                for (var i=0;i<results.rows.length;i++) {
                    tmp = $.extend({}, results.rows.item(i));
                    ttmp = $.extend({}, JSON.parse(tmp['contents']));
                    tmp.contents = myCart.formatCartContent(tmp.contents)
                    for (var j in ttmp) {
                        if (ttmp.hasOwnProperty(j)) {
                            if (ttmp[j].extra_cart != undefined && ttmp[j].extra_cart != '') {
                                tmp.contents += '<br />' + ttmp[j].extra_cart;
                            }
                        }
                    }

                    ttmp = $.map(tmp, function(value, index) {
                        if ((''+value).indexOf(',') !== -1) {
                            return ['"' + strip_tags(value+'') + '"'];
                        }
                        return [strip_tags(value+'')];
                    });

                    csvRows.push(ttmp.join(','));   // unquoted CSV row
                }

                csvString = csvRows.join('\r\n');

                a = document.createElement('a');
                a.href     = 'data:attachment/csv,' + encodeURI(csvString);
                a.target   = '_blank';
                a.download = 'report.csv';
                document.body.appendChild(a);

                a.click();
            }  else {
                alert('No data to export');
            }
        });
    });
}