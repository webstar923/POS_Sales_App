// set last latter to disable repetition of alpha-scroll
var lastLetter = false;

// keep the category order global so we can use this in showing slider products
var categories = [];

// keep log of loaded categories
var loadedCats = [];

$(document).ready(function () {

    myCart.printCart();
    updateCartElements();

    $(document).on('ajaxStop', loaderHide());

    if($('#alpha-scroll').length>0) {
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
                            $('.products-items-list').scrollTop(alt);
                            return false;
                        }
                    });
                } else {
                    e = '#';
                    $('.products-items-list').scrollTop(0);
                }
                //console.log(e);
            }
        });
    }
    /*
     * Bind event on search control
     * */

    $(document).on('keyup', '#search-control', function (e) {

        console.log('keyup search-control');

        // If key is Enter
        if (e.keyCode == 13) {
            var id = $('.tt-dataset-products').find('.tt-suggestions').first().find('span.sc-id').html();
            var $el = $('.product-item[data-id="' + id + '"]').first();
            if (id == undefined) {
                $el = $('.product-item:not(.hide)').first();
            }
            if ($el.length > 0) {
                trigger_taphold($el);
            }
            $(this).autocomplete('close').blur().val('');
        }
        // get the value of the search field
        var v = $(this).val(),
                reg;

        // add some constraints here if you want
        if (v.length > 0) {
            // escape all regex characters
            v = v.replace(/[-[\]{}()*+?.,\\^$|#]/g, "\\$&");
            var searchArray = v.split(' ');
            // create new regex object

            //reg = new RegExp('(?=.*(^|\\s)'+searchArray.join(')(?=.*(^|\\s)')+').*$','i');
            reg = new RegExp('(?=.*'+searchArray.join(')(?=.*')+').*$','i');
            // iterate through all blocks and hide when the don't match
            $('.special-listing').addClass('hide');
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

if(/Android/i.test(navigator.userAgent)) {
    $( "#search-control").autocomplete({
        position: { my: "left bottom", at: "left top", collision: "none" }
    });
 }
 else {
    $( "#search-control").autocomplete({
        //position: { my: "left top", at: "left bottom", collision: "none" }
        position: { my: "left bottom", at: "left top", collision: "none" }

    });
 }

    $("#search-control").autocomplete({
        source: function (a, cb) {

            var matches = [], substringRegex,
                    sy = new syncHandler(),
                    db = sy.getDbInstance(),
                    term = a.term;
            db.transaction(function (tx) {
                var search = '';
                var termList = term.split(' ');
                $.each(termList,function(index,word){
                  search += index ? 'and' : '';
                  search += '"name" like "%' + word + '%"' ;
                });
                tx.executeSql('SELECT "name", "id", "variation" FROM "products" WHERE '+search+' AND "name" <> "misc-disc-" LIMIT 7', [], function (tx, results) {

                    for (var i = 0; i < results.rows.length; i++) {

                        if (results.rows.item(i).variation != 0) { // right panel with order details will be opened
                            matches.push({
                                'value': '>' + results.rows.item(i).name,
                                "id": results.rows.item(i).id
                            });
                        }
                        else {
                            matches.push({
                                'value': results.rows.item(i).name,
                                "id": results.rows.item(i).id
                            });
                        }
                    }


                    cb(matches);
                });
            });
        },
        select: function (event, ui) {

            var id = ui.item.id;
//            var id = $('.tt-dataset-products').find('.tt-suggestions').first().find('span.sc-id').html();
            var $el = $('.product-item[data-id="' + id + '"]').first();
            if (id == undefined) {
                $el = $('.product-item:not(.hide)').first();
            }
            if ($el.length > 0) {
                trigger_taphold($el);
            }
            $(this).autocomplete('close').blur().val('');
            resetSearch();

            event.preventDefault();

        },
        change: function (event, ui) {

            $("#search-control").trigger('keyup');
//            $('#search-control').val('');

//            resetSearch();

        },
        close: function (event, ui) {

            $("#search-control").trigger('keyup');
//            $('#search-control').val('');
            //resetSearch();
        }
    });

    // ------------------------------------- playground

    /**
     * Bind event on category panel
     */
    $(document).on('click', '.category-changer', function () {


        $('#sidr-categories-content li.active').removeClass('active');
        $(this).parent().addClass('active');
        $('#trigger-categories').html($(this).html());

        var sw_index = $(this).parent().index();
        document.mySwipe.swipeTo(sw_index, 300, false);
        setTimeout(function () {
            resetSlider();
        }, 350);

        if ($(window).width() <= 800) {
            $.sidr('close', 'sidr-categories');
        }

        /*document.mySwipe.swipeTo(0, 0, false);
         document.mySwipe.destroy();
         $('#swiper').find('div:first').html('');
         document.swiperInit();
         document.mySwipe.reInit();
         if (document.loadedCats != undefined) {
         document.loadedCats = [];
         }
         loadedCats = [];
         populateProductsByCategoryId($(this).data('cat'));*/

    });


    // instantiate the sync object
    var sy = new syncHandler();

    // check if we downloaded the online data
    if (sy.isLocal()) {

        /**
         * set some variable that we will use
         */
        var db = sy.getDbInstance(),
                cats = [], sets = [],
                tmp, ttmp = {};

        if (!localStorage.getItem('settings')) {
            // get settings from db
            db.transaction(function (tx) {
                tx.executeSql('SELECT * FROM "settings"', [], function (tx, results) {
                    for (var i = 0; i < results.rows.length; i++) {
                        tmp = jQuery.extend({}, results.rows.item(i));
                        ttmp[tmp['name']] = tmp['value'];
                    }
                    localStorage.setItem('settings', JSON.stringify(ttmp));
                    document.pos_settings = ttmp;
                });
            });
        } else {
            document.pos_settings = JSON.parse(localStorage.getItem('settings'));
        }


        // get categories from db
        db.transaction(function (tx) {

            tx.executeSql('SELECT * FROM "categories" ORDER BY "sort" ASC', [], function (tx, results) {
                for (var i = 0; i < results.rows.length; i++) {
                    tmp = jQuery.extend({}, results.rows.item(i));
                    tmp.name = decodeURI(tmp.name);
                    cats.push(tmp);

                    // push the category id in categories array to keep them ordered
                    categories.push({
                        'key': tmp.id,
                        'value': tmp.name,
                        'color': tmp.color
                    });
                }

                populateCategories({'categories': cats});
                populateProductsByCategoryId(null);
            });
        });

    } else {
        if (!localStorage.getItem('currentUser')) {
            window.location.href = 'login';
        } else {
            $.ajax({
                url: "/data",
                type: "POST",
                context: document.body,
                data: {request: 'getCategories', 'token': getToken()}
            }).done(function (data) {
                saveToken(data._token);
                if (data.categories !== undefined) {
                    populateCategories(data);
                }

                populateProductsByCategoryId(null);

            });
        }
    }

});

/**
 * extends array prototype to find the next item by index
 * non traditional numeric index array (fucking javascript bullshit...)
 * @param key
 * @returns {boolean|object}
 */
Array.prototype.itemAfter = function (key) {
    var found = false;
    for (var i in this) {
        if (this.hasOwnProperty(i)) {
            if (found)
                return this[i];
            if (this[i].key == key)
                found = true;
        }
    }
    return false;
};

/**
 * extends array prototype to find the prev item by index
 * non traditional numeric index array (fucking javascript bullshit...)
 * @param key
 * @returns {boolean|object}
 */
Array.prototype.itemBefore = function (key) {
    var found = false;
    for (var i in this) {
        if (this.hasOwnProperty(i)) {
            if (this[i].key == key && found) {
                return this[found];
            }
            found = i;
        }
    }
    return false;
};

/**
 * extends array prototype to find if the given key is the first element
 * non traditional numeric index array (fucking javascript bullshit...)
 * @param key
 * @returns {*}
 */
Array.prototype.getItem = function (key) {
    for (var i in this) {
        if (this.hasOwnProperty(i))
            if (this[i].key == key)
                return this[i];
    }
    return false;
};

Array.prototype.isFirst = function (key) {
    for (var i in this) {
        if (this.hasOwnProperty(i)) {
            if (this[i].key == key) {
                break;
            }
        }
    }
    if (i == 0)
        return true;
    else
        return false;
}

/**
 * extends array prototype to get the first item
 * non traditional numeric index array (fucking javascript bullshit...)
 * @returns {boolean|object}
 */
Array.prototype.itemFirst = function () {
    for (var i in this) {
        if (this.hasOwnProperty(i)) {
            return this[i];
        }
    }
    return false;
};

// keep this global - may be used in other places -
function resetSearch() {
    $('.product-item').removeClass('hide');
    $('#search-control').val('');
    $('.special-listing').removeClass('hide');
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
    var template = $('#template-select-category').html();
    var info = Mustache.to_html(template, data);
    $('#sidr-categories-content').html(info);
}

var loadedCats = [];
function populateProductsByCategoryId(id) {
    var sy = new syncHandler();
    if (sy.isLocal()) {
        var db = sy.getDbInstance(),
                sql, info, prev_cat, next_cat, cat_name,
                isSpecial = false,
                has_special = false,
                prods = [],
                prods_order = {},
                special = [],
                toAdd = [],
                args = [],
                slides = {
                    'jump_to': false,
                    'toAdd': []
                },
        ind, color;

        db.transaction(function (tx) {
            //VV tx.executeSql('SELECT "products".*,"categories"."color" FROM "products", "categories" WHERE "products"."categoryId" = "categories".id order by "products"."name"', [], function (tx, results) {
            tx.executeSql('SELECT "products".*,"categories"."color" FROM "products", "categories" WHERE "products"."categoryId" = "categories".id order by "products"."sort"', [], function (tx, results) {

                for (var i = 0; i < results.rows.length; i++) {
                    tmp = jQuery.extend({}, results.rows.item(i));
                    tmp.rawName = decodeURI(tmp.name);
                    tmp.name = decodeURI(tmp.displayName);
                    delete tmp.displayName;
                    prods.push(tmp);
                 //VV   if (tmp.sort != null && tmp.sort != '') {
                 //VV       special.push($.extend({}, tmp));
                 //VV   }
                }

                ind = 1;
                for (var i in special) {
                    if (special.hasOwnProperty(i)) {
                        if (ind == 10)
                            break;
                        special[i].skey = ind;
                        ind++;
                    }
                }
                if (ind < 10) {
                    for (var i in prods) {
                        if (prods.hasOwnProperty(i)) {
                            if (ind == 10)
                                break;
                            prods[i].skey = ind;
                            ind++;
                        }
                    }
                }

                var template = $('#template-list-products').html();
                info = Mustache.to_html(template, {'color': color, 'cat': id, 'cat-name': cat_name, 'populated': true, 'has_special': has_special, 'special': special, 'products': prods});
                toAdd.push(info);

               //VV tx.executeSql('SELECT "products".*,"categories"."color" FROM "products", "categories" WHERE "products"."categoryId" = "categories".id order by "products"."categoryId", "products"."name"', [], function (tx, results) {
                tx.executeSql('SELECT "products".*,"categories"."color" FROM "products", "categories" WHERE "products"."categoryId" = "categories".id order by "products"."categoryId", "products"."sort"', [], function (tx, results) {

                    prods = [];
                    special = [];
                    ind = 1;

                    for (var i = 0; i < results.rows.length; i++) {
                        tmp = jQuery.extend({}, results.rows.item(i));
                        tmp.rawName = decodeURI(tmp.name);
                        tmp.name = decodeURI(tmp.displayName);
                        delete tmp.displayName;
                        if (prods[tmp['categoryId']] == undefined) {
                            prods[tmp['categoryId']] = []
                        }
                        prods[tmp['categoryId']].push(tmp);
                   //     if (tmp.sort != null && tmp.sort != '') {
                   //         if (special[tmp['categoryId']] == undefined) {
                   //             special[tmp['categoryId']] = [];
                   //         }
                   //         special[tmp['categoryId']].push($.extend({}, tmp));
                   //     }
                    }

                    for (var i in prods) {
                        if (prods.hasOwnProperty(i)) {
                            ind = 1;
                            if (special[i] != undefined) {
                                if (ind < 10) {
                                    for (var j = 0; j < special[i].length; j++) {
                                        special[i][j].skey = ind;
                                        ind++;
                                    }
                                }
                            }
                            if (ind < 10) {
                                for (var j = 0; j < prods[i].length; j++) {
                                    if (ind == 10)
                                        break;
                                    prods[i][j].skey = ind;
                                    ind++;
                                }
                            }
                        }
                    }

                    var k = 0,
                            key;
                    for (var i in categories) {
                        if (categories.hasOwnProperty(i)) {
                            prods_order[k] = {
                                'key': categories[i].key,
                                'prods': prods[categories[i].key]
                            }
                            k++;
                        }
                    }

                    for (var i in prods_order) {
                        if (prods_order.hasOwnProperty(i)) {
                            key = prods_order[i].key;
                            if (special[key] != undefined && special[key].length > 0) {
                                has_special = true;
                            } else {
                                has_special = false;
                                special[key] = [];
                            }
                            info = Mustache.to_html(template, {
                                'color': color,
                                'cat': i,
                                'cat-name': categories.getItem(key).value,
                                'populated': true,
                                'has_special': has_special,
                                'special': special[key],
                                'products': prods_order[i].prods
                            });
                            toAdd.push(info);
                        }
                    }

                    slides.toAdd = toAdd;
                    populateHtmlAndResetSlider(slides, resetSlider);
                });
            });

        });

    }
}

function populateSlide(el, dir) {
    var sy = new syncHandler();
    if (sy.isLocal()) {
        var cat = el.data('category'),
                cat_name = el.data('category-name'),
                populated = el.data('populated'),
                slide = el.parent(),
                has_special = false,
                sql, tmp, info, next_cat, prev_cat,
                db = sy.getDbInstance(),
                prods = [],
                toAdd = [],
                args = [],
                special = [],
                slides = {
                    'jump_to': false,
                    'toAdd': []
                },
        template = $('#template-list-products').html(),
                color;

        $('#trigger-categories').html(cat_name);

        if (populated == 'false' || !populated) {
            db.transaction(function (tx) {
                if (cat == null || cat.length == 0 || cat == '') {
                    // TODO: change the order by col when this will be implemented
                    sql = 'SELECT * FROM "products" ORDER BY "name"';
                } else {
                    // TODO: change the order by col when this will be implemented
                    sql = 'SELECT * FROM "products" WHERE "categoryId"=? ORDER BY "name"';
                    args.push(cat);
                }

                tx.executeSql(sql, args, function (tx, results) {
                    for (var i = 0; i < results.rows.length; i++) {
                        tmp = jQuery.extend({}, results.rows.item(i));
                        tmp.rawName = decodeURI(tmp.name);
                        tmp.name = decodeURI(tmp.displayName);
                        delete tmp.displayName;
                        prods.push(tmp);
                   //     if (tmp.sort != null && tmp.sort != '' && cat != '' /*|| cat.length != 0 || cat != '')*/) {
                   //         special.push(tmp);
                   //     }
                    }

                    if (special.length > 0)
                        has_special = true;
                    color = categories.getItem(cat).color;

                    info = Mustache.to_html(template, {'color': color, 'cat': cat, 'cat-name': cat_name, 'has_special': has_special, 'populated': true, 'special': special, 'products': prods});
                    el.remove();
                    slide.prepend(info);
                });
            });
        }

        switch (dir) {
            case 'next':
                next_cat = categories.itemAfter(cat);
                if (next_cat && loadedCats.indexOf(next_cat.key) == -1) {
                    loadedCats.push(next_cat.key);
                    info = Mustache.to_html(template, {'cat': next_cat.key, 'cat-name': next_cat.value, 'populated': false, 'products': []});
                    toAdd.push(info);
                }
                break;
            case 'prev':
                prev_cat = categories.itemBefore(cat);
                if (prev_cat && loadedCats.indexOf(prev_cat.key) == -1) {
                    loadedCats.push(prev_cat.key);
                    info = Mustache.to_html(template, {'cat': prev_cat.key, 'cat-name': prev_cat.value, 'populated': false, 'products': []});
                    toAdd.push(info);
                    slides.action = 'prepend';
                    slides.jump_to = 1;
                }
                if (categories.isFirst(cat) && loadedCats.indexOf(null) == -1) {
                    loadedCats.push(null);
                    info = Mustache.to_html(template, {'cat': null, 'cat-name': 'All Categories', 'populated': false, 'products': []});
                    toAdd.push(info);
                    slides.action = 'prepend';
                    slides.jump_to = 1;
                }
                break;
        }

        slides.toAdd = toAdd;
        populateHtmlAndResetSlider(slides, resetSlider);

    } else {
        // TODO: adapt this on production
        alert('huston, we have a problem 2');
    }
}

function populateHtmlAndResetSlider(slides, callback) {
    var toAdd = slides.toAdd;

    if (slides.action == undefined) {
        slides.action = 'append';
    }
    for (var i = 0; i < toAdd.length; i++) {
        if (slides.action == 'append') {
            document.mySwipe.appendSlide(toAdd[i] + '<div class="clearfix"></div>', 'swiper-slide');
        }
        if (slides.action == 'prepend') {
            document.mySwipe.prependSlide(toAdd[i] + '<div class="clearfix"></div>', 'swiper-slide');
        }
    }

    if (slides.jump_to) {
        document.mySwipe.swipeTo(slides.jump_to, 0, false)
    }

    if (typeof callback === 'function') {
        callback();
    }
}
function resetSlider() {
    document.mySwipe.reInit();
    setTimeout(function () {
        var h = $(document.mySwipe.getSlide(document.mySwipe.activeIndex)).find('div.clearfix:last').height();
        var sh = $('#swiper-height-relative').height();
        if (h < sh) {
            h = sh;
        }
        $('#swiper').css('overflow', 'hidden');
        $('#swiper').css('height', h + 'px');
        document.bindProductsEvent();
    }, 200);
}


