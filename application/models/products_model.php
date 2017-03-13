<?php
/**
 * Created by PhpStorm.
 * User: Gabriel Colita
 * Date: 07.02.2014
 * Time: 14:35
 */


class Products_model extends CI_Model{

    const PRODUCTS_PER_PAGE = 24;

    function __construct()
    {
        // Call the Model constructor
        parent::__construct();
    }

    public function getCategories() {
        $categories = $this
            ->db
            ->select('category_id as id, category_name as name, `sort`, `color`')
            ->order_by('category_name','asc')
            ->get('tbl_product_categories')
            ->result();

//        $return = array();
//        foreach($categories as $cat) {
//            $return[] = $cat;
//        }

        return $categories;
    }

    public function getProducts($id = false) {
        $formattedProducts = array();

        $sql = "(SELECT product_name as name, product_id as oid, product_price as price, product_price2 as price2, product_price3 as price3, has_variation as variation, category_id as categoryId, `sort`, has_coupon, idPrinter
                FROM tbl_product";

        if ($id !== false) {
            $sql .= " WHERE product_id = '$id'";
        }
        $sql .= ' ORDER BY `product_name` ASC)';

        $sql .= "UNION";

        $sql .= "(SELECT product_name as name, product_id as oid, product_price as price, product_price2 as price2, product_price3 as price3, has_variation as variation, category_id as categoryId, `sort`, has_coupon, idPrinter
                FROM pos_products";

        if ($id !== false) {
            $sql .= " WHERE product_id = '$id'";
        }
        $sql .= ' ORDER BY `product_name` ASC)';

        /*$this->db
            ->select("product_name as name, product_id as oid, product_price as price, has_variation as variation, category_id as categoryId, `sort`, has_coupon")
            ->order_by('product_name','asc');

        if ($id !== false) {
            $this->db->where('product_id', $id);
        }

        $products = $this->db->get('tbl_product')
            ->result();*/

        $products = $this->db->query($sql)
            ->result();

        foreach($products as $product) {

            $nameArray          = explode(' ',$product->name);
            $finalName          = '';
            $i = 1;
            foreach($nameArray as $word) {
                $finalName.='<div class="title-row-1">'.$word.'</div>';
                $i++;
                if ($i == 3) break;
            }
            $product->displayName      = $finalName;

            $formattedProducts[] = $product;
        }

        return $formattedProducts;
    }

    public function getProductsByCategory($categoryId) {
        if($categoryId && $categoryId != '') {
            $products = $this
                ->db
                ->select('product_name as name, product_id as id, product_price as price, has_variation as variation')
                ->where('category_id',$categoryId)
                ->get('tbl_product')
                ->result();
        } else {
            $products = $this
                ->db
                ->select('product_name as name, product_id as id, product_price as price, has_variation as variation')
                ->order_by('product_name','asc')
                ->get('tbl_product')
                ->result();
        }

        /**
         * Add BreakLines instead of Spaces
         * Split products into 24 items batches
         */
//        $itemCount  = 0;
//        $batch      = 0;
        foreach($products as $product) {
            $product->rawName   = $product->name;
//            $product->name      = str_replace(' ',"<br>",$product->name);

            $nameArray          = explode(' ',$product->name);
            $finalName          = '';
            $i = 1;
            foreach($nameArray as $word) {
                $finalName.='<div class="title-row-1">'.$word.'</div>';
                $i++;
                if ($i == 2) break;
            }
            $product->name      = $finalName;

            $formattedProducts[] = $product;
//            $formattedProducts[$batch][] = $product;

//            $itemCount++;
//            if($itemCount % self::PRODUCTS_PER_PAGE == 0) {
//                $batch++;
//            }
        }


        return $formattedProducts;
    }

    public function getProductById($id) {
        return $this->db
            ->get_where('tbl_product', array('product_id' => $id))
            ->row();
    }

    public function getProductInfo($id) {
        return $this->db
            ->select('product_id, product_price, product_price2, product_price3, product_name, description, has_coupon')
           // ->select('product_id, product_price, product_price2, product_price3, product_name, has_coupon')
            ->where(array('product_id' => $id))
            ->get('tbl_product')
            ->row_array();
    }


    public function getOptionsForProduct($pid) {

        $variation = $this->db->select('has_variation')->where(array('product_id' => $pid))->get('tbl_product')->row_array();
        if ($variation['has_variation'] != 0) {
            $variationsGroups   = $this->getProductVariations($pid);
            $productType        = $this->getProductType($variationsGroups['options']);
            $productInfo        = $this->getProductInfo($pid);
           // $productInfo['description'] = strip_tags($productInfo['description']);

            unset($variationsGroups['options']);

            $data = array_merge($variationsGroups,$productType, $productInfo);
			//var_dump($data); die;
            return $data;
        } else {
            $productInfo        = $this->getProductInfo($pid);
           // $productInfo['description'] = strip_tags($productInfo['description']);
            return $productInfo;
        }

    }

    public function getAllOptionsForProducts() {
        $return = array();
        $prods = $this->db->query("SELECT product_id FROM tbl_product");

        //die( $this->db->last_query());
        foreach ($prods->result() as $prod) {
            $return[] = array(
                'product_id' => $prod->product_id,
                'options' => json_encode($this->getOptionsForProduct($prod->product_id))
            );
        }

        return $return;
    }

    public function getAllVariationsForProducts() {
        $return = array();
        $prods = $this->db->query("SELECT * FROM `tbl_variations`");

        //die( $this->db->last_query());
        foreach ($prods->result() as $prod) {
            $return[] = array(
                'variation_id' => $prod->variation_id,
                'options' => json_encode($this->getIngredientsByVariation($prod->variation_id, false, true))
            );
        }

        return $return;
    }

    /**
     * Get product types (available in veriation_group table)
     * Returns Sizes, Deals, grouped by array key
     *
     * Variation with price 0 is the default one!
     *
     * @param $id
     * @return mixed
     */
    public function getProductVariations($id) {

        $result     = array(
            'halfs'         => false,
            'options'    => false
        );
        $variations =  $this->db
            ->select('variation_group.*, tbl_variations.*, half_pizza_group.*, LOWER(tbl_price_group.name) as priceGroupName')
            ->where('product_id',$id)
            ->where('tbl_variations.available','Y')
            ->join('tbl_variations','variation_group.ID = tbl_variations.variation_group_id','INNER')
            ->join('half_pizza_group','tbl_variations.half_pizza_group_id = half_pizza_group.ID','LEFT')
            ->join('tbl_price_group','tbl_price_group.id = tbl_variations.price_group_id','LEFT')
            ->order_by("variation_group.sort", "asc") //CC
            ->order_by("tbl_variations.sort", "asc") //VV
            ->order_by("variation_name", "asc")
            ->get('variation_group')
            ->result();
//        die( $this->db->last_query());
       // print_r($variations);die;
        if($variations) {
            $result['halfs'] = $this->getMatchedPizzaForHalf($variations);

            foreach($variations as $variation) {
                $result['options'][$variation->title][] = $variation;
            }

            $ingredients = array();
            foreach($result['options'] as $key => $items) {

				$tmp = array(
                    'name' => $key,
                    'options' =>$items,
                );

                foreach ($items as $var) {
					$result['ingredients'][] = array(
                        'variation_id' => $var->variation_id,
                        'items' => $this->getIngredientsByVariation($var->variation_id)
                    );
					$tmp['sort'] = $var->sort;
					$tmp['priceGroupName'] = !empty($var->priceGroupName) ? strtolower($var->priceGroupName) : 'all';
                }
				$result['items'][] = $tmp;
            }
        }
        return $result;
    }


    /**
     * @param $variation_id
     */
    public function getVariationById($id) {
        return $this->db
            ->get_where('tbl_variations', array('variation_id' => $id))
            ->row();
    }



    /**
     * @param $variations
     * @return bool|string
     */
    public function getMatchedPizzaForHalf($variations) {
        $result     = false;

        if($variations) {
//            print_r($variations);die;
            $i = 0;
            foreach($variations as $variation) {
                if(isset($variation->half_pizza_group_id) && $variation->half_pizza_group_id > 0) {

                    $type = $this->getHalfMultipleProduct($variation->half_pizza_group_id);
                    //error_log($type,0);
                    //echo 'variation name='.$variation->variation_name."\n";
                    if($type){
                      $halfs =  $this->db
                        ->select('tbl_product.product_id, product_name, '.
                                ' product_price, product_price2, product_price3, variation_price, variation_id, price_group_id,tbl_variations.variation_name')
                        ->where('half_pizza_group_id',$variation->half_pizza_group_id)
                        ->where('tbl_variations.available','Y')
                        ->where('tbl_variations.product_id = '.$variation->product_id)
                        ->where('tbl_variations.variation_id <> '.$variation->variation_id)
                        ->join('tbl_product','tbl_variations.product_id = tbl_product.product_id','INNER')
                        ->order_by("tbl_variations.sort", "asc")
                        ->order_by("tbl_variations.variation_name", "asc")
                        ->get('tbl_variations')
                        ->result();

                    }
                    else {
                      $halfs =  $this->db
                        ->select('tbl_product.product_id, product_name, '.
                                ' product_price, product_price2, product_price3, variation_price, variation_id, price_group_id,tbl_variations.variation_name')
                        ->where('half_pizza_group_id',$variation->half_pizza_group_id)
                        ->where('tbl_variations.available','Y')
                        ->where('tbl_variations.product_id <> '.$variation->product_id)
                        ->join('tbl_product','tbl_variations.product_id = tbl_product.product_id','INNER')
                        ->order_by("tbl_variations.sort", "asc")
                        ->order_by("tbl_product.product_name", "asc")
                        ->get('tbl_variations')
                        ->result();
                    }

                    if($halfs) {
                        foreach($halfs as $item) {
                            if (!isset($result[$i])) {
                                $result[$i]['id'] = $variation->variation_id;
                                $result[$i]['items'] = array();
                            }

                            $item->product_price = $item->product_price;
                            $item->price_group_id = $variation->price_group_id;
                            $item->isDeal = $type;
                            $result[$i]['items'][] = $item;
                        }
                        $i++;
                    }
                }
            }
        }

        if($result) {
            return $result;
        }
        return false;
    }

    /**
     * Get ingredients based on variation     *
     * Groups ingredients
     *
     * Used on single view and checkout
     *
     * @param $variationId
     * @param $ingredientsIds
     * @return mixed
     */
    public function getIngredientsByVariation($variationId, $ingredientsIds = false, $half = false) {

        $result         = false;

        $this->db
            ->select('tbl_ingredients.ingredient_id, status, price, ingredient_name, name')
            ->where('variation_id',$variationId);
        if($ingredientsIds) {
            $this->db->where_in('tbl_ingredients.ingredient_id', $ingredientsIds);
        }
        $this->db
            ->join('tbl_ingredients','tbl_variation_ingredients.ingredient_id = tbl_ingredients.ingredient_id','INNER')
            ->join('extra_ing_groups','extra_ing_groups.id = tbl_ingredients.group_id','LEFT')
            ->where_in('tbl_variation_ingredients.status', array('OP','DF'))
            ->order_by('ingredient_name','ASC')
        ;

        $ingredients    = $this->db->get('tbl_variation_ingredients')->result();
        /*if ($half) {
            echo $this->db->last_query();die;
        }*/
        $formatted = array();
        if($ingredients) {

            foreach($ingredients as $item) {
                $item->price_tot = $item->price;
                if ($half) {
                    $item->price = $item->price;
                }

                if($item->status == 'DF') {
                    $result['included'][] = $item;
                } else {
                    if($item->name == '') {
                        //VV $item->name = 'Other'; //let's put all extra ingredients into one group for now
                        //VV $result['extra']['Other'][] = $item;
                        $item->name = 'Extra ingredients';
                        $result['extra']['Extra ingredients'][] = $item;
                    } else {
                        // in case it has a group
                        //VV $result['extra'][$item->name][] = $item;
                        $result['extra']['Extra ingredients'][] = $item;
                    }
                }
            }

            /* Now format everything for mustache.js */
            $formatted = array();
            $index = 1;
            if(isset($result['included'])) {
                $formatted[] = array(
                    'group' => 'Included',
                    'items' => $result['included'],
                    'index' => $index,
                    'is_default' => true
                );
                $index++;
            }
            if(isset($result['extra'])) {
                foreach($result['extra'] as $key=>$value) {
                    $formatted[] = array(
                        'group' => $key,
                        'items' => $value,
                        'index' => $index
                    );
                    $index++;
                }
            }
        }
        return $formatted;
    }


    /**
     * Get type of the product based on the variations returned
     * Returns array that is directly passed to the view
     *
     * - isSingle: pizza & pastas
     * - isMultiple: deals (selectors for multiple products)
     * - isSimple: drinks, etc
     * - hasHalf: for pizza Only, if allows half pizza
     *
     * @param $variationGroups
     * @return array
     */
    public function getProductType($variationGroups) {

        $return = array(
            'isSingle'      => false,
            'isMultiple'    => false,
            'isSimple'      => false,
            'hasHalf'       => false,
        );

        if($variationGroups && is_array($variationGroups)) {
            $variations = array_keys($variationGroups);

            if(array_intersect(array('Size','Sauce','Pasta'),$variations)) {
                $return['isSingle'] = true;
            }
            if(array_intersect(array('Pizza2','Pizza1','Drink', 'Meal 1', 'Meal 2'),$variations)) {
                $return['isMultiple'] = true;
            }

            /**
             * Check if allows half pizza
             */

            //print_r($variationGroups);


            if(isset($variationGroups['Size'])) {
                foreach($variationGroups['Size'] as $vars) {
                    if(isset($vars->half_pizza_group_status) && $vars->half_pizza_group_status == "A") {
                        $return['hasHalf'] = true;
                    }
                }
            }

        }
        if(!$return['isSingle'] && !$return['isMultiple']) {
            $return['isSimple'] = true;
        }

        return $return;
    }


    public function getHalfMultipleProduct($half_pizza_group_id) {
        $result = false;

        $result = $this->db->select('half_pizza_group.half_pizza_multiple')
                ->where('ID',$half_pizza_group_id)
                ->where('half_pizza_multiple',true)
                ->get('half_pizza_group')
                ->result();

        if(count($result)){
          //var_dump(true);
          return true;
        }
        else {
          return false;
        }
    }

}