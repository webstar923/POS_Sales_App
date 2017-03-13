<?php

/**
 * Created by PhpStorm.
 * User: gabi
 * Date: 3/27/14
 * Time: 4:33 PM
 */
//error_reporting(E_ERROR | E_WARNING);


error_reporting(E_ERROR | E_PARSE);

Class Printer extends CI_Controller
{

    // var $CI;
    public function __construct()
    {
        $this->CI = &get_instance();
    }

    public function checkPrinterStatus($printer_id){
        echo "WEWEWEEW";
        return $return;


    }

    public function openTill($printer_id){
        //echo"PRINTER - OPENING THE TILL on printer no. $printer_id ";

        $printer = $this
                  ->CI
                  ->db
                  ->get_where('pos_printers', array('id' => $printer_id))
                  ->row();

        $POSCommand = selectPrinterCommandSet($printer->printer_type);

        $fp = @fsockopen($printer->ip, $printer->port, $errno, $errstr, 10);
        if ($fp && is_resource($fp))
        {
            // for testing
            // fwrite($fp, $POSCommand['PRINT_LOGO']);

            fwrite($fp, $POSCommand['OPEN_DRAWER']);
            fclose($fp);
            $return[$printer_id] = array(
                    'status' => 'printed'
                );
        }
        else
        {
            $return[$printer_id] = array(
            'status' => 'error',
                'error' => array(
                 'status' => $errstr,
                 'no' => $errno
                )
            );

        }
        echo "result is ". print_r($return);
    } //openTill

    public function prepareBalanceText($contents)
    {
        $return = array();

        $replace = array(
           '%since_date%' => $contents['date'],
           '%opening-balance%' => $contents['openBalance'],
           '%cash_in%' => $contents['cash'],
           '%cc_in%' => $contents['creditcard'],
           '%total_sales%' => $contents['total_sales'],
           '%online_paid_sales%' => $contents['online_paid_sales'],
           '%cash-in-drawer%' => $contents['cash-in-drawer'],
        );

        //parse_str($contents, $replace);
//        $fh = fopen('/var/www/html/posapp/application/libraries/printer_template/log_balance.txt', 'w');
        $fh = fopen(FCPATH . 'application/libraries/printer_template/log_balance.txt', 'w');
        if (!$fh)
        {
            showInfoAbotErrorAndDie(__FILE__, __LINE__,
                  '/printer_template/log_balance.txt');
        }

        //$results = print_r($contents, true);
        fwrite($fh, print_r($contents, true));
        fclose($fh);

//        $fh = fopen('/var/www/html/posapp/application/libraries/printer_template/log_balance_print.txt', 'w');
        $fh = fopen(FCPATH . 'application/libraries/printer_template/log_balance_print.txt',
              'w');

        if (!$fh)
        {
            showInfoAbotErrorAndDie(__FILE__, __LINE__, 'log_balance_print.txt');
        }

        //$results = print_r($contents, true);
        fwrite($fh, print_r($print, true));
        fclose($fh);

        $t = file_get_contents(FCPATH . 'application/libraries/printer_template/balance_report.template');

        $text = str_replace(array_keys($replace), array_values($replace), $t);
        $text = stripslashes($text);


        return $text;
    }

    public function callInvoice($print, $contents)
    {

        $text = $this->prepareBalanceText($contents);

        foreach ($print as $printer_id => $copies)
        {
            $printer = $this
                  ->CI
                  ->db
                  ->get_where('pos_printers', array('id' => $printer_id))
                  ->row();


            for ($i = 0; $i < $copies; $i++)
            {
                $fp = @fsockopen($printer->ip, $printer->port, $errno, $errstr, 10);
                if ($fp && is_resource($fp))
                {
                    fwrite($fp, "\033\100");
                    $out = $text . "\r\n";
                    fwrite($fp, $out);
                    fwrite($fp, "\012\012\012\012\012\012\012\012\012\033\151\010\004\001");
                    fclose($fp);
                    $return[$printer_id] = array(
                       'status' => 'printed'
                    );
                }
                else
                {
                    $return[$printer_id] = array(
                       'status' => 'error',
                       'error' => array(
                          'status' => $errstr,
                          'no' => $errno
                       )
                    );
                }
            }
        }
        echo"return is $return";
        return $return;
    }

    private function formatPhoneNumber($number)
    {
        $number = preg_replace('/\s+/', '', $number);
        $formatted = substr($number, 0, 2) . ' ' . substr($number, 2, 4) . ' ' . substr($number,
                    6, 4) . ' ' . substr($number, 10);
        return $formatted;
    }

    /**
     *  Moves information about discount to the end of the cheque
     *
     * @param type $arrSourceWithProducts -  returns reordered orders
     */
    private function moveDiscountToTheEndOfTheCheque($arrSourceWithProducts)
    {

        foreach ($arrSourceWithProducts as $key => $elem)
        {
            if ($elem['id'] == $this->DISCOUNT_IDENTIFICATOR || strpos($elem['id'],
                        $this->DISCOUNT_MISCELLANEOUS) !== false || strpos($elem['id'],
                        $this->DISCOUNT_EXTRA_CHARGE) !== false)
            {
//                echo " was found";
//                var_dump($elem);
                unset($arrSourceWithProducts[$key]);
                $arrSourceWithProducts[$key] = $elem;
//                break;
            }
        }

        return $arrSourceWithProducts;
    }

    private function extractingFee($stringContainingUnparsedFee)
    {
        $match = '';
        $match[0] = '';
        preg_match('#\((.*?)\)#', $stringContainingUnparsedFee, $match);

        if ($match[0] != '')
        {
            $match[0] = str_replace(array(')', '('), '', $match[0]);
        }
        return $match[0];
    }

    public function call($data, $contents, $extra_cart)
    {
        $printer = "thermal_1"; // TODO
        $POSCommand = selectPrinterCommandSet($printer);

        $return = array();
//        return;
//        echo "ddd";
//        var_dump($contents);
//die;
        $contents = json_decode($contents);
        $products = json_decode($contents->contents, 1);

        $t = file_get_contents(FCPATH . 'application/libraries/printer_template/recipe.template.php');
        //VV
        //   echo "all data <br/>";
        //    var_dump($data);
        //    echo "content all <br/>";
        //    var_dump($contents);
//        $fh = fopen('/var/www/html/posapp/application/libraries/printer_template/logMINE_INVOICE.txt', 'w');
        $fh = fopen(FCPATH . 'application/libraries/printer_template/logMINE_INVOICE.txt',
              'w');


        if (!$fh)
        {
            showInfoAbotErrorAndDie(__FILE__, __LINE__, 'logMINE_INVOICE.txt');
        }

        //$results = print_r($contents, true);
        fwrite($fh, print_r($products, true));
        fclose($fh);

        if (isset($contents) && isset($contents->address))
        {
            $fee = $this->extractingFee($contents->address);
            if ($fee != '')
            {
                $additionalInfoToLogTxt = new stdClass;
                $additionalInfoToLogTxt->delivery_fee = $fee;
                $contents = (object) array_merge((array) $contents,
                            (array) $additionalInfoToLogTxt);
            }
        }
        unset($contents->unique_id);

        $results = print_r($contents, true);
        $results = str_replace('[date]', '[order_at]', $results);
        $cash_drawer = json_decode($contents->open_cash_drawer, 1);



//        $fh = fopen('/var/www/html/posapp/application/libraries/printer_template/log.txt', 'w');
        $fh = fopen(FCPATH . 'application/libraries/printer_template/log.txt', 'w');

        if (!$fh)
        {
            showInfoAbotErrorAndDie(__FILE__, __LINE__, 'log.txt');
        }


        fwrite($fh, $results);
        fclose($fh);

        //VV

        $delivery_or_table = $this->delivery_or_table_order($contents);

        $delivery_or_table_order = $POSCommand['TXT_DOUBLE2_SIZE'] . $POSCommand['TXT_CENTER_JUSTIFICATION'] . $POSCommand['TXT_BOLD_ON'] . $delivery_or_table . $POSCommand['TXT_BOLD_OFF'];
        //VV
        //$fh = fopen('/var/www/html/posapp/application/libraries/printer_template/log2.txt', 'w') or die("Can't open file.");
        //$results = print_r($contents, true);
        // fwrite($fh, $delivery_or_table_order);
        // fclose($fh);
        //moving discount to the end

        $products = $this->moveDiscountToTheEndOfTheCheque($products);

//        echo " products after ";
//        var_dump($products);



        $cart_contents = '';
        $total = 0;
        $index = 0;
        foreach ($products as $product)
        {
            $cart_contents .= $POSCommand['TXT_LEFT_JUSTIFICATION'] . $POSCommand['TXT_FONT_B']. $POSCommand['LINE_SPACING_1']  . $POSCommand['TXT_DOUBLE2_SIZE'] . $POSCommand['TXT_BOLD_ON'] . $product['qty'] . 'x' . strtoupper($product['name']) . $POSCommand['TXT_BOLD_OFF'];

            if (isset($product['extra']))
            {
//                $cart_contents .= "\n" . $this->format_extra(json_decode($product['extra'], 1), $product);
                $cart_contents .= "\n" . $extra_cart[$index];
            }
            else
            {
                $cart_contents .= "\n";
            }

            $cart_contents .= $POSCommand['TXT_RIGHT_JUSTIFICATION'] .  "$" . $product['tot_price'] . $POSCommand['TXT_NORMAL'] . "\n";
            //$cart_contents .=  "\n";
            //$total += $product['price'];
            $index++;
        }

        //VV$price_calculation = 'Total: $'.number_format($total, 2);
        //credit card fee
        if (property_exists($contents, 'credit_card_fee') && $contents->credit_card_fee != '0.00')
        {
            $price_calculation = $POSCommand['TXT_RIGHT_JUSTIFICATION'] . $POSCommand['TXT_NORMAL_SIZE'] . "Card Fee: $" . $contents->credit_card_fee . "\n";
        }
        //delivery fee
        if (isset($fee) && $fee != '')
        {
            $price_calculation .= $POSCommand['TXT_RIGHT_JUSTIFICATION'] . $POSCommand['TXT_NORMAL_SIZE'] . "Delivery Fee: " . $fee . ".00" . "\n";
        }
        //rounding
        if (property_exists($contents, 'rounding') && $contents->rounding != '0.00')
        {
            if ($contents->rounding < 0)
            {
                $price_calculation .= $POSCommand['TXT_RIGHT_JUSTIFICATION'] . $POSCommand['TXT_NORMAL_SIZE'] . "Rounding: -$" . $contents->rounding * (-1) . "\n";
            }
            else
            {
                $price_calculation .= $POSCommand['TXT_RIGHT_JUSTIFICATION'] . $POSCommand['TXT_NORMAL_SIZE'] . "Rounding: +$" . $contents->rounding . "\n";
            }
        }

        if (!isset($price_calculation))
        {
            $price_calculation = '';
        }

        $price_calculation .= $POSCommand['TXT_RIGHT_JUSTIFICATION'] . $POSCommand['TXT_DOUBLE2_SIZE'] . $POSCommand['TXT_UNDERL2_ON'] . 'TOTAL:$' . number_format($contents->total,
                    2)
              . $POSCommand['TXT_UNDERL_OFF'] . $POSCommand['TXT_NORMAL_SIZE'] . "\n" .  '(including GST)';


        $deliveryTitle_and_Address = $this->get_DeliveryTitle_and_CustAddress($contents);
        $delivery_title = $deliveryTitle_and_Address['delivery_title'];
        $cust_address = $deliveryTitle_and_Address['cust_address'];


        if (property_exists($contents, 'order_status') && $contents->order_status != '')
        {
            $payment_status = explode('-', $contents->order_status, 2);

            $table_order = strpos($delivery_or_table_order, "TABLE");
            if ($table_order !== false)
            {
                $payment_status[1] = str_replace("on Pickup", "on leaving", $payment_status[1]);  //in case table order is to be paid later we need to change "Visa on Pickup -> Visa on leaving". super rare
                $payment_status[1] = str_replace("Don't Know Yet on leaving", "", $payment_status[1]); // VV HACK
            }

            $payment_status[1] = str_replace("Don't Know Yet on Delivery", "", $payment_status[1]); // VV HACK


            if(trim($delivery_title) == "PICK-UP:"){
                $payment_status[1] = str_replace("on Delivery", "on Pick-up", $payment_status[1]);
            }

            if (trim($payment_status[1]) !== '') {
                $payment_status[1] = ' - ' . trim($payment_status[1]);
            }

            if ($payment_status[0] == 'UNPAID')
            {
                $payment_status[1] = 'Parked Order';
            }
            $payment_method = $payment_status[1];
            $payment_method = explode(' ', $payment_method);


            $price_calculation .= "\n" . $POSCommand['TXT_RIGHT_JUSTIFICATION'] . $POSCommand['TXT_BOLD_ON'] . $POSCommand['TXT_DOUBLE2_SIZE'] . trim($payment_status[0])  . ' ' . trim($payment_method[1]) . ' ' . trim($payment_method[2]) .  $POSCommand['TXT_BOLD_OFF'] . $POSCommand['TXT_NORMAL_SIZE'] . ' ' . trim($payment_method[3]) . ' ' . trim($payment_method[4]) . $POSCommand['LINE_SPACING_DEFAULT'];
        }

        $customer = $this->get_delivery_data($contents);
        if ($customer['name'] !== ''){
             $customer_name = "\n" . trim(ucwords(strtolower($customer['name'])));
        }

        if (trim($customer['phone_number']) !== ''){
            $customer_phone_number = "\n" . "PHONE: " . $this->formatPhoneNumber($customer['phone_number']);
        }

        if ( ($delivery_or_table == "DELIVERY" || $delivery_or_table == "PICK-UP") && ($delivery_title !== '' || $customer_name !== '' || $cust_address !== '' || $customer_phone_number !== '')) {
            //echo "delivery or table is $delivery_or_table"; die;
            $customer_info =  $this->line('', 'single_line', $POSCommand)
                  . $POSCommand['TXT_LEFT_JUSTIFICATION'] . $POSCommand['TXT_FONT_B'] . $POSCommand['TXT_DOUBLE2_SIZE'] . $POSCommand['LINE_SPACING_1']
                  . $POSCommand['TXT_BOLD_ON'] . $delivery_title . $POSCommand['TXT_BOLD_OFF']
                  . $customer_name
                  . $cust_address
                  . $customer_phone_number . $POSCommand['TXT_NORMAL_SIZE'] . $POSCommand['LINE_SPACING_DEFAULT'] . $POSCommand['TXT_FONT_A'];
            //. "\n" . $this->line('', 'single_line', $POSCommand);
        }
        else
        {
            $customer_info = "";
        }

        $note = '';
        if ($contents->note != '')
        {
            $note = $this->line('', 'single_line', $POSCommand) . $POSCommand['TXT_LEFT_JUSTIFICATION'] . $POSCommand['TXT_DOUBLE_WIDTH'] . "\n" . 'COMMNETS:' . "\n" . $contents->note . $POSCommand['TXT_NORMAL_SIZE'] . "\n";
        }

        //$header = $this->line('ORDER: ' . $contents->order_code, 'center');
        $s = explode("-", $contents->display_id); //split string by -
        $display_id_third_part = $s[2]; //get third part
        $display_id_first_part = $s[0];
        $display_id_second_part = $s[1];

        $header = $POSCommand['TXT_DOUBLE_WIDTH'] . $POSCommand['TXT_CENTER_JUSTIFICATION'] . "TAX INVOICE" . "\n" .
              $POSCommand['TXT_DOUBLE2_SIZE'] . $display_id_first_part . "-" . "$display_id_second_part"
              . $POSCommand['TXT_BOLD_ON'] . "-" . $POSCommand['TXT_UNDERL2_ON'] . $display_id_third_part . $POSCommand['TXT_UNDERL_OFF'] . $POSCommand['TXT_BOLD_OFF'] . $POSCommand['TXT_NORMAL_SIZE'];

        //VV  = $this->line('TIME:', 'center') . "\n" .
        //VV      $this->line(date("D d/m h:ia"), 'center');
        $time = $POSCommand['TXT_CENTER_JUSTIFICATION'] . $POSCommand['TXT_DOUBLE2_SIZE'];
        if ($contents->order_time == 'asap')
        {
            $time.="ASAP";
        }
        else
        {
            $order_time = strtotime($contents->order_time);
            $time.="FOR: " . date('D j/n', $order_time) . " at " . "\n" . ">>>" . $POSCommand['TXT_UNDERL2_ON'] . date('h:ia',
                        $order_time) . $POSCommand['TXT_UNDERL_OFF'] . "<<<";
        }
        $time.= $POSCommand['TXT_NORMAL_SIZE'];
        //$time = $POSCommand['TXT_CENTER_JUSTIFICATION'] . $POSCommand['TXT_DOUBLE2_SIZE'] . ($contents->order_time == 'asap' ? 'ASAP' : $contents->order_time) . $this->TXT_NORMAL_SIZE;

        $footer = $this->print_footer($contents, $POSCommand);

        $replace = array(
           '%header%' => $header,
           '%time%' => $time,
           '%cart_content%' => $cart_contents,
           '%price_calculation%' => $price_calculation,
           '%note%' => $note,
           //'%footer%' => $this->line('', 'full_line'),
           '%footer%' => $footer,
           '%line_separation%' => $this->line('', 'single_line', $POSCommand),
           '%customer_info%' => $customer_info,
           '%delivery_or_table_order%' => $delivery_or_table_order,
              //'%open_drawer%' => $open_drawer
              //'%footer%'              => "\x1b\x61\x01\x1b\x45\x01\x1b\x2d\x02\x1b\x21\x10\x1b\x21\x20 Test Here \x1b\x2d\x00\x1b\x45\x00\n"
        );

        $text = str_replace(array_keys($replace), array_values($replace), $t);
        $text = stripslashes($text);
//        $fh = fopen('/var/www/html/posapp/application/libraries/printer_template/log2.txt', 'w');
        $fh = fopen(FCPATH . 'application/libraries/printer_template/log2.txt', 'w');

        if (!$fh)
        {
            showInfoAbotErrorAndDie(__FILE__, __LINE__, 'log2.txt');
        }


        //$results = print_r($contents, true);
        fwrite($fh, $text);
        fclose($fh);
        /* echo $text;
          die; */

        foreach ($data as $printer_id => $copies)
        {
//            var_dump($data);
            $printer = $this
                  ->CI
                  ->db
                  ->get_where('pos_printers', array('id' => $printer_id))
                  ->row();

            $open_drawer = 'no';
            foreach ($cash_drawer as $cash_drawer_open)
            {
                if ($cash_drawer_open[$printer_id] == 'yes')
                {
                    $open_drawer = 'yes';
                }
                // $open_cash_drawer.=$cash_drawer_open[$printer_id];
                //else{$open_drawer='no';}
            }

            for ($i = 0; $i < $copies; $i++)
            {

                $fp = @fsockopen($printer->ip, $printer->port, $errno, $errstr, 10);
                if ($fp && is_resource($fp))
                {
                    //VV fwrite($fp, "\033\100");
                    //VV $out = $text . "\r\n";

                    if ($open_drawer == 'yes' && $drawer_already_open != 'yes')
                    {
                        fwrite($fp, $POSCommand['OPEN_DRAWER']);
                        $drawer_already_open = 'yes';
                    }

                    //fwrite($fp, $POSCommand['RESET_PRINTER']);
                    fwrite($fp, $POSCommand['PRINT_LOGO']);
                    fwrite($fp, $text);
                    fwrite($fp, $POSCommand['CUT_PAPER']);
                   /// fwrite($fp, $POSCommand['BEEP_PRINTER']);
                    //fwrite($fp, "\012\012\012\012\012\012\012\012\012\033\151\010\004\001");
                    fclose($fp);
                    $return[$printer_id] = array(
                       'status' => 'printed'
                    );
                }
                else
                {
                    $return[$printer_id] = array(
                       'status' => 'error',
                       'error' => array(
                          'status' => $errstr,
                          'no' => $errno
                       )
                    );
                }
            }
        }
        return $return;
    }


    public function prepareKitchenDocket($contents, $nameOfLogFile, $POSCommand,
                                         $extra_cart, $print_address)
    {
        $return = array();

//                $basePath = '/var/www/html/posapp/application/libraries/printer_template/log';
        $basePath = FCPATH . 'application/libraries/printer_template/log';
        //        return;
        //        echo "ddd";
        //        var_dump($contents);
        //die;
        $contents = json_decode($contents);
        //        var_dump($contents);
        $products = json_decode($contents->contents, 1);
        //$products[] = json_decode($contents->contents, 1);
        //$fh = fopen('/var/www/html/posapp/application/libraries/printer_template/log_MINE_KITCHEN.txt', 'w') or die("Can't open file.");
        //$results = print_r($contents, true);
        //fwrite($fh, print_r($products, true));
        //fclose($fh);
        //die;

        $t = file_get_contents(FCPATH . 'application/libraries/printer_template/recipe.template_kitchen.php');
        $fh = fopen($basePath . $nameOfLogFile . '.txt', 'w');

        if (!$fh)
        {
            var_dump($fh);
            showInfoAbotErrorAndDie(__FILE__, __LINE__,
                  $basePath . $nameOfLogFile . '.txt');
        }

        if (isset($contents) && isset($contents->address))
        {
            $fee = $this->extractingFee($contents->address);
            if ($fee != '')
            {
                $additionalInfoToLogTxt = new stdClass;
                $additionalInfoToLogTxt->delivery_fee = $fee;
                //            $additionalInfoToLogTxt->credit_card_fee2 = '2$';
                //for the sake of adding property to object
                $contents = (object) array_merge((array) $contents,
                            (array) $additionalInfoToLogTxt);
            }
        }
        //        $contents->unique_id ='';
        unset($contents->unique_id);

        $results = print_r($contents, true);
        $results = str_replace('[date]', '[order_at]', $results);
        $cash_drawer = json_decode($contents->open_cash_drawer, 1);


        fwrite($fh, $results);
        fclose($fh);

        //VV
        $delivery_or_table = $this->delivery_or_table_order($contents);

        $delivery_or_table_order = "\n" . "\n" . "\n" . "\n" . $POSCommand['DELIVERY_OR_TABLE'] . $delivery_or_table . $POSCommand['TXT_NORMAL'];
        //$POSCommand['TXT_NORMAL_SIZE'] . $POSCommand['LINE_SPACING_DEFAULT'] . $POSCommand['TXT_DOUBLE2_SIZE'] . $POSCommand['TXT_DOUBLE_WIDTH'] . $POSCommand['TXT_CENTER_JUSTIFICATION'] . $POSCommand['TXT_BOLD_ON'] . $delivery_or_table . $POSCommand['TXT_BOLD_OFF'];
        //VV OK for thermal $delivery_or_table_order = $POSCommand['TXT_DOUBLE2_SIZE']. $POSCommand['TXT_CENTER_JUSTIFICATION'] . $POSCommand['TXT_BOLD_ON'] . $delivery_or_table . $POSCommand['TXT_BOLD_OFF'];
        //$fh = fopen('/var/www/html/posapp/application/libraries/printer_template/log2.txt', 'w') or die("Can't open file.");
        //$results = print_r($contents, true);
        // fwrite($fh, $delivery_or_table_order);
        // fclose($fh);
        //moving discount to the end

        $products = $this->moveDiscountToTheEndOfTheCheque($products);

        //        echo " products after ";
        //        var_dump($products);



        $cart_contents = '';
        $total = 0;
        $index = 0;
        foreach ($products as $product)
        {
            $cart_contents .= $POSCommand['CART_CONTENT_FORMAT'] . $product['qty'] . 'x' . strtoupper($product['name']);

            if (isset($product['extra']))
            {
//                $cart_contents .= "\n" . $POSCommand['CART_CONTENT_VARIATION_FORMAT'] . $POSCommand['PRINT_RED'] . $this->format_extra(json_decode($product['extra'],
//                                  1), $product) . $POSCommand['PRINT_BLACK'] . $POSCommand['TXT_NORMAL'];
                $cart_contents .=  $POSCommand['CART_CONTENT_VARIATION_FORMAT'] . $POSCommand['PRINT_RED'] . $extra_cart[$index] . $POSCommand['PRINT_BLACK'];
            }
            else
            {
                $cart_contents .= "\n";
            }

            $cart_contents .= $POSCommand['TXT_NORMAL']; // . "\n";
           // $cart_contents .= "\n";
            //$total += $product['price'];
            $index++;
        }

        //$cart_contents = substr($cart_contents, 0, -1);
        $cart_contents .= $POSCommand['TXT_LEFT_JUSTIFICATION'] . $POSCommand['TXT_NORMAL'];

        $note = '';
        if ($contents->note != '')
        {
            //$note =  $this->line('', 'single_line', $POSCommand) . "\n" . $POSCommand['PRINT_RED'] . $POSCommand['TXT_DOUBLE_WIDTH'] . 'COMMNETSXXX:' . $POSCommand['PRINT_BLACK'] . "\n" . $contents->note . $POSCommand['TXT_NORMAL_SIZE'];
            $note = "\n" . $this->line('', 'single_line', $POSCommand) . $POSCommand['TXT_LEFT_JUSTIFICATION'] . $POSCommand['PRINT_RED'] . $POSCommand['TXT_DOUBLE_WIDTH'] . 'COMMETS:' . "\n" . $POSCommand['PRINT_BLACK'] . $contents->note . $POSCommand['TXT_NORMAL_SIZE'];
            //$note .= "\n" . $this->line('', 'single_line', $POSCommand);
            //$note = $POSCommand['TXT_DOUBLE_WIDTH'] . "\n" . $POSCommand['PRINT_RED'] . 'COMMNETSXX:' . $POSCommand['PRINT_BLACK'] . "\n" . $contents->note . $POSCommand['TXT_NORMAL_SIZE'];
            $nextSpace = "";
        }else{
            $nextSpace = "\n";
        }
        //$note .= "\n" . $this->line('', 'single_line', $POSCommand);
        //$header = $this->line('ORDER: ' . $contents->order_code, 'center');
        $s = explode("-", $contents->display_id); //split string by -
        $display_id_third_part = $s[2]; //get third part
        //$display_id_first_part=$s[0];
        //$display_id_second_part=$s[1];


        $header = $POSCommand['HEADER_FORMAT'] . "ORDER NO: " . $display_id_third_part . $POSCommand['TXT_NORMAL_SIZE'];

        //VV $time = $this->line('TIME:', 'center') . "\n" .
        //VV      $this->line(date("D d/m h:ia"), 'center');

        if (strpos($nameOfLogFile, 'manager') !== false)
        { //is it a manager's copy?
            // $docket_type = "\n" . "\n" . $POSCommand['TXT_DOUBLE2_SIZE'] . $POSCommand['TXT_DOUBLE_WIDTH'] . $POSCommand['TXT_BOLD_ON'] . $POSCommand['TXT_UNDERL2_ON'] . $POSCommand['PRINT_RED'] .">>COPY - DO NOT COOK!<<<" . $POSCommand['PRINT_BLACK'] . $POSCommand['TXT_UNDERL_OFF'] . $POSCommand['TXT_BOLD_OFF'] . "\n";
            $footer = "\n" . "\n" . $POSCommand['TXT_DOUBLE2_SIZE'] . $POSCommand['TXT_DOUBLE_WIDTH'] . $POSCommand['TXT_BOLD_ON'] . $POSCommand['TXT_UNDERL2_ON'] . $POSCommand['PRINT_RED'] . ">>COPY - DO NOT COOK!<<" . $POSCommand['PRINT_BLACK'] . $POSCommand['TXT_UNDERL_OFF'] . $POSCommand['TXT_BOLD_OFF'] . "\n"
                  . $POSCommand['TXT_NORMAL_SIZE'] . $POSCommand['TXT_CENTER_JUSTIFICATION'] .  $this->line('', 'full_line', $POSCommand) . "\n" . "Printed At: " . date('g:ia j/n/y',
                        time());
        }
        else
        {
            //$docket_type = "";
            $footer = $this->line('', 'full_line', $POSCommand) . "\n" . $POSCommand['TXT_CENTER_JUSTIFICATION'] . $POSCommand['TXT_NORMAL_SIZE'] . "Printed At: " . date('g:ia j/n/y',
                        time());
        }

        $time = $POSCommand['TIME_FORMAT'];
        if ($contents->order_time == 'asap')
        {
            $time.="ASAP";
        }
        else
        {
            $order_time = strtotime($contents->order_time);
            $time.=$POSCommand['PRINT_RED'] . "FOR: " . date('D j/n', $order_time) . " at " . "\n" . $POSCommand['PRINT_RED'] . ">>>" . $POSCommand['TXT_UNDERL2_ON'] . date('h:ia',
                        $order_time) . $POSCommand['TXT_UNDERL_OFF'] . "<<<" . $POSCommand['PRINT_BLACK'];
        }
        $time.= $POSCommand['TXT_NORMAL_SIZE'] . $POSCommand['LINE_SPACING_DEFAULT'];
        //$time = $this->TXT_CENTER_JUSTIFICATION . $this->TXT_DOUBLE2_SIZE . ($contents->order_time == 'asap' ? 'ASAP' : $contents->order_time) . $this->TXT_NORMAL_SIZE;
        // $open_drawer = '';
        // if ($contents->open_drawer =='yes'){
        //     $open_drawer = $this->OPEN_DRAWER;
        // }



        $deliveryTitle_and_Address = $this->get_DeliveryTitle_and_CustAddress($contents);
        $delivery_title = $deliveryTitle_and_Address['delivery_title'];
        $cust_address = $deliveryTitle_and_Address['cust_address'];

        $customer = $this->get_delivery_data($contents);
        $customer_name = trim(ucwords(strtolower($customer['name'])));
        if ($customer_name !== ''){
             $customer_name = $customer_name;
        }
        //$customer_phone_number = trim($this->formatPhoneNumber($customer['phone_number']));
        $customer_phone_number = '';
        if ($customer_phone_number !== ''){
            $customer_phone_number = $nextSpace . $POSCommand['TXT_FONT_B'] . $POSCommand['LINE_SPACING_DEFAULT'] . "PHONE: " . $customer_phone_number;
        }

        if ($print_address == 1 && ($customer_name !== '' || $customer_phone_number !== '')) {
            $customer_info =  "\n" . $this->line('', 'single_line', $POSCommand)
                  . $POSCommand['TXT_FONT_B'] . $POSCommand['TXT_DOUBLE2_SIZE'] . $POSCommand['LINE_SPACING_1']
                  . $POSCommand['TXT_BOLD_ON'] . $delivery_title . $POSCommand['TXT_BOLD_OFF'] . $POSCommand['TXT_FONT_B']
                  . $customer_name
                  . $cust_address
                  . $customer_phone_number . $POSCommand['TXT_NORMAL_SIZE'] . $POSCommand['LINE_SPACING_DEFAULT'] . $POSCommand['TXT_FONT_A'];

        }
        else
        {
            $customer_info = "";
        }

        $replace = array(
           '%header%' => $header,
           '%time%' => $time,
           '%cart_content%' => $cart_contents,
           //'%price_calculation%' => $price_calculation,
           '%note%' => $note,
           '%footer%' => $footer,
           //'%footer%' => $this->line('', 'full_line'),
           '%line_separation%' => $this->line('', 'single_line', $POSCommand),
           '%customer_info%' => $customer_info, //VV
           '%delivery_or_table_order%' => $delivery_or_table_order,
              //'%open_drawer%' => $open_drawer
              //'%footer%'              => "\x1b\x61\x01\x1b\x45\x01\x1b\x2d\x02\x1b\x21\x10\x1b\x21\x20 Test Here \x1b\x2d\x00\x1b\x45\x00\n"
        );

        $text = str_replace(array_keys($replace), array_values($replace), $t);
        $text = stripslashes($text);


        $fh = fopen($basePath . $nameOfLogFile . '_2.txt', 'w');

        if (!$fh)
        {
            showInfoAbotErrorAndDie(__FILE__, __LINE__,
                  $basePath . $nameOfLogFile . '_2.txt');
        }

        //        $fh   = fopen('/var/www/html/posapp/application/libraries/printer_template/log2.txt',
        //                'w') or die("Can't open file.");
        //$results = print_r($contents, true);
        fwrite($fh, $text);
        fclose($fh);
        /* echo $text;
          die; */

        return $text;
    }

//prepareKitchenDocket

    public function callKitchenDocket($data, $contents, $nameOfLogFile, $extra_cart)
    {
        foreach ($data as $printer_id => $copies)
        {
            //$printer="thermal_1";
            //$POSCommand=selectPrinter($printer);
//            var_dump($data);

            $printer = $this
                  ->CI
                  ->db
                  ->get_where('pos_printers', array('id' => $printer_id))
                  ->row();

            $POSCommand = selectPrinterCommandSet($printer->printer_type);

            $text = $this->prepareKitchenDocket($contents, $nameOfLogFile, $POSCommand,
                  $extra_cart, $printer->print_address);




            $beep_printer = "no";
            if ($printer->beep == 1)
            {
                $beep_printer = 'yes';
            }

            for ($i = 0; $i < $copies; $i++)
            {
                $fp = @fsockopen($printer->ip, $printer->port, $errno, $errstr, 10);
                if ($fp && is_resource($fp))
                {

                    //fwrite($fp, $POSCommand['RESET_PRINTER']); //doesn't play nice - adds 'd' in front of the title on thermal1 - need to check on matrix1 as well TODO, on Xprinter it blocks the printer!

                    fwrite($fp, $text);
                    // fwrite($fp, "\012\012\012\012\012\012\012\012\012\033\151\010\004\001");
                    fwrite($fp, $POSCommand['CUT_PAPER']);
                    if ($beep_printer == 'yes' && $printer_already_beeped != 'yes')
                    {
                        fwrite($fp, $POSCommand['BEEP_PRINTER']);
                        $printer_already_beeped = 'yes';
                    }
                    fclose($fp);
                    $return[$printer_id] = array(
                       'status' => 'printed'
                    );
                }
                else
                {
                    $return[$printer_id] = array(
                       'status' => 'error',
                       'error' => array(
                          'status' => $errstr,
                          'no' => $errno
                       )
                    );
                }
            }
        }
        return $return;
    }

//    optimised out

    public function line($str, $pos = 'left', $POSCommand)
    {
        $space = "\040";
        //$len = 47;
        $len = $POSCommand['LINE_LENGHT'];
        $print_len = strlen($str);
        $out = '';


        switch ($pos)
        {
            case 'center':
                $l = $len - $print_len;
                $l = floor($l / 2);
                $out = str_repeat($space, $l) . $str . str_repeat($space, $l);
                break;
            case 'single_line':
                //VV
                if ($str != '' || strlen($str) > 1)
                {
                    $str = substr($str, 0, 1);
                }
                else
                {
                    $str = '-';
                }
                $out = str_repeat($str, $len);
                break;
            case 'full_line':
                if ($str != '' || strlen($str) > 1)
                {
                    $str = substr($str, 0, 1);
                }
                else
                {
                    $str = '=';
                }
                $out = str_repeat($str, $len);
                break;
        }

        return $out;
    }

    public function print_footer($contents, $POSCommand)
    {
        $RestaurantName = $this->CI->db->get_where('pos_texts', array('id' => 1))->row();
        $RestaurantABN = $this->CI->db->get_where('pos_texts', array('id' => 2))->row();
        $RestaurantAddress = $this->CI->db->get_where('pos_texts', array('id' => 3))->row();
        $RestaurantContact = $this->CI->db->get_where('pos_texts', array('id' => 4))->row();
        $PromotionText = $this->CI->db->get_where('pos_texts', array('id' => 5))->row();
        //$PoweredBy          =    $this->CI->db->get_where('pos_texts', array('id' =>6))->row();
        $time = $contents->order_at;
        if (is_numeric($time) && (int) $time == $time)
        { //is it timestamp?
            $time = $time;
        }
        else
        { //when re-printing the order_at (time) comes in content->date and as a string istead of timestamp
            $time = strtotime($contents->date);
        }
        $footer = $this->line('', 'full_line', $POSCommand) . "\n"
              . $POSCommand['TXT_NORMAL_SIZE'] . $POSCommand['TXT_CENTER_JUSTIFICATION']
              // . "Order No.$contents->display_id "
              . "Placed at"
              . " " . date('g:ia j/n/y', $time) . "\n" . "\n"
              . $POSCommand['TXT_BOLD_ON'] . $RestaurantName->text . $POSCommand['TXT_BOLD_OFF'] . ', '. $RestaurantABN->text . "\n"
              . $RestaurantAddress->text . "\n"
              . $RestaurantContact->text . "\n"
              . $PromotionText->text . "\n";
        //. $PoweredBy->text;

        return $footer;
    }


    public function get_delivery_data($contents){

        $this->CI->load->model('sync');
        $customer = $this->CI->sync->getPOSUserByPhone((array) $contents);
        //$customer = $this->CI->sync->getUserByPhone((array) $contents);
        //unset($customer['id']);
        //$customer_info = implode("\n", $customer);
        //$customer_info = preg_replace("/\([^)]+\)/","",$customer_info ); //remove prentecies ie ($4)
        $customer['address'] = trim(preg_replace("/\([^)]+\)/", "", $customer['address'])); //remove prentecies and their content - ie ($4)
        if (count($customer) > 0)
        {
            $data = $customer;
        }
        else
        {
            $data = "";
        }
        return $data;

        //VV**********
    }


    public function delivery_or_table_order($contents){
        $customer = $this->get_delivery_data($contents);

        $delivery_or_table_order = '';
        if (($contents->table == ''))
        {
            if(trim($customer['address']) ==!''){
                $delivery_or_table = 'DELIVERY';
            }else{
                $delivery_or_table = 'PICK-UP';
            }
        }
        elseif ($contents->table == 'T')
        {
            $delivery_or_table = "TAKEAWAY";
        }
        else
        {
            $delivery_or_table = "TABLE NO." . $contents->table;
        }

        return $delivery_or_table;

    }


    public function get_DeliveryTitle_and_CustAddress($contents){
        $delivery_pickup_table = $this->delivery_or_table_order($contents);
        $customer = $this->get_delivery_data($contents);

        if (trim($customer['address']) !== '' && $delivery_pickup_table == 'DELIVERY')
        {
            $data['delivery_title'] =   'DELIVERY DETAILS:';
            $data['cust_address'] = "\n" . $customer['address'];

        }
        elseif ($delivery_pickup_table == 'PICK-UP')
        {
            $data['delivery_title'] = 'PICK-UP:';
            $data['cust_address'] = '';

        }
        else
        { // TAKEAWAY OR TABLE ORDER
            $data['delivery_title'] = '';
            $data['cust_address'] = '';
        }

        return $data;
    }

}
