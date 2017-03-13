/*
 *   Created for the sake  of logic separation
 *
 *   Created on: 19.02.2015   15:27:50
 *   Alexander Shulzhenko,  contact@alexshulzhenko.ru
 */

/**
 * Responsible for formatting of cart
 *
 * To avoid futher cluttering
 * @returns {Formatter}
 */
function Formatter() {
    /**
     * Notes:
     *  Special item means an item which has more  than variation
    */

    this.formatNoteText = 'NOTE: ';

    var out = '';
    /**
     * Gathers all options , residue from old code. Kept for compatability
     * @param {Object} extra
     * @returns {Array|Formatter.optionsHarvesting.options}
     */


    /**
     *  Old formatting for usual items
     *
     * @param {Object} extra
     * @param {Object} options
     * @returns {String}  - formatted string which is sent for the cart in the user's interface
     */
    this.formatUnspecialItem = function (extra)
    {
        var result = '';
        var self = this;

        var template = $('#template-product-cart');
        $.each(extra.products,function(index,item){
          item.parts = self.formatIngredients(item.id,extra);
          result += Mustache.to_html(template.html(),item);
        });

        return result;
    };



    /***
     *Old formatting for two halfs items
     * @param {Object} extra
     * @param {Object} options
     * @param {String} srcName
     * @returns {String}
     * <printer-indentation> tag is used in cartformat_helper.php to indent NO and EXTRA ingredients lines
     */

     // Since Halfs in Deals and Halfs are the same, the data than come need to be the same.

    this.formatTwoHalfsProduct = function (extra, srcName) {
        console.log('half',extra);
        var result = '';
        var self = this;
        var template = $('#template-product-cart');

        // Format the datas for Mustache (Use the same template than for halfs in deals)
        $.each(extra.products,function(index,item){
          item.parts = self.formatIngredients(item.id,extra);
          item.product_var = item.name;
          item.name = srcName;
          item.hasHalf = true;
          item.half.halfparts = self.formatIngredients(item.half.id,extra);

          result +=  Mustache.to_html(template.html(), item);
        });

        return result;

    };


    /**
     *
     * @param {Object} extra
     * @param {Object} options
     * @returns {String} - formatted string
     * <printer-indentation> tag is used in cartformat_helper.php to indent NO and EXTRA ingredients lines
     */

    this.formatIngredients = function(id,extra){
        // Find a better way to handle this, a bit hacky for now
        var tmpArr = extra.parts[id];
        if(tmpArr){
          tmpArr.hasIncluded = function(){
            return tmpArr.included && tmpArr.included.length ? true : false;
          }
          tmpArr.hasExtra = function(){
            return tmpArr.extra && tmpArr.extra.length ? true : false;
          }
          // Since mustache can't handle the last item, we had manually a property to the last object
          if(tmpArr.included && tmpArr.included.length){
            tmpArr.included[tmpArr.included.length-1].isLast = true;
          }
          if(tmpArr.extra && tmpArr.extra.length){
            tmpArr.extra[tmpArr.extra.length-1].isLast = true;
          }
        }



        return tmpArr
    }

    this.formatSpecialItem = function (extra)
    {
        var result = '';
        var self = this;
        var template = $('#template-product-cart');


        $.each(extra.products,function(index,item){

          item.parts = self.formatIngredients(item.id,extra);

          // Helper for mustache that lack of basic things, like if the array is empty... think to move to handlebars
          item.hasHalf = function(){
            return item.half && item.id != '' ? true : false;
          }

          if(item.hasHalf()){
            item.half.halfparts = self.formatIngredients(item.half.id,extra);
            item.product_var = 'Half & Half';
            item.isHalfInDeal = true;
          }

          item.isDeal = true;
          result +=  Mustache.to_html(template.html(), item);

        });

        return result;
    };
}