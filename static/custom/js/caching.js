/*
 *   Created on: 25.02.2015   12:44:02
 *   Alexander Shulzhenko,  contact@alexshulzhenko.ru
 *
 */
/**
 * Class responsible for caching options and ingredients
 * @returns {Cache}
 */


function Cache() {
    Cache.cached_keys = [];
    //Cache.salt = 'zzvfdkvjd_';
    Cache.salt = 'a_';
    Cache.priceGroups = [];
    Cache.priceData = [];
    Cache.compress = 1; //1 = compress items stored in localstorate. 0 =  don't compress TEMPORARY SOLUTIONS - TODO
    var use_locastorage = 0; // 0 = to use localstorarge to cache items. 0 = don't use EXPERIMENTAL FEATURE

    if(use_locastorage == 1) {
        if (/X11|Android/i.test(navigator.userAgent)) {
            Cache.max_size = 1024 * 1024 * 10; //10MB in Chrome on Linux & Android
        } else {
            Cache.max_size = 1024 * 1024 * 5; //5MB for the rest. ie Safari on iPad
        }
    } else {
        Cache.max_size = 0;
    }

    Cache.free_space_to_leave = 1024 * 1024 * 1; //leaving 1MB free for further use in the app

    $.each($('.price-type-action'), function (ind, elem) {
        Cache.priceGroups.push($(elem).data('price-group'));
        Cache.priceData.push($(elem).data('price'));
    });
}

/**
 * Detects whether results are cached already
 * @returns {Boolean}
 */
Cache.prototype.is_cached = function () {

    var regex = new RegExp('^' + Cache.salt, 'i');
    for (var i in localStorage) {
        if (i.match(regex)) {
            return true;
        }
    }

    return false;
};


/** NOT USED AT THE MOMENT
 *  Stores as much items in cache as possible
 * @returns {undefined}
 */
Cache.prototype.cacheDB = function () {

    var sy = new syncHandler(),
            db = sy.getDbInstance();
    var me = this;

    if (me.is_cached()) {
        return true;
    }

    var priceGroupsLength = Cache.priceGroups.length;


    db.transaction(function (tx) {

        //tx.executeSql('SELECT  "product_id", "options" FROM "product_options" WHERE "product_id" = "213"', [], function (tx, results) {
        tx.executeSql('SELECT  "product_id", "options" FROM "product_options"', [], function (tx, results) {
            var length = results.rows.length;
            for (var i = 0; i < length; i++) {

                var preparsedOptions = '';
//                alert('options concatenate');
//

                for (var options_id = 0; options_id < priceGroupsLength; options_id++) {
//                    preparsedOptions = preParsing(results, i, priceGroups[options]);Mm


                    preparsedOptions = preParsing(results, i, options_id);

//                    var index = results.rows.item(i).product_id + '_' + priceGroups[options];
                    var index = results.rows.item(i).product_id + '_' + Cache.priceGroups[options_id];
                    //console.log('item added ' + index);
                    console.log('results.rows.item(i).product_id is ' + results.rows.item(i).product_id);
                    preparsedOptions = JSON.stringify(preparsedOptions);

                    //console.log('occupied space so far ' + Cachestorage.getCurrentSize())
                    if (me.getFreeSpace(preparsedOptions.length * 2) > 0) {
                        me.store(index, preparsedOptions);
                    } else {
                        console.log('~~~~Cache size is overflowed!!!~~~' + index);
                        break;
                    }

                }


            }
            // $('#loader').css('display', 'none');
        });

    });

};

/**
 *
 * @param {type} needed_space
 * @returns {Boolean} - true if there is enough space in cache, false otherwise
 */
Cache.prototype.getFreeSpace = function (space) {
    space = space || 0;
    return Cache.max_size - Cache.free_space_to_leave - this.getCurrentSize() - space;
};

/**
 * returns current size of cache
 * @returns {Number}
 */
Cache.prototype.getCurrentSize = function () {
    // UTF-16
    return  JSON.stringify(localStorage).length * 2;
};

/**
 * Cleans cache before logging out
 * @returns {undefined}
 */
Cache.prototype.clean = function () {

    var keys = Object.keys(localStorage);
    for (var i = 0; i < keys.length; i++) {
        //if (/^zzvfdkvjd_/.test(keys[i])) {
        if (/^a_/.test(keys[i])) {
            localStorage.removeItem(keys[i]);
        }
    }
};
/**
 * Checks whether item was already cached
 * @param {type} id - unique id of item to be stored
 * @returns {Boolean}
 */
Cache.prototype.isInCache = function (id) {
    if (localStorage.getItem(Cache.salt + id)) {
        return true;
    }
    return false;
};

/**
 * Stores data in cache
 * @param {type} id - unique id of item
 * @param {type} elem - data to be stored, should be converted to string
 * @returns {undefined}
 */
Cache.prototype.store = function (id, elem) {
    if (Cache.compress == 1) {
        elem = LZString.compress(elem); //VV compress
        //elem = _deflate(elem); //VV compress
    }
    localStorage.setItem(Cache.salt + id, elem);
};

/**Returns data of item from cache
 *
 * @param {type} id - id of item
 * @returns {Array|Object}
 */


Cache.prototype.restore = function (id) {

    datas = localStorage.getItem(Cache.salt + id);
   // alert('id to restore is ' + Cache.salt + id);
   // alert('datas is  ' + datas.length);
    if (Cache.compress == 1) {
        var time;
        //console.log('BEFORE encryption');
        time = new Date().getTime();
        datas = LZString.decompress(datas);
        //datas = _inflate(datas);
         // console.log('AFTER encryption');
        time = new Date().getTime()  - time;
        console.log('DECRYPTION TIME: ~~~~~~~~~~~~~~~~~~~~~~~~~~~(in ms) ' + time);
    }

    datas = JSON.parse(datas);
    // var output = JSON.parse(localStorage.getItem(Cache.salt + id));
    console.log('encrypted - parsed');
    console.log(datas);
    return datas;
};


/**
 * Reponsible for figuring what each parameter is for
 * @param {type} results - data to parse
 * @param {type} index   - id of item
 * @param {type} priceGroupPredefined  - comes into play when we want to load predefined price group
 * @returns {preParsing.cachingAnonym$0}
 */
function preParsing(results, index, options_id) {
    var time = new Date().getTime();
    console.log('Start preParsing (in ms) ' + 0);

    index = index || 0;

    var priceGroupCurrent = false, priceDataGroup = false;
    if (typeof options_id != 'undefined') { // caching data
        priceGroupCurrent = Cache.priceGroups[options_id];
        priceDataGroup = Cache.priceData[options_id];
    } else {
        priceGroupCurrent = getPriceGroup();
        priceDataGroup = getDataPrice();
    }

    var data = JSON.parse(results.rows.item(index).options),
            template,
            selectors = false,
            dataItemsLength = (typeof data.items !== 'undefined') ? data.items.length : 0,
            dataItemsOptionsLength = 0,
            priceGroup = priceGroupCurrent;

    for (var i = 0; i < dataItemsLength; i++)
    {
        dataItemsOptionsLength = data.items[i].options.length;
        while (dataItemsOptionsLength--)
        {
            if (data.items[i].options[dataItemsOptionsLength].priceGroupName != 'all' && data.items[i].options[dataItemsOptionsLength].priceGroupName != priceGroup)
            {
                data.items[i].options.remove(dataItemsOptionsLength);
            }
        }
        if (data.items[i].options.length == 0)
        {
            data.items.remove(i, 1);
            data.halfs.remove(i, 1);
            data.ingredients.remove(i, 1);
        }

        data.items[i].dataIndex = i + 1;
    }

    for (var i in data.items) {
        if (data.items.hasOwnProperty(i)) {
            $.each(data.items[i].options,function(index,obj){
              obj.hasPrice = parseInt(obj.variation_price) ? true : false;
            });
            if (data.items[i].options.length > populateOptionSliderForProduct.MAX_NUMBER_OPTIONS) {
                selectors = true;
                data.items[i].selectbox = true;
            } else {
                data.items[i].selectbox = false;
            }
        }
    }
    if (typeof data.items === 'undefined' || typeof data.items.length === 'undefined' || data.items.length === 0)
    {
        data.hasHalf = false;
        data.ingredients = {};
    }


    data.product_price = data['product_' + priceDataGroup];

    if (selectors) {
        template = $('#template-product-options-selectors').html();
    } else {        
        template = $('#template-product-options').html();
    }

    if (typeof data.items !== 'undefined')
    {
        data.items.sort(compareItemsBySortField);
    }
    if (data.halfs !== undefined && data.halfs.length > 0 && !data.isMultiple) {

        var numberElements = data.halfs.length;
        for (var i = 0; i < numberElements; i++)
        {
            if (typeof data.halfs[i].items !== 'undefined')
            {
                for (var j in data.halfs[i].items)
                {
                    data.halfs[i].items[j].product_price = data.halfs[i].items[j]['product_' + priceDataGroup];
                }
            }
        }
    }
    else
    {
        data.hasHalf = false;
    }

    console.log('End preParsing (in ms) ' + (new Date().getTime() - time));
    return {'data': data, 'template': template,  'selectors': selectors};
}

// Build HTML when an half is selected and append it in HTML

function buildIngredientsSelector(ingredients,product,isDivided) {


  var container = product.nextAll(".ingredients-selector").eq(0).length ? product.nextAll(".ingredients-selector").eq(0) : product.parents('.variation_selector').nextAll(".ingredients-selector").eq(0);
  var pos = container.data("ingredients_container");
  // Clean the container
  container.html('');
  // Get the good ingredients list from the product ID
  var ing = ingredients.filter(function(el){
    return el.variation_id === product.val();
  });
  var template = $('#template-product-options-ingredients').html();
  // Try to get Ingredients linked inside the product
  if(ing[0] && ing[0].items.length){
    // Set the position of the select
    ing[0].dataIndex = pos;
    var ingredientHtml = Mustache.render(template, ing[0]);
    container.html(ingredientHtml);
    if(ing[0].items[1]){
      setMultipleSelect2($(container).find('input.extra-ingredients'),convertToSelect2Data(ing[0].items[1].items,isDivided));
    }

  }
  // Try to find it in the variation table, slower... and hacky
  else {
    populateHalfPizzaIngredients(product.val(),function(data){
      if(data.items.length){
        var ingredientHtml = Mustache.render(template, data);

        container.html(ingredientHtml);
        setMultipleSelect2($(container).find('input.extra-ingredients'),convertToSelect2Data(data.items[1].items,isDivided));
      }
    });
  }
};

function buildHalfSelector(halfs,product) {
  if(halfs){
    var productPrice = $('#p-productPrice').val();
    var container = product.parents('.variation_selector').nextAll(".half-selector").eq(0);
    var pos = container.data("halfs_container");
    // Get the good half list from the product ID
    var ing = halfs.filter(function(el){
      return el.id === product.val();
    });
    if(ing[0]){
      // Set the id of the first half, for price calculation etc...
      ing[0].variation_id = product.val();
      // Set the fee for adding an half

      if(product.prop('tagName') == 'SELECT'){
        ing[0].halfFee = Math.round(product.find("option:selected").data('halffee'));
      }
      else {
        ing[0].halfFee = Math.round(product.data('halffee'));
      }
      $.each(ing[0].items,function(item,obj){
        obj.textPrice = (parseFloat(obj.variation_price)/2).toFixed(2);
        // TODO move this in the model, JS or PHP
        if(!obj.isDeal){
          obj.textPrice = (obj.product_price - parseFloat(productPrice))/2;
          obj.variation_price = (obj.product_price - parseFloat(productPrice)) + parseFloat(product.data('price')) ;

        }
        obj.hasPrice = parseFloat(obj.textPrice) !== 0 ? true : false;
      });
      var template = $('#template-product-options-halfs').html();
      var halfHtml = Mustache.to_html(template, ing[0]);

      container.html(halfHtml);
      setupSelect2($(container).find('select'));
    }
    else {
      container.html('');
    }

  }
}

function convertToSelect2Data(data,isDivided){
  $.each(data,function(index,item){
    item.id = item.ingredient_id;
    var text = item.ingredient_name;
    if(item.price && item.price != 0){
      if(isDivided){
        text +=  ' ($'+item.price/2+")";
      }
      else {
        text +=  ' ($'+item.price+")";
      }

    }
    item.text = text;
  });
  return data
}

//used for extra ingr. selection
function setMultipleSelect2(el,ingredients,insertData){
    el.select2({
      data:ingredients,
      multiple:true,
      blurOnChange: true,
      closeOnSelect: false,
      searchInputPlaceholder : "Search extra ingredients..."
    })
    .on('select2-open', function() {
        //$('#select2-drop').css('top',"49px");
        var input = $(this).parent().find('.select2-search-field');
        if(input.length){
          var search = $('<ul />').addClass('select2-search').html(input.show());
          search.find('input').attr('style','');
          $('#select2-drop').prepend(search);
        }

        // Test if a close button exist (sometime the container is not destoyed ... a bug in Select2 maybe)
        if($('.select2-close-button').length == 0){
            //adding Close button
            var button = $('<button type="submit" class="btn btn-default select2-close-button">CLOSE</button>').on('mouseup', function(e) {
               el.select2("close");
            });
            $('#select2-drop').append(button);
        }
        //show virtual keyboard - see alteration in script.js (around line 1295) of the virtual keybaord. TODO
        setTimeout(function() {
            $('.select2-input').focus();
        }, 500);

    })

    .on('select2-close', function() {
        $('.select2-close-button').remove();
    })

    .on('select2-selecting', function() {
        $(".select2-results").effect( "highlight", {color:"#FFFF7F"}, 1000 );
        $('.select2-input').focus(); //keeping the virtual keyboard on when using multiselect
    });
    if(insertData){
      el.select2('data',[]);
      el.select2('data',insertData);
    }

}

//used for 2nd half selection
function setupSelect2(el){

    if (Device.turn_on_thick_scrollbars()) {
        el.select2({
            //minimumResultsForSearch: -1, //hide search field
            //disabled: false
            searchInputPlaceholder : "Search 2nd half..."
         })
        // @TODO Modify select2 that we can defer the event when select2 is fully loaded, it seem that the event is not fired at the good moment
        // That result to some weird behaviour
        // The setTimeout is addded to temporary resolve the problem
        .on('select2-loaded', function() {
            setTimeout(function() {
                $('#select2-drop').addClass('select2_absolute_position'); //need to append here. won't work properly on touchscreen when simply having #select2-drop{...} in css file. Works OK in mutliselect above though
            }, 100);
        })

        .on('select2-close', function() {
            $('.select2-focusser').hide(); //hide virtual keyboard
            //$('#fulloverflow').css('z-index',1040);
        });

        //el.prev().find('.select2-search, .select2-focusser').hide(); //prevent virtual keyboard from popping up
  }
}

function updatePriceForParentProduct(ingredients,el){

    var parentVariationSelector = $(el).parent().prevAll('.variation_selector').first();
    var parentVariationId = parentVariationSelector.find('option:selected').length ? parentVariationSelector.find('option:selected').val() : parentVariationSelector.find('input:checked').val()
    var productIngList = parentVariationSelector.nextAll('.ingredients-selector').first().find('input.extra-ingredients');
    var divided = el.find("option:selected").val() == '' ? false : true;
    var values;
    if(productIngList.length){

      if(productIngList.val() && productIngList.val() != ''){
        var values = JSON.parse(productIngList.val());
        // TODO Do a function for that, something reusable
        $.each(values,function(index,product){
          product.text = product.ingredient_name;
          if(product.price && product.price != 0){
            if(divided){
              product.text += ' ($'+product.price/2+')';
            }
            else {
              product.text += ' ($'+product.price+')';
            }
          }
        });
        productIngList.val('');
      }

      productIngList.select2('destroy');

      // TODO Make the same code for the buildIngredients, Update, and price update, these code are quite similar
      var ing = ingredients.filter(function(el){
        return el.variation_id === parentVariationId;
      });

      if(ing[0] && ing[0].items.length){
          setMultipleSelect2(productIngList,convertToSelect2Data(ing[0].items[1].items,divided),values);
        }
      // Try to find it in the variation table, slower... and hacky
      else {
        populateHalfPizzaIngredients(product.val(),function(data){
          if(data.items.length){
            setMultipleSelect2(productIngList,convertToSelect2Data(data.items[1].items,divided),values);
          }
        });
      }
    }
}

function postParsing(data, update_product, qty, cartId, note) {

    var rightPanel = $('#product-extra-options_special_item,#product-extra-options');

    // Catch all the modification inside the right panel
    rightPanel.on('keydown change tap click','input, select', function () {
        var el = $(this);
        if(el.data('type') == 'product' || el.data('type') == 'half'){
          var isDivided = false;
          if(this.name == "half"){
            updatePriceForParentProduct(data.ingredients,el);
            isDivided = true;
          }
          buildIngredientsSelector(data.ingredients,el,isDivided);

          if(this.name != "half"){
            buildHalfSelector(data.halfs,el)
          }

          if(this.type == 'radio'){
            $(this).parent().siblings().removeClass('active');
            $(this).parent().addClass('active');
          }
        }
        myCart.showTotalPrice(this);
    });

    rightPanel.on('click tap','.extra-tab-btn',function(){
      if($(this).parents('ul').next().find('.extra input.extra-ingredients').val() == ''){
        var self = this;
        // We have to wait that the content is already viewable for the positionning calculation
        setTimeout(function() {
          $(self).parents('ul').next().find('.add_extra_ingredients').click();
        },300);
      }
    })

    // Render the first option of each select.
    rightPanel.find('select:not(.multiple)').each(function(index,el){
      $(el).trigger("change");
      setupSelect2($(el));
    });

    if (update_product == undefined) {
      rightPanel.find('.half-selector-option-all-buttons').each(function(index,el){
        setTimeout(function() {
          $(el).find('label:first input').prop('checked',true).trigger('click');
        },0);
      });
    }


    cleanUpEmptyOptions();

    if (update_product != undefined)
    {
        if (update_product == '') {
            update_product = {};
        }

        update_product.qty = qty;
        update_product.cartId = cartId;
        update_product.note = note;
        myCart.updateOptionSliderForProduct(update_product);

    }
    $('#trigger-cartadd').show();
}



//compression for localstorage: see http://j0rr1t.blogspot.com.es/2013/02/optimal-compression-for-client-side.html
function _deflate(s) {
    var out = '', i, len, val;
    len = s.length;
    if(len < 1 || typeof s !== 'string'){
      return s;
    }
    // Ensure 1 byte chars (0 / 254)
    s = unescape(encodeURIComponent(s));
    if((len % 2) === 1){
      // Ad an extra byte for byte allignment
      // Odd bytes won't fill a 16 bits slot
      s +=String.fromCharCode(0);
    }
    i = 0;
    len = s.length;
    for(; i< len; i+=2){
      val = (s.charCodeAt(i+1) << 8) + (s.charCodeAt(i));
      out += String.fromCharCode(val);
    }
    return out;
  }

//decompression for localstorage: see http://j0rr1t.blogspot.com.es/2013/02/optimal-compression-for-client-side.html
function _inflate(s) {
    if(s.length < 1 || typeof s !== 'string'){
      return s;
    }
    var n, out = '', high, low, i, len;
    i = 0;
    len = s.length;
    for(; i< len; i++){
      n = s.charCodeAt(i);
      high = n >> 8;
      low = n - (high << 8);
      out += String.fromCharCode(low);
      if(i == len-1 && high == 0){
        // skip byte
      }else{
        out += String.fromCharCode(high);
      }

    }
    return decodeURIComponent(escape(out));
  }
