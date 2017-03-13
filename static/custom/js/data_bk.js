// set last latter to disable repetition of alpha-scroll
var lastLetter = false;
$(document).ready(function () {


    myCart.printCart();
    updateCartElements();

    $(document).on('ajaxStop', loaderHide());

    // alpha scroll tryout
    $('#alpha-scroll').slider().on('slide', function (ev) {
        var e, alt;
        if (lastLetter != ev.value) {
            lastLetter = ev.value;
            if (ev.value >= 27)
                ev = 27;
            if (ev.value != 0) {
                e = String.fromCharCode(parseInt(ev.value) + 96);
                $('.product-item').each(function () {
                    if ($(this).data('name').substr(0, 1).toLowerCase() == e) {
                        alt = $(this).position().top;
                        console.log(alt);
                        $('.products-items-list').scrollTop(alt);
                    }
                });
            } else {
                e = '#';
                $('.products-items-list').scrollTop(0);
            }
            console.log(e);
        }
    });

//    $.ajax({
//        url: "/data",
//        type: "POST",
//        context: document.body,
//        data: { request : 'getProducts', test:0 }
//    }).done(function(data) {
//            console.log(data);
//        });


    // instantiate the sync object
    var sy = new syncHandler();

    // check if we downloaded the online data
    if (sy.isLocal()) {

        /*
         set some variable that we will use
         */
        var db = sy.getDbInstance(),
                cats = [],
                tmp;


        // get categories from db
        db.transaction(function (tx) {
            tx.executeSql('SELECT * FROM "categories"', [], function (tx, results) {
                for (var i = 0; i < results.rows.length; i++) {
                    tmp = jQuery.extend({}, results.rows.item(i));
                    tmp.name = decodeURI(tmp.name);
                    cats.push(tmp);
                }
                populateCategories({'categories': cats});
                populateProductsByCategory($('#select-category'));
            });
        });

    } else {
        //console.log('aici 1');
        $.ajax({
            url: "/data",
            type: "POST",
            context: document.body,
            data: {request: 'getCategories'}
        }).done(function (data) {

            if (data.categories !== undefined) {
                populateCategories(data);
            }

            populateProductsByCategory($('#select-category'));

        });
    }

    $(document).on('click', '.category-changer', function () {
        $('#sidr-categories-content li.active').removeClass('active');
        debugger;
        $(this).parent().addClass('active');
        $('#trigger-categories').html($(this).html());

        document.mySwipe.swipeTo(0, 0, false);
        document.mySwipe.destroy();
        $('#swiper').find('div:first').html('');
        document.swiperInit();
        document.mySwipe.reInit();
        if (document.loadedCats != undefined) {
            document.loadedCats = [];
        }
        loadedCats = [];
        populateProductsByCategory($(this));

    });


    /*
     * Bind event on search control
     * */
    $(document).on('keyup', '#search-control', function () {
        // get the value of the search field
        var v = $(this).val(),
                reg;

        // add some constraints here if you want
        if (v.length > 0) {
            // escape all regex characters
            v = v.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");

            // create new regex object
            reg = new RegExp(v, "i");

            // iterate through all blocks and hide when the don't match
            $('.product-item').each(function () {
                if ($(this).data('name').match(reg) == null) {
                    $(this).addClass('hide');
                } else {
                    $(this).removeClass('hide');
                }
            });
        } else {
            // keep this if you set constraints
            resetSearch();
        }
    });

});

// keep this global - may be used in other places -
function resetSearch() {
    $('.product-item').removeClass('hide');
    $('#search-control').val('');
}

function loaderHide() {
    $('#loader').addClass('nobg animated fadeOut').hide();
    $('#loader').one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', function () {
        $('#loader').hide();
    });
}
function loaderShow(target) {

    if (target !== undefined) {
        $("#loader").appendTo(target);
    }

    $('#loader').removeClass('nobg animated fadeOut').show().addClass('animated fadeIn');
}


function populateCategories(data) {
    //if($('#select-category').length) {
    var template = $('#template-select-category').html();
    var info = Mustache.to_html(template, data);
//        $('#sidr-categories-content').html(info);
    $('#sidr-categories-content').html(info);
    //}
}

var loadedCats = [];
function populateProductsByCategoryId(id, elem) {
    console.log('populateProductsByCategoryId1');
    var sy = new syncHandler();
    if (sy.isLocal()) {
        var db = sy.getDbInstance(),
                next_cat, sql, info, cat_name,
                prods = [],
                toAdd = [];

        db.transaction(function (tx) {
            if (id == undefined || id == null || id == 0) {
                sql = 'SELECT *,(SELECT "id" FROM "categories" ORDER BY "id" ASC LIMIT 1) as "next_cat", ' +
                        ' null as "prev_cat" ' +
                        'FROM "products" ORDER BY "name"';
                cat_name = 'All Categories';
                console.log('q1');
            } else {
                sql = 'SELECT *,(SELECT "id" FROM "categories" WHERE "id" > "' + id + '" ORDER BY "id" ASC LIMIT 1) as "next_cat", ' +
                        '(SELECT "id" FROM "categories" WHERE "id" < "' + id + '" ORDER BY "id" DESC LIMIT 1) as "prev_cat"' +
                        'FROM "products" WHERE "categoryId" = "' + id + '" ORDER BY "name"';
                cat_name = $('#sidr-categories-content').find('a[data-cat="' + id + '"]').html();
                console.log('q2=' + sql);
            }
            $('#trigger-categories').html(cat_name);
            tx.executeSql(sql, [], function (tx, results) {

                next_cat = results.rows.item(0).next_cat;
                prev_cat = results.rows.item(0).prev_cat;

                for (var i = 0; i < results.rows.length; i++) {
                    tmp = jQuery.extend({}, results.rows.item(i));
                    tmp.rawName = decodeURI(tmp.name);
                    tmp.name = decodeURI(tmp.displayName);
                    delete tmp.displayName;
                    prods.push(tmp);
                }
                var template = $('#template-list-products').html();
                info = Mustache.to_html(template, {'cat': id, 'products': prods});

                // check if we have a prev slide
                if (id != $('#sidr-categories-content li:first-of-type a').data('index') && id != undefined) {
                    if (loadedCats.indexOf(prev_cat) == -1) {
                        loadedCats.push(prev_cat);
                        toAdd.push('<div data-cat="' + prev_cat + '"></div>');
                    }
                }

                // check if we have a next slide
                if (id != $('#sidr-categories-content li:last-of-type a').data('cat')) {
                    if (loadedCats.indexOf(next_cat) == -1) {
                        loadedCats.push(next_cat);
                        toAdd.push('<div data-cat="' + next_cat + '"></div>');
                    }
                }

                if (elem.find('.product-item:first').length == 0) {
                    elem.html(info);
                }

                populateHtmlAndResetSlider(toAdd, resetSlider);

                loaderHide();
            });
        });

    } else {
        // TODO: remove this on production
        alert('huston, we have a problem');
    }
}

function populateProductsByCategory(elem) {
    console.log('populateProductsByCategory2');

    loaderShow('#list-products');
    resetSearch();

    var index = elem.data('index');

    // instantiate the sync object
    var sy = new syncHandler();

    // check if we downloaded the online data
    if (sy.isLocal()) {

        /*
         set some variable that we will use
         */
        var db = sy.getDbInstance(),
                prods = [],
                toAdd = [],
                tmp, sql, next_cat, info, prev_cat;


        // get categories from db
        db.transaction(function (tx) {
            if (elem.data('cat') == undefined || elem.data('cat') == 0) {
                sql = 'SELECT *,(SELECT "id" FROM "categories" ORDER BY "id" ASC LIMIT 1) as "next_cat",' +
                        ' null as "prev_cat" ' +
                        'FROM "products" ORDER BY "name"';
            } else {
                sql = 'SELECT *,(SELECT "id" FROM "categories" WHERE "id" > "' + elem.data('cat') + '" ORDER BY "id" ASC LIMIT 1) as "next_cat",' +
                        '(SELECT "id" FROM "categories" WHERE "id" < "' + elem.data('cat') + '" ORDER BY "id" DESC LIMIT 1) as "prev_cat"' +
                        'FROM "products" WHERE "categoryId" = "' + elem.data('cat') + '" ORDER BY "name"';
            }
            tx.executeSql(sql, [], function (tx, results) {
                next_cat = results.rows.item(0).next_cat;
                prev_cat = results.rows.item(0).prev_cat;

                for (var i = 0; i < results.rows.length; i++) {
                    tmp = jQuery.extend({}, results.rows.item(i));
                    tmp.rawName = decodeURI(tmp.name);
                    tmp.name = decodeURI(tmp.displayName);
                    delete tmp.displayName;
                    prods.push(tmp);
                }
                var template = $('#template-list-products').html();
                info = Mustache.to_html(template, {'cat': elem.data('cat'), 'products': prods});

                // check if we have a prev slide
                if (index != $('#sidr-categories-content li:first-of-type a').data('index') && index != undefined) {
                    //console.log('prev_cat here:' + prev_cat);
                    if (loadedCats.indexOf(prev_cat) == -1) {
                        loadedCats.push(prev_cat);
                        toAdd.push('<div data-cat="' + prev_cat + '"></div>');
                    }
                }

                if (loadedCats.indexOf(elem.data('cat')) == -1) {
                    loadedCats.push(elem.data('cat'));
                    toAdd.push(info);
                }

                // check if we have a next slide
                if (index != $('#sidr-categories-content li:last-of-type a').data('index')) {
                    if (loadedCats.indexOf(next_cat) == -1) {
                        loadedCats.push(next_cat);
                        toAdd.push('<div data-cat="' + next_cat + '"></div>');
                    }
                }

                populateHtmlAndResetSlider(toAdd, resetSlider);

                loaderHide();
            });
        });
    } else {
        var info, next_cat,
                toAdd = [];

        $.ajax({
            url: "/data",
            type: "POST",
            data: {request: 'getProductsByCategory', id: elem.data('cat')},
            context: document.body
        }).done(function (data) {
            next_cat = data.products[0].next_cat;

            var template = $('#template-list-products').html();
            info = Mustache.to_html(template, data);

            // check if we have a prev slide
            if (index != $('#sidr-categories-content li:first-of-type a').data('index') && index != undefined) {
                //toAdd.push('<div data-cat="asd1"></div>');
            }

            toAdd.push(info);

            // check if we have a next slide
            if (index != $('#sidr-categories-content li:last-of-type a').data('index')) {
                toAdd.push('<div data-cat="' + next_cat + '"></div>');
            }

            populateHtmlAndResetSlider(toAdd, resetSlider);

            loaderHide();
        });
    }

}
function populateHtmlAndResetSlider(toAdd, callback) {
    for (var i = 0; i < toAdd.length; i++) {
        document.mySwipe.appendSlide(toAdd[i] + '<div class="clearfix"></div>', 'swiper-slide');
    }
    if (toAdd.length > 2) {
        document.mySwipe.swipeTo(1, 0, false)
    }
    if (typeof callback === 'function') {
        callback();
    }
}
function resetSlider() {
    document.mySwipe.reInit();
    var h = $(document.mySwipe.getSlide(document.mySwipe.activeIndex)).find('div.clearfix').height();
    var sh = $('#swiper-height-relative').height();
    if (h < sh) {
        h = sh;
    }
    $('#swiper').css('overflow', 'hidden');
    $('#swiper').css('height', h);
}