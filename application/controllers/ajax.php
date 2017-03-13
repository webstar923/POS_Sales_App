<?php

/**
 * Created by PhpStorm.
 * User: Gabriel Colita
 * Date: 07.02.2014
 * Time: 14:26
 */
//error_reporting(E_ALL ^ E_NOTICE ^ E_WARNING);
error_reporting(E_ERROR | E_PARSE);

class Ajax extends CI_Controller
{

    public function __construct()
    {
        parent::__construct();

        $this->load->model('products_model');
        $this->load->model('global_settings');
        $this->load->model('sync');
        $this->load->model('orders');
        $this->load->model('admin');

        $this->load->library('customer_display');
        $this->load->library('printer');
        $this->load->library('twofa');

        $this->load->helper('dataseparator');
        $this->load->helper('cartformat');
    }

    public function index()
    {



        if ($this->input->is_ajax_request() && isset($_POST))
        {
            switch ($this->input->post('request'))
            {
                case 'showSimpleDisplay':
                    $data = $this->customer_display->showSimpleDisplay($this->input->post('first_line'),
                            $this->input->post('second_line'),$this->input->post('type'),$this->input->post('ip'));
                    break;
                case 'queryAdmin':
                    $data = $this->admin->query($this->input->post('table'),
                          $this->input->post('extra'),
                          $this->input->post('perpag'),
                          $this->input->post('pag'),$this->input->post('search'));
                    break;
                case 'pushLocalData':
                    $data = $this->sync->pushLocalData($this->input->post('data'));
                    break;
                case 'getAdminCustomerDetails':
                    $data = $this->sync->get_admin_customers();
                    break;
                case 'lazySync':
                    $data = $this->sync->get($this->input->post('last'));
                    break;
                case 'selectiveSync':
                    $data = $this->sync->selectiveSync($this->input->post('table'),
                          $this->input->post('id'), $this->input->post('i'),
                          $this->input->post('coll'),
                          $this->input->post('action'));
                    break;
                case 'getServerTime':
                    $data['time'] = time();
                    break;
                case 'getServerTime2':
                    sleep(2);
                    $data['time'] = time();
                    break;

                case 'issueCode':
                    $user = $this->global_settings->getUser($this->input->post('user_id'));

                    if ($user->isadmin)
                    {
                        $this->twofa->genCode($user);
                        $data = array('success' => true);
                    }
                    else
                    {
                        $data = array('success' => false, 'reason' => 'noadmin');
                    }

                    break;
                case 'checkCode':
                    $data['status'] = $this->twofa->checkCode(
                          $this->input->post('code'),
                          $this->input->post('user_id'),
                          $this->input->post('device_name'),
                          $this->input->post('fp')
                    );
                    $data['id'] = $this->input->post('user_id');
                    $data['name'] = $this->input->post('device_name');
                    break;
                case 'loginUser':
                    $data = $this
                          ->global_settings
                          ->loginUser($this->input->post('password'),
                          $this->input->post('fp'));
                    break;
                case 'printInvoice':
                    $data = $this
                          ->printer
                          ->callInvoice($this->input->post('print'),
                          $this->input->post('data'));
                    break;

                case 'openDrawer': //VV
                    $data = $this
                          ->printer
                          ->openTill($this->input->post('printer_id'));
                    break;

                case 'print':



                    $a = json_decode($this->input->post('data'));
                    $b = json_decode($a->contents);
                    $ar_extra_cart = array();

                    foreach ($b as $elem)
                    {
                        $ar_extra_cart[] = prepareStringForPrinter($elem->extra_cart);
                    }

//                  print_r($ar_extra_cart);
//  EXAMPLE OF INPUT DATA
//                                      PASTA: Al Pesto; NO: Basil, BBQ Sauce, Capsicum; EXTRA: Anchovies, Bacon<br/> PIZZA1: All Meats; NO: Anchovies, Bacon, Cabanossi; EXTRA: Basil, BBQ Sauce<br/> CHOICE: Penne<br/> PIZZA2: Vege Lovers; NO: Cabanossi, Capsicum; EXTRA: Anchovies, Bacon, Basil<br/> <br/>
                    //print2 - customer's docket, print - kitchen docket
                    // Customer's docket


                    if (is_array($this->input->post('print2')))
                    {
                        $data = $this
                              ->printer
                              ->call($this->input->post('print2'),
                              $this->input->post('data'), $ar_extra_cart);
                    }
//                    var_dump($this->input->post('print'));
                    $dataKitchensDocket = divideItemsBetweenPrinters($this->input->post('data'));


//                    echo "data ktichen docket";
//                    var_dump($dataKitchensDocket[0]["item"]);
//                    break;
//                    replaceContentInData($this->input->post('data'), $dataKitchensDocket);
//                    echo "printers";
//                    var_dump($dataKitchensDocket);
//                    die("fine");

                    foreach ($this->input->post('print') as $idOfPrinter =>
                              $quantity)
                    {
                        for ($i = 0; $i < count($dataKitchensDocket); $i++)
                        {
                            if ($dataKitchensDocket[$i]["id"] == $idOfPrinter)
                            {
                                $printer = array($idOfPrinter => $quantity);

//                                echo "dump " . $idOfPrinter;
//                                echo "printers";
//                                var_dump($printer);
//                                echo "data";
//                                $dataKitchensDocket[$i]["item"]  = json_encode($dataKitchensDocket[$i]["item"]);
//
//                                $dataKitchensDocket[$i]["item"] = json_decode($dataKitchensDocket[$i]["item"], true);
//
                                $replacedContent = replaceContentInData($this->input->post('data'),
                                      $dataKitchensDocket[$i]["item"]);

//                                echo "replaced content for printng";
//                                var_dump($replacedContent);

                                if ($replacedContent == false)
                                {
                                    continue;
                                }



                                $ar_extra_cart = fetchExtraItems($replacedContent);


                                $replacedContent = json_encode($replacedContent);
                                $nameOfLogFile = 'kitchen_printer_id_' . $idOfPrinter;
                                $data = $this
                                      ->printer
                                      ->callKitchenDocket($printer,
                                      $replacedContent, $nameOfLogFile,
                                      $ar_extra_cart);

//                                echo "usual  printer";
//                                var_dump($printer);
//                                echo "managers priner about ot ptint";
//                                var_dump($this->input->post('managerPrinter'));
                                $managers_printer =$this->input->post('managerPrinter');

                                if ( $managers_printer
                                      && is_numeric($managers_printer)
                                      && ( (int)$managers_printer >0 )
                                      && $idOfPrinter != $managers_printer
                                      )
                                {

                                    define('MANAGERS_FILE_IDENTIFIER',
                                          '_manager');
                                    define('TEXT_WARNING', "COPY FOR MANAGER");

                                    $nameOfLogFile .= MANAGERS_FILE_IDENTIFIER;

                                    $managerPrinter = array($managers_printer => "1");


//                                    echo "printer";
//                                    var_dump($printer);
//                                    echo "manager's printer";
//                                    var_dump($managerPrinter);

                                    $data = $this
                                          ->printer
                                          ->callKitchenDocket($managerPrinter,
                                          $replacedContent, $nameOfLogFile,$ar_extra_cart);

//                                    $data = $this
//                                            ->printer
//                                            ->callKitchenDocket($printer, $replacedContent, $nameOfLogFile);
                                }
                                else
                                {
//                                    echo "not printing on " . $idOfPrinter;
                                }
                            }
                        }
                    }
                    break;

                case 'rePrint':
                    $data = $this
                          ->printer
                          ->callReprint($this->input->post('print'),
                          $this->input->post('id'));
                    break;
                case 'getIngredientsForVariation':
                    $data = $this
                          ->products_model
                          ->getIngredientsByVariation($this->input->post('variationId'));
                    break;
                case 'getIngredientsForVariationH':
                    $data = $this
                          ->products_model
                          ->getIngredientsByVariation($this->input->post('variationId'),
                          false, true);
                    break;
                case 'getOptionsForProduct':
                    $data = $this
                          ->products_model
                          ->getOptionsForProduct($this->input->post('productId'));
                    break;
                case 'getAllOptionsForProducts':
                    $data['product_options'] = $this
                          ->products_model
                          ->getAllOptionsForProducts();
                    break;
                case 'getAllVariationsForProducts':
                    $data['product_variations'] = $this
                          ->products_model
                          ->getAllVariationsForProducts();
                    break;
                case 'getCategories':
                    $data['categories'] = $this
                          ->products_model
                          ->getCategories();
                    break;
                case 'getProducts':
                    $data['products'] = $this
                          ->products_model
                          ->getProducts();
                    break;
                case 'getProductsByCategory':
                    $data['products'] = $this
                          ->products_model
                          ->getProductsByCategory($this->input->post('id'));
                    break;
                case 'getSettings':
                    $data['settings'] = $this
                          ->global_settings
                          ->getSettings();
                    break;
                case 'getUsers':
                    $data['users'] = $this
                          ->global_settings
                          ->getUsers();
                    break;
                case 'getOrders':
                    $data['orders'] = $this
                          ->orders
                          ->getOrderList();
                    break;
                case 'getOrderItems':
                    $data['order_items'] = $this
                          ->orders
                          ->getOrderItems();
                    break;
                case 'getUsersSettings':
                    $data['user_settings'] = $this
                          ->global_settings
                          ->getUsersSettings();
                    break;
                case 'getTaxes':
                    $data['taxes'] = $this
                          ->global_settings
                          ->getTaxes();
                    break;
                case 'pushData':
                    $data = $this
                          ->sync
                          ->store($this->input->post('data'),
                          $this->input->post('table'),
                          $this->input->post('curtime'));
                    break;
                case 'delData':
                    $data = $this
                          ->sync
                          ->del($this->input->post('data'),
                          $this->input->post('table'));
                    break;


                case 'getBalances':
                    $data['balances'] = $this
                          ->global_settings
                          ->getBalances();
                    break;
                case 'getAddresses':
                    $data['addresses'] = $this
                          ->global_settings
                          ->getAddresses();
                    break;
                case 'getSuburb':
                    $data['suburb'] = $this
                          ->global_settings
                          ->getSuburb();
                    break;
                case 'getPrinters':
                    $data['printers'] = $this
                          ->global_settings
                          ->getPrinters();
                    break;
                case 'getCoupons':
                    $data['coupon'] = $this
                          ->orders
                          ->getCoupons($this->input->post('coupon'));
                    break;
                case 'getAllDiscounts':
                    $data['discount_codes'] = $this->orders->getAllCoupons();
                    break;
                case 'localSync':
                    $data['local_sync'] = array();
                    break;
                case 'getOrderTypes':
                    $data['order_types'] = $this->orders->getOrderTypes();
                    break;
                case 'getCustomers':
                    $data['customers'] = $this->global_settings->getCustomers();
                    break;
                case 'getHalfPizza':
                    $data['half_half_pizza'] = $this->global_settings->getHalfPizza();
                    break;


                case 'doCompleteSync':
//                    die("fgddf");


                    $data['sync'] = array(
                       'Categories' => array(
                          'action' => 'getCategories',
                          'table' => array(
                             'name' => 'categories',
                             'id' => true,
                             'columns' => array(
                                'id INTEGER PRIMARY KEY',
                                'sort INTEGER',
                                'name TEXT',
                                'color VARCHAR'
                             )
                          )
                       ),
                       'Products' => array(
                          'action' => 'getProducts',
                          'table' => array(
                             'name' => 'products',
                             'id' => true,
                             'columns' => array(
                                'id INTEGER PRIMARY KEY',
                                'categoryId INTEGER',
                                'name TEXT',
                                'displayName TEXT',
                                'price FLOAT',
                                'price2 FLOAT',
                                'price3 FLOAT',
                                'variation INTEGER',
                                'sort INTEGER',
                                'has_coupon INTEGER',
                                'idPrinter INTEGER'
                             )
                          )
                       ),
                       'Settings' => array(
                          'action' => 'getSettings',
                          'table' => array(
                             'name' => 'settings',
                             'id' => true,
                             'columns' => array(
                                'id INTEGER PRIMARY KEY',
                                'name VARCHAR',
                                'value VARCHAR'
                             )
                          )
                       ),
                       'Users' => array(
                          'action' => 'getUsers',
                          'table' => array(
                             'name' => 'users',
                             'id' => true,
                             'columns' => array(
                                'id INTEGER PRIMARY KEY',
                                'username VARCHAR',
                                'firstname VARCHAR',
                                'lastname VARCHAR',
                                'password VARCHAR',
                                'phone VARCHAR',
                                'isadmin INTEGER',
                                'allparkedorders INTEGER',
                                'allclosedorders INTEGER',
                                'glympse INTEGER',
                                'dayfunctions INTEGER',
                                'show_drawer_kick_open INTEGER',
                                'can_delete_orders INTEGER',
                             )
                          )
                       ),
                       /*
                        * Removed: Stored in local storage
                        */
//                        'UsersSettings'     => array(
//                            'action'    => 'getUsersSettings',
//                            'table'     => array(
//                                'name'      => 'user_settings',
//                                'id'        => true,
//                                'columns'   => array(
//                                    'id INTEGER PRIMARY KEY',
//                                    'user_id INTEGER',
//                                    'setting VARCHAR',
//                                    'value VARCHAR'
//                                )
//                            )
//                        ),
                       'Taxes' => array(
                          'action' => 'getTaxes',
                          'table' => array(
                             'name' => 'taxes',
                             'id' => true,
                             'columns' => array(
                                'id INTEGER PRIMARY KEY',
                                'type VARCHAR',
                                'name VARCHAR',
                                'fixed_fee FLOAT',
                                'percent_fee FLOAT',
                                'min_amount_delivery FLOAT',
                                'min_amount_instore FLOAT',
                                'active INTEGER',
                                'apply_min INTEGER',
                             )
                          )
                       ),
                       'OrderItems' => array(
                          'action' => 'getOrderItems',
                          'table' => array(
                             'name' => 'order_items',
                             'id' => true,
                             'columns' => array(
                                'id INTEGER PRIMARY KEY',
                                'order_id INTEGER',
                                'product_id INTEGER',
                                'variation_id INTEGER',
                                'quantity INTEGER',
                                'notes TEXT',
                                'options TEXT'
                             )
                          )
                       ),
                       'Balances' => array(
                          'action' => 'getBalances',
                          'table' => array(
                             'name' => 'balances',
                             'id' => true,
                             'columns' => array(
                                'id INTEGER PRIMARY KEY',
                                'date DATE NOT NULL DEFAULT CURRENT_DATE',
                                'type VARCHAR',
                                'value FLOAT',
                             )
                          )
                       ),
                       'Addresses' => array(
                          'action' => 'getAddresses',
                          'table' => array(
                             'name' => 'addresses',
                             'id' => true,
                             'columns' => array(
                                'id INTEGER PRIMARY KEY',
                                'address VARCHAR',
                                'suburb INTEGER'
                             )
                          )
                       ),
                       'Suburb' => array(
                          'action' => 'getSuburb',
                          'table' => array(
                             'name' => 'suburb',
                             'id' => true,
                             'columns' => array(
                                'id INTEGER PRIMARY KEY',
                                'name VARCHAR',
                                'suburb_fee_in_dollars INTEGER'
                             )
                          )
                       ),
                       'Printers' => array(
                          'action' => 'getPrinters',
                          'table' => array(
                             'name' => 'printers',
                             'id' => true,
                             'columns' => array(
                                'id INTEGER PRIMARY KEY',
                                'printer_name VARCHAR',
                                'ip VARCHAR',
                                'port VARCHAR',
                                'type VARCHAR',
                                'status INTEGER'
                             )
                          )
                       ),
                       'Product_options' => array(
                          'action' => 'getAllOptionsForProducts',
                          'table' => array(
                             'name' => 'product_options',
                             'id' => true,
                             'columns' => array(
                                'id INTEGER PRIMARY KEY',
                                'product_id INTEGER',
                                'options TEXT'
                             )
                          )
                       ),
                       'Product_variations' => array(
                          'action' => 'getAllVariationsForProducts',
                          'table' => array(
                             'name' => 'product_variations',
                             'id' => true,
                             'columns' => array(
                                'id INTEGER PRIMARY KEY',
                                'variation_id INTEGER',
                                'options TEXT'
                             )
                          )
                       ),
                       'Discounts' => array(
                          'action' => 'getAllDiscounts',
                          'table' => array(
                             'name' => 'discount_codes',
                             'id' => true,
                             'columns' => array(
                                'id INTEGER PRIMARY KEY',
                                'code VARCHAR',
                                'description VARCHAR',
                                'percentage VARCHAR'
                             )
                          )
                       ),
                       'Local_sync' => array(
                          'action' => 'localSync',
                          'table' => array(
                             'name' => 'local_sync',
                             'id' => true,
                             'columns' => array(
                                'id INTEGER PRIMARY KEY',
                                '"table" VARCHAR',
                                'data TEXT'
                             )
                          )
                       ),
                       'Order_types' => array(
                          'action' => 'getOrderTypes',
                          'table' => array(
                             'name' => 'order_types',
                             'id' => true,
                             'columns' => array(
                                'id INTEGER PRIMARY KEY',
                                'name VARCHAR',
                                'action VARCHAR',
                                'type VARCHAR',
                                'enabled INTEGER'
                             )
                          )
                       ),
                       'Half_half_pizza' => array(
                          'action' => 'getHalfPizza',
                          'table' => array(
                             'name' => 'half_half_pizza',
                             'id' => true,
                             'columns' => array(
                                'half_pizza_group_name VARCHAR',
                                'half_pizza_group_fee VARCHAR',
                             )
                          )
                       ),
                       'Orders' => array(
                          'action' => 'getOrders',
                          'table' => array(
                             'name' => 'orders',
                             'id' => true,
                             'columns' => array(
                                'id INTEGER PRIMARY KEY',
                                'unique_id VARCHAR',
                                'display_id VARCHAR',
                                'order_code VARCHAR',
                                '"table" VARCHAR',
                                'status VARCHAR',
                                'contents TEXT',
                                'total FLOAT',
                                'userId INTEGER',
                                'pay_value FLOAT',
                                'pay_type INTEGER',
                                'note TEXT',
                                'date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP',
                                'hour INTEGER',
                                'address TEXT',
                                'voided BOOL DEFAULT false',
                                'order_type INTEGER',
                                'client TEXT',
                                'order_time VARCHAR',
                                'credit_card_fee FLOAT',
                                'rounding FLOAT',
                                'order_status VARCHAR',
                             )
                          )
                       ),
                       'Customers' => array(
                          'action' => 'getCustomers',
                          'table' => array(
                             'name' => 'customers',
                             'id' => true,
                             'columns' => array(
                                'userid INTEGER PRIMARY KEY',
                                'address VARCHAR',
                                'suburb INTEGER',
                                'first_name VARCHAR',
                                'last_name VARCHAR',
                                'email VARCHAR',
                                'password VARCHAR',
                                'mobile_password INTEGER',
                                'company_name VARCHAR',
                                'mobile VARCHAR',
                                'verify_code VARCHAR',
                                'comment TEXT',
                                'username VARCHAR',
                                'base_password text',
                                'country_id INTEGER',
                                'state INTEGER',
                                'city VARCHAR',
                                'zipcode VARCHAR',
                                'signup_date datetime',
                                'usertypeid INTEGER',
                                'isverified VARCHAR',
                                'verified_date datetime  NOT NULL DEFAULT CURRENT_TIMESTAMP',
                                'activationcode VARCHAR',
                                'status VARCHAR',
                                'avtar_image VARCHAR',
                                'order_points INTEGER',
                                'is_first_order VARCHAR',
                                '`delete` INTEGER',
                                'delete_date datetime',
                                'facebook_id VARCHAR'
                             )
                          )
                       )
                    );
//                    echo "fddd";
//                    var_dump($data['sync']);
                    break;
                case 'testConnection':
                    // check if the device is also authorized
                    $status = $this->sync->checkUserDevice($this->input->cookie('b_cookie_name'),
                          $this->input->post('_token'));
                    $tiltStatus = $this->global_settings->checkTiltOpened();

                    echo json_encode(array('status' => $status, 'tiltOpened' => $tiltStatus));
                    exit();
                    break;

                case 'execScript':
                    exec($this->input->post('scriptName'));
                    echo json_encode(array('status' => 'success'));
                    exit();
                    break;
                case 'getOrderListForCloseTilt':
                    $data['orders'] = $this->orders->getOrderListForCloseTilt($this->input->post('dateOpen'));
                    break;

                case 'checkTiltOpened':
                    $data['tiltOpened'] = $this->global_settings->checkTiltOpened();
                    break;
                case 'checkParkedOrder':
                    $data['canClose'] = $this->orders->checkParkedOrder($this->input->post('unique_id'));
                    break;
                case 'getOrderListForPanel':
                    $data['orders'] = $this->orders->getOrderListForPanel($this->input->post('userId'),
                          $this->input->post('showAllParkedOrders'),
                          $this->input->post('showAllClosedOrders'));
                    break;

                case 'getOpeningHours':
                    $data['hours'] = $this->global_settings->getOpeningHours();
                    break;

                case 'pos_update_display_ids':
//                   sleep(2);
                    $this->db->query("SELECT controlDisplayID()");
                    $unique_id = $this->input->post('unique_id');

                    // sleep(5); // yes, this is needed, because order can be yet not in mysql database
                    $dataa = $this->sync->getDisplayId($unique_id);

                    if (isset($dataa['display_id']))
                    {
                        $data['display_id'] = $dataa['display_id'];
                    }
                    else
                    {
                        $data['display_id'] = 'not found here';
                    }
                    break;

                case 'avoidCheckoutingParkedOrderTwice':
                    $unique_id = $this->input->post('unique_id');

//                    $answer = $this->sync->checkOrderCodeForPresenseInDB($order_code);
//                    var_dump($answer);
                    $data['exists'] = $this->sync->checkOrderCodeForPresenseInDB($unique_id);
//                    var_dump($data['exists']);
                    break;


                case 'setOrderVoided':
                    $unique_id = $this->input->post('unique_id');

//                    echo "order ID";
//                    var_dump($orderId);

                    $data['result'] = $this->sync->setOrderVoided($unique_id);

                    break;

                case 'getDisplayIdForUniqueId':
                    $data['display_id'] = $this->sync->getDisplayIdForUniqueId($this->input->post('unique_id'));
                    break;
            }
        }



        header('Content-Type: application/json');
        $data['_token'] = md5(time() + '_token');

        if (isset($data['sync']))
        {
//            echo 'this data ' . var_dump($data['sync']);
//            echo json_encode($data['sync']);
        }

        //var_dump($data);
        if ($this->input->post('request') != 'loginUser' && !$this->input->post('token'))
        {
            echo "failed authorisation";
            exit();
        }
        else
        {
            if ($this->input->post('request') == 'loginUser')
            {
                $this->sync->storeToken($this->input->post('fp'),
                      $data['_token']);
            }
            else
            {
                if (!$this->sync->checkToken($this->input->post('token'),
                            $data['_token']))
                {
                    echo "failed checking token";
                    exit();
                }
            }
        }
        if (!in_array($this->input->post('request'),
                    array('loginUser', 'issueCode', 'checkCode')))
        {
            // check if device is authorized
            $status = $this->sync->checkUserDevice($this->input->cookie('b_cookie_name'),
                  $this->input->post('token'));
            if ($status < 1)
            {
                $data = array(
                   '_token' => 'undefined'
                );
            }
        }


//        echo $data;
        echo json_encode($data);
        exit();
    }

}

/* OLD VERSION WITH BUG
      BEGIN


      SET @now := NOW();
      #SET @now := str_to_date('2014-09-06 05:05:00','%Y-%m-%d %H:%i:%s');

      # next_reset

      SELECT  nextReset INTO @dateA FROM pos_reset_plan;
      SELECT @now INTO @dateB;

      SELECT ( unix_timestamp(@dateB) -  unix_timestamp(@dateA) ) INTO @difference;


      #RETURN @difference;

      # then we should reset
      #IF @difference > 60*60*24 THEN
      IF @difference > 0 THEN



      SELECT value INTO @timeOfReset FROM `pos_settings` WHERE `name` = 'timeOfReset';
      #RETURN @timeOfReset;

      SELECT HOUR(@now) INTO @hoursCurTime;
      #RETURN @hoursCurTime;



      # calculating next day of resetting


      IF @hoursCurTime > HOUR(@timeOfReset) THEN

      SET @newTime :=  DATE_FORMAT( DATE_ADD( @now, INTERVAL 1 DAY), '%Y-%m-%d' );
      SET @newTime := CONCAT_WS(' ',@newTime,@timeOfReset);


      ELSE
      SET @newTime := DATE_FORMAT( @now, '%Y-%m-%d' );
      SET @newTime := CONCAT_WS(' ',@newTime,@timeOfReset);


      END IF;

      # we have a new time for updating here

      SELECT value INTO @startNumber FROM `pos_settings` WHERE `name` = 'start_number';
      UPDATE `pos_settings` SET `value` = @startNumber WHERE `name` = 'current_display_id';
      UPDATE `pos_reset_plan` SET `nextReset` = @newTime WHERE id = '1';

      RETURN @newTime;

      END IF;

      RETURN 'no need';

      END */




// UPDATED VERSION

    /*
     *
     * BEGIN


      SET @now := NOW();
      #SET @now := str_to_date('2014-09-06 05:05:00','%Y-%m-%d %H:%i:%s');

      # next_reset

      SELECT  nextReset INTO @dateA FROM pos_reset_plan;
      SELECT @now INTO @dateB;

      SELECT ( unix_timestamp(@dateB) -  unix_timestamp(@dateA) ) INTO @difference;


      #RETURN @difference;

      # then we should reset
      #IF @difference > 60*60*24 THEN
      IF @difference > 0 THEN



      SELECT value INTO @timeOfReset FROM `pos_settings` WHERE `name` = 'timeOfReset';
      #RETURN @timeOfReset;

      SELECT HOUR(@now) INTO @hoursCurTime;
      #RETURN @hoursCurTime;



      # calculating next day of resetting


      SET @newTime :=  DATE_FORMAT( DATE_ADD( @now, INTERVAL 1 DAY), '%Y-%m-%d' );
      SET @newTime := CONCAT_WS(' ',@newTime,@timeOfReset);




      # we have a new time for updating here

      SELECT value INTO @startNumber FROM `pos_settings` WHERE `name` = 'start_number';
      UPDATE `pos_settings` SET `value` = @startNumber WHERE `name` = 'current_display_id';
      UPDATE `pos_reset_plan` SET `nextReset` = @newTime WHERE id = '1';

      RETURN @newTime;

      END IF;

      RETURN 'no need';

      END
     *
     */