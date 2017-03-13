<?php

/**
 * Created by PhpStorm.
 * User: gabi
 * Date: 3/27/14
 * Time: 4:33 PM 
 */
function showInfoAbotErrorAndDie($file, $line, $info)
{
    echo "php says: ";
    print_r(error_get_last());

    die( print_r(error_get_last()) . 'critical error happened' . $file . '  ' . $line . ' ' . $info);
}
            
Class Printer
{

    var $CI;
    //for full list of ESC commands see https://drive.google.com/file/d/0B_DC36ENkLf8NHg3dzdsNl91MXc/edit?usp=sharing
    protected $TXT_DOUBLE_SIZE = "\x1d\x21\x22"; //see page 31 bottom
    protected $TXT_DOUBLE2_SIZE = "\x1d\x21\x11";
    protected $TXT_DOUBLE_WIDTH = "\x1d\x21\x10";
    protected $TXT_DOUBLE_HEIGHT = "\x1d\x21\x01";
    protected $TXT_NORMAL_SIZE = "\x1d\x21\x00";
    protected $TXT_CENTER_JUSTIFICATION = "\x1b\x61\x01";
    protected $TXT_LEFT_JUSTIFICATION = "\x1b\x61\x00";
    protected $TXT_RIGHT_JUSTIFICATION = "\x1b\x61\x02"; # Right justification
    protected $LINE_SPACING_DEFAULT = "\x1b\x33\x20";
    protected $LINE_SPACING_1 = "\x1b\x33\x30";
    protected $LINE_SPACING_2 = "\x1b\x33\x35"; //page 18
    protected $TXT_NORMAL = "\x1b\x21\x00"; # Normal text
    protected $TXT_UNDERL_OFF = "\x1b\x2d\x00"; # Underline font OFF
    protected $TXT_UNDERL_ON = "\x1b\x2d\x01"; # Underline font 1-dot ON
    protected $TXT_UNDERL2_ON = "\x1b\x2d\x02"; # Underline font 2-dot ON
    protected $TXT_BOLD_OFF = "\x1b\x45\x00"; # Bold font OFF
    protected $TXT_BOLD_ON = "\x1b\x45\x01"; # Bold font ON
    protected $TXT_FONT_A = "\x1b\x4d\x00"; # Font type A
    protected $TXT_FONT_B = "\x1b\x4d\x01"; # Font type B
    protected $TXT_ALIGN_LT = "\x1b\x61\x00"; # Left justification
    protected $TXT_ALIGN_CT = "\x1b\x61\x01"; # Centering
    protected $TXT_ALIGN_RT = "\x1b\x61\x02"; # Right justification
    protected $OPEN_DRAWER = "\x1b\x70\x00\x01\x99"; #open cash drawer
    protected $BEEP_PRINTER = "\x1b\x42\x09\x03"; #printer's sound alarm - 09 is number of beeps. 05 is duration of a beep
    protected $PRINT_LOGO = "\x1c\x70\x01\x00"; //print logo
    protected $CUT_PAPER = "\x1d\x56\x49\x00"; //cut paper
    //protected $LINE_
    protected $DISCOUNT_IDENTIFICATOR = 'discount';
    protected $DISCOUNT_MISCELLANEOUS = 'misc-disc';
    protected $DISCOUNT_EXTRA_CHARGE = 'extraCharge';

    public function __construct()
    {
        $this->CI = &get_instance();
    }

    public function callInvoice($print, $contents)
    { 
        $return = array();

        $replace = array(
            '%cash_in%' => $contents['cash'],
            '%cc_in%' => $contents['creditcard'],
            '%subtotal%' => $contents['subtotal'],
            '%grant%' => $contents['grant'],
        );

        //parse_str($contents, $replace);
        $fh = fopen('/var/www/html/posapp/application/libraries/printer_template/log_balance.txt', 'w');
        if (!$fh)
        {
            showInfoAbotErrorAndDie(__FILE__, __LINE__, '/printer_template/log_balance.txt');
        }

        //$results = print_r($contents, true);
        fwrite($fh, print_r($contents, true));
        fclose($fh);

        $fh = fopen('/var/www/html/posapp/application/libraries/printer_template/log_balance_print.txt', 'w');

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
                } else
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

    /**
     *  Moves information about discount to the end of the cheque
     * 
     * @param type $arrSourceWithProducts -  returns reordered orders
     */
    private function moveDiscountToTheEndOfTheCheque($arrSourceWithProducts)
    {

        foreach ($arrSourceWithProducts as $key => $elem)
        {
            if ($elem['id'] == $this->DISCOUNT_IDENTIFICATOR || strpos($elem['id'], $this->DISCOUNT_MISCELLANEOUS) !== false || strpos($elem['id'], $this->DISCOUNT_EXTRA_CHARGE) !== false)
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

    public function call($data, $contents)
    {
        $return = array();
//        return;
//        echo "ddd";
//        var_dump($contents);
//die;
        $contents = json_decode($contents);
//        var_dump($contents);


        $products = json_decode($contents->contents, 1);

        $t = file_get_contents(FCPATH . 'application/libraries/printer_template/recipe.template.php');
        //VV
        //   echo "all data <br/>";
        //    var_dump($data);
        //    echo "content all <br/>";
        //    var_dump($contents);
        $fh = fopen('/var/www/html/posapp/application/libraries/printer_template/logMINE_INVOICE.txt', 'w');


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
//            $additionalInfoToLogTxt->credit_card_fee2 = '2$';
                //for the sake of adding property to object
                $contents = (object) array_merge((array) $contents, (array) $additionalInfoToLogTxt);
            }
        }
//        $contents->unique_id ='';
        unset($contents->unique_id);

        $results = print_r($contents, true);
        $results = str_replace('[date]', '[order_at]', $results);
        $cash_drawer = json_decode($contents->open_cash_drawer, 1);



        $fh = fopen('/var/www/html/posapp/application/libraries/printer_template/log.txt', 'w');

        if (!$fh)
        {
            showInfoAbotErrorAndDie(__FILE__, __LINE__, 'log.txt');
        }


        fwrite($fh, $results);
        fclose($fh);

        //VV
        $delivery_or_table_order = '';
        if (($contents->table == ''))
        {
            $delivery_or_table = 'DELIVERY';
        } elseif ($contents->table == 'T')
        {
            $delivery_or_table = "TAKEAWAY";
        } else
        {
            $delivery_or_table = "TABLE NO." . $contents->table;
        }

        $delivery_or_table_order = $this->TXT_DOUBLE2_SIZE . $this->TXT_CENTER_JUSTIFICATION . $this->TXT_BOLD_ON . $delivery_or_table . $this->TXT_BOLD_OFF;
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
        foreach ($products as $product)
        {
            $cart_contents .= $this->TXT_LEFT_JUSTIFICATION . $this->LINE_SPACING_1 . $this->TXT_FONT_B . $this->TXT_DOUBLE2_SIZE . $this->TXT_BOLD_ON . $product['qty'] . 'x' . strtoupper($product['name']) . $this->TXT_BOLD_OFF;

            if (isset($product['extra']))
            {
                $cart_contents .= "\n" . $this->format_extra(json_decode($product['extra'], 1), $product);
            } else
            {
                $cart_contents .= "\n";
            }

            $cart_contents .= $this->TXT_RIGHT_JUSTIFICATION . $this->LINE_SPACING_DEFAULT . $this->TXT_FONT_B . $this->TXT_DOUBLE2_SIZE . '$' . $product['tot_price'] . $this->TXT_NORMAL . "\n";
            //$cart_contents .=  "\n";
            //$total += $product['price'];
        }

        //VV$price_calculation = 'Total: $'.number_format($total, 2);
        //credit card fee
        if (property_exists($contents, 'credit_card_fee') && $contents->credit_card_fee != '0.00')
        {
            $price_calculation = $this->TXT_RIGHT_JUSTIFICATION . $this->TXT_NORMAL_SIZE . "Card Fee: $" . $contents->credit_card_fee . "\n";
        }
        //delivery fee
        if (isset($fee) && $fee != '')
        {
            $price_calculation .= $this->TXT_RIGHT_JUSTIFICATION . $this->TXT_NORMAL_SIZE . "Delivery Fee: " . $fee . ".00" . "\n";
        }
        //rounding
        if (property_exists($contents, 'rounding') && $contents->rounding != '0.00')
        {
            if ($contents->rounding < 0)
            {
                $price_calculation .= $this->TXT_RIGHT_JUSTIFICATION . $this->TXT_NORMAL_SIZE . "Rounding: -$" . $contents->rounding * (-1) . "\n";
            } else
            {
                $price_calculation .= $this->TXT_RIGHT_JUSTIFICATION . $this->TXT_NORMAL_SIZE . "Rounding: +$" . $contents->rounding . "\n";
            }
        }

        if (!isset($price_calculation))
        {
            $price_calculation = '';
        }

        $price_calculation .= $this->TXT_RIGHT_JUSTIFICATION . $this->TXT_DOUBLE2_SIZE . $this->TXT_UNDERL2_ON . 'TOTAL:$' . number_format($contents->total, 2)
                . $this->TXT_UNDERL_OFF . $this->TXT_NORMAL_SIZE . "\n" . '(including GST)';



        if (property_exists($contents, 'order_status') && $contents->order_status != '')
        {
            $payment_status = explode('-', $contents->order_status, 2);

            $table_order = strpos($delivery_or_table_order, "TABLE");
            if ($table_order !== false)
            {
                $payment_status[1] = str_replace("on Pickup", "on leaving", $payment_status[1]);  //in case table order is to be paid later we need to change "Visa on Pickup -> Visa on leaving". super rare
            }

            if ($payment_status[0] == 'UNPAID')
            {
                $payment_status[1] = 'Parked Order';
            }
            $price_calculation .= "\n" . $this->TXT_RIGHT_JUSTIFICATION . $this->TXT_BOLD_ON . $this->TXT_DOUBLE2_SIZE . $payment_status[0] . $this->TXT_BOLD_OFF . $this->TXT_NORMAL_SIZE . ' - ' . $payment_status[1];
        }



        $this->CI->load->model('sync');
        $customer = $this->CI->sync->getPOSUserByPhone((array) $contents);
        //unset($customer['id']);
        //$customer_info = implode("\n", $customer);
        //$customer_info = preg_replace("/\([^)]+\)/","",$customer_info ); //remove prentecies ie ($4)
        $customer_address = trim(preg_replace("/\([^)]+\)/", "", $customer['address'])); //remove prentecies and their content - ie ($4)
        if (count($customer) > 0 && $delivery_or_table == "DELIVERY")
        {
            $customer_info = $this->TXT_LEFT_JUSTIFICATION . $this->TXT_DOUBLE2_SIZE . $this->LINE_SPACING_2
                    . $this->TXT_BOLD_ON . 'DELIVERY DETAILS:' . $this->TXT_BOLD_OFF
                    . "\n" . $customer['name']
                    . "\n" . $customer_address
                    . "\n" . "PHONE: " . $customer['phone_number'] . $this->TXT_NORMAL_SIZE . $this->LINE_SPACING_DEFAULT;
        } else
        {
            $customer_info = "";
        }

        $note = '';
        if ($contents->note != '')
        {
            $note = $this->TXT_DOUBLE_WIDTH . "\n" . 'COMMNETS:' . "\n" . $contents->note . $this->TXT_NORMAL_SIZE;
        }

        //$header = $this->line('ORDER: ' . $contents->order_code, 'center');
        $s = explode("-", $contents->display_id); //split string by -
        $display_id_third_part = $s[2]; //get third part
        $display_id_first_part = $s[0];
        $display_id_second_part = $s[1];

        $header = $this->TXT_DOUBLE_WIDTH . $this->TXT_CENTER_JUSTIFICATION . "TAX INVOICE" . "\n" .
                $this->TXT_DOUBLE2_SIZE . $display_id_first_part . "-" . "$display_id_second_part"
                . $this->TXT_BOLD_ON . "-" . $this->TXT_UNDERL2_ON . $display_id_third_part . $this->TXT_UNDERL_OFF . $this->TXT_BOLD_OFF . $this->TXT_NORMAL_SIZE;

        //VV  = $this->line('TIME:', 'center') . "\n" .
        //VV      $this->line(date("D d/m h:ia"), 'center');
        $time = $this->TXT_CENTER_JUSTIFICATION . $this->TXT_DOUBLE2_SIZE;
        if ($contents->order_time == 'asap')
        {
            $time.="ASAP";
        } else
        {
            $order_time = strtotime($contents->order_time);
            $time.="FOR: " . date('D j/n', $order_time) . " at " . "\n" . ">>>" . $this->TXT_UNDERL2_ON . date('h:ia', $order_time) . $this->TXT_UNDERL_OFF . "<<<";
        }
        $time.= $this->TXT_NORMAL_SIZE;
        //$time = $this->TXT_CENTER_JUSTIFICATION . $this->TXT_DOUBLE2_SIZE . ($contents->order_time == 'asap' ? 'ASAP' : $contents->order_time) . $this->TXT_NORMAL_SIZE;

        $footer = $this->print_footer($contents);

        $replace = array(
            '%header%' => $header,
            '%time%' => $time,
            '%cart_content%' => $cart_contents,
            '%price_calculation%' => $price_calculation,
            '%note%' => $note,
            //'%footer%' => $this->line('', 'full_line'),
            '%footer%' => $footer,
            '%line_separation%' => $this->line('', 'single_line'),
            '%customer_info%' => $customer_info,
            '%delivery_or_table_order%' => $delivery_or_table_order,
                //'%open_drawer%' => $open_drawer
                //'%footer%'              => "\x1b\x61\x01\x1b\x45\x01\x1b\x2d\x02\x1b\x21\x10\x1b\x21\x20 Test Here \x1b\x2d\x00\x1b\x45\x00\n"
        );

        $text = str_replace(array_keys($replace), array_values($replace), $t);
        $text = stripslashes($text);
        $fh = fopen('/var/www/html/posapp/application/libraries/printer_template/log2.txt', 'w');

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
                        fwrite($fp, "$this->OPEN_DRAWER");
                        $drawer_already_open = 'yes';
                    }
                    fwrite($fp, "$this->PRINT_LOGO");
                    fwrite($fp, $text);
                    // fwrite($fp, "$this->CUT_PAPER");
                    //fwrite($fp, "\012\012\012\012\012\012\012\012\012\033\151\010\004\001");
                    fclose($fp);
                    $return[$printer_id] = array(
                        'status' => 'printed'
                    );
                } else
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

    public function callKitchenDocket($data, $contents, $nameOfLogFile)
    {
        $return = array();

        $basePath = '/var/www/html/posapp/application/libraries/printer_template/log';
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
            showInfoAbotErrorAndDie(__FILE__, __LINE__, $basePath . $nameOfLogFile . '.txt');
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
                $contents = (object) array_merge((array) $contents, (array) $additionalInfoToLogTxt);
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
        $delivery_or_table_order = '';
        if (($contents->table == ''))
        {
            $delivery_or_table = 'DELIVERY';
        } elseif ($contents->table == 'T')
        {
            $delivery_or_table = "TAKEAWAY";
        } else
        {
            $delivery_or_table = "TABLE NO." . $contents->table;
        }

        $delivery_or_table_order = $this->TXT_DOUBLE2_SIZE . $this->TXT_CENTER_JUSTIFICATION . $this->TXT_BOLD_ON . $delivery_or_table . $this->TXT_BOLD_OFF;
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
        foreach ($products as $product)
        {
            $cart_contents .= $this->TXT_LEFT_JUSTIFICATION . $this->LINE_SPACING_1 . $this->TXT_FONT_B . $this->TXT_DOUBLE2_SIZE . $this->TXT_BOLD_ON . $product['qty'] . 'x' . strtoupper($product['name']) . $this->TXT_BOLD_OFF;

            if (isset($product['extra']))
            {
                $cart_contents .= "\n" . $this->format_extra(json_decode($product['extra'], 1), $product);
            } else
            {
                $cart_contents .= "\n";
            }

            $cart_contents .= $this->TXT_NORMAL . "\n";
            //$cart_contents .=  "\n";
            //$total += $product['price'];
        }

        $note = '';
        if ($contents->note != '')
        {
            $note = $this->TXT_DOUBLE_WIDTH . "\n" . 'COMMNETS:' . "\n" . $contents->note . $this->TXT_NORMAL_SIZE;
        }

        //$header = $this->line('ORDER: ' . $contents->order_code, 'center');
        $s = explode("-", $contents->display_id); //split string by -
        $display_id_third_part = $s[2]; //get third part
        //$display_id_first_part=$s[0];
        //$display_id_second_part=$s[1];


        $header = $this->TXT_DOUBLE2_SIZE . $this->TXT_CENTER_JUSTIFICATION . "ORDER NO: " . $display_id_third_part . $this->TXT_NORMAL_SIZE;

        //VV $time = $this->line('TIME:', 'center') . "\n" .
        //VV      $this->line(date("D d/m h:ia"), 'center');

        if (strpos($nameOfLogFile, 'manager') !== false)
        { //is it a manager's copy?
            $docket_type = "\n" . "\n" . $this->TXT_DOUBLE2_SIZE . $this->TXT_BOLD_ON . $this->TXT_UNDERL2_ON . ">>COPY - DO NOT COOK!<<<" . $this->TXT_UNDERL_OFF . $this->TXT_BOLD_OFF . "\n";
            $footer = "\n" . "\n" . $this->TXT_DOUBLE2_SIZE . $this->TXT_BOLD_ON . $this->TXT_UNDERL2_ON . ">>COPY - DO NOT COOK!<<" . $this->TXT_UNDERL_OFF . $this->TXT_BOLD_OFF . "\n"
                    . $this->TXT_NORMAL_SIZE . $this->TXT_CENTER_JUSTIFICATION . "Printed At: " . date('g:ia j/n/y', time());
        } else
        {
            $docket_type = "";
            $footer = $this->TXT_NORMAL_SIZE . $this->TXT_CENTER_JUSTIFICATION . "Printed At: " . date('g:ia j/n/y', time());
        }

        $time = $this->TXT_CENTER_JUSTIFICATION . $this->TXT_DOUBLE2_SIZE;
        if ($contents->order_time == 'asap')
        {
            $time.="ASAP";
        } else
        {
            $order_time = strtotime($contents->order_time);
            $time.="FOR: " . date('D j/n', $order_time) . " at " . "\n" . ">>>" . $this->TXT_UNDERL2_ON . date('h:ia', $order_time) . $this->TXT_UNDERL_OFF . "<<<";
        }
        $time.= $this->TXT_NORMAL_SIZE;
        //$time = $this->TXT_CENTER_JUSTIFICATION . $this->TXT_DOUBLE2_SIZE . ($contents->order_time == 'asap' ? 'ASAP' : $contents->order_time) . $this->TXT_NORMAL_SIZE;
        // $open_drawer = '';
        // if ($contents->open_drawer =='yes'){
        //     $open_drawer = $this->OPEN_DRAWER;
        // }
        $replace = array(
            '%header%' => $header,
            '%time%' => $time,
            '%cart_content%' => $cart_contents,
            //'%price_calculation%' => $price_calculation,
            '%note%' => $note,
            '%footer%' => $footer,
            //'%footer%' => $this->line('', 'full_line'),
            '%line_separation%' => $this->line('', 'single_line'),
            //'%customer_info%' => $customer_info,
            '%delivery_or_table_order%' => $delivery_or_table_order,
                //'%open_drawer%' => $open_drawer
                //'%footer%'              => "\x1b\x61\x01\x1b\x45\x01\x1b\x2d\x02\x1b\x21\x10\x1b\x21\x20 Test Here \x1b\x2d\x00\x1b\x45\x00\n"
        );

        $text = str_replace(array_keys($replace), array_values($replace), $t);
        $text = stripslashes($text);




        $fh = fopen($basePath . $nameOfLogFile . '_2.txt', 'w');

        if (!$fh)
        {
            showInfoAbotErrorAndDie(__FILE__, __LINE__, $basePath . $nameOfLogFile . '_2.txt');
        }

//        $fh   = fopen('/var/www/html/posapp/application/libraries/printer_template/log2.txt',
//                'w') or die("Can't open file.");
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
                    fwrite($fp, $text);
                    // fwrite($fp, "\012\012\012\012\012\012\012\012\012\033\151\010\004\001");
                    if ($beep_printer == 'yes' && $printer_already_beeped != 'yes')
                    {
                        fwrite($fp, "$this->BEEP_PRINTER");
                        $printer_already_beeped = 'yes';
                    }
                    fclose($fp);
                    $return[$printer_id] = array(
                        'status' => 'printed'
                    );
                } else
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

    public function format_extra($data, $allDataAboutOrder)
    {

        $out = '';
        $half = '';
        $space = "\040";
        $note = $data['product_note'];
        $options = array();
        unset($data['product_note']);


        foreach ($data as $key => $value)
        {
            if (strstr($key, '[') > -1)
            {

                preg_match('/(.*)\[(.*)?\]/', $key, $tmp);

                if ($tmp[1] == 'ingredients' || $tmp[1] == 'ingredients_second' || $tmp[1] == 'variation')
                {
                    if ($tmp[1] != 'variation')
                    {
                        $tmp[2] = 'Extra';
                    }
                    if (!isset($value['name']))
                    {
                        foreach ($value as $j => $valueb)
                        {
                            if (!isset($options[$tmp[1]]))
                            {
                                $options[$tmp[1]] = array();
                            }
                            if (!isset($options[$tmp[1]][$tmp[2]]))
                            {
                                $options[$tmp[1]][$tmp[2]] = array();
                            }
                            $options[$tmp[1]][$tmp[2]][] = $valueb['name'];
                        }
                    } else
                    {
                        if (!isset($options[$tmp[1]]))
                        {
                            $options[$tmp[1]] = array();
                        }
                        if (!isset($options[$tmp[1]][$tmp[2]]))
                        {
                            $options[$tmp[1]][$tmp[2]] = array();
                        }
                        $options[$tmp[1]][$tmp[2]][] = $value['name'];
                    }
                }
                if ($tmp[1] == 'half')
                {
                    if ($value['id'] != '')
                    {
                        $options['half'] = $value;
                    }
                }
            }
        }


//        echo "out here1 <br/>";        
//        var_dump($out);

        foreach ($options['variation'] as $i => $val)
        {
            $out .= ' >' . strtoupper($i) . ':' . join(',', $val) . "\n";
        }

        // bug when there is two parts appeared here
        if (isset($data['default_first']) && !isset($options['half']))
        {
            $tmp_out = '';
            foreach ($data['default_first'] as $val)
            {
                $tmp_out .= $val . ',';
            }
            if ($tmp_out != '')
            {
                $out .= $space . '>NO:' . substr($tmp_out, 0, -2) . "\n";
            }
        }



//        echo "out here2 <br/>";        
//        var_dump($out);        
        // bug when there is two parts appeared here
        if (isset($options['ingredients']) && !isset($options['half']))
        {
            $ing = array();
            foreach ($options['ingredients'] as $value)
            {
                $ing[] = implode(',', $value);
            }
            $out .= $space . '>EXTRA:' . implode(',', $ing) . "\n";
        }


//echo "out here3 <br/>";
//        var_dump($out);
//        echo "options are ";
//         var_dump($options);
//        echo "data  ";
//        var_dump($data);


        if (isset($options['half']))
        {
//            looking for the name of the first half of pizza
            define('SEARCHED_WORD', '1st Half:');


//            echo "serched in string <br/>";
//            var_dump ($allDataAboutOrder["extra_cart"] );

            $positionEntry = strpos($allDataAboutOrder["extra_cart"], SEARCHED_WORD);
            $positionEnd = strpos($allDataAboutOrder["extra_cart"], '</i><br/>');
            $length = $positionEnd - $positionEntry;

            // taking necessary start of line
            $nameOfFirstPartOfPizza = substr(substr($allDataAboutOrder["extra_cart"], strlen(SEARCHED_WORD)), $positionEntry, $length);

            // cutting off the end of the line 
            $nameOfFirstPartOfPizza = substr($nameOfFirstPartOfPizza, 0, strlen($nameOfFirstPartOfPizza) - strlen('</i><br/>'));


//            here we have line like this
            //</div>string(65) " All Meats Pizza, NO: Bacon, BBQ Sauce, EXTRA: Anchovies, Basil; "

            echo "hereerreer";
            var_dump($nameOfFirstPartOfPizza);

            $secondPart = '';
            $secondPart[0] = '';
            $secondPart[1] = '';


            // combination, in the case there is no "NO" word at first then check if "EXTRA" word is present, some tricky   
            $firstPart = explode('NO:', $nameOfFirstPartOfPizza);
            if (count($firstPart) == 1)
            {
                $firstPart = explode('EXTRA:', $nameOfFirstPartOfPizza);
                $secondPart = explode('NO:', $firstPart[1]);
                $nameOfPizza = $this->trimLastComa($firstPart[0]);
            } else
            {
                $secondPart = explode('EXTRA:', $firstPart[1]);
                $nameOfPizza = $this->trimLastComa($firstPart[0]);
            }

//            $secondPart  = explode('EXTRA:', $firstPart[1]);
//            $nameOfPizza = $this->trimLastComa($firstPart[0]);
//            echo "divided";
//            var_dump($noPart);
//            var_dump($extraPart);
//            echo "1";
//            var_dump($firstPart);
//            echo "2";
//            var_dump($secondPart);
//            echo "4546";
//            if ($firstPart == '') {
//                $secondPart[1]  = explode('EXTRA:', $nameOfFirstPartOfPizza);
//                
//                $nameOfPizza = $this->trimLastComa( $secondPart[0]);
//            }
//            echo "3";
//            var_dump($nameOfPizza);
            // name of pizza , 

            if ($secondPart[0] != '')
            {
                $trimmedName = $this->trimLastComa($secondPart[0]);
                $secondPart[0] = "\n" . $space . ' >NO:' . str_replace(', ', ',', trim($trimmedName));
            }

            if ($secondPart[1] != '')
            {
                $trimmedName = $this->trimLastComa($secondPart[1]);
                $secondPart[1] = "\n" . $space . ' >EXTRA:' . str_replace(', ', ',', trim($trimmedName));
            }

            $nameOfFirstPartOfPizza = strtoupper($nameOfPizza) . $secondPart[0] . $secondPart[1];

            $out .= $space . '>1st HALF:' . trim($nameOfFirstPartOfPizza) . "\n";


            list($name, ) = explode('-', $options['half']['name']);
            $out .= $space . '>2nd HALF:' . strtoupper($name) . "\n";
        }


        if (isset($data['default_second']))
        {
            $tmp_out = '';
            foreach ($data['default_second'] as $i => $val)
            {
                $tmp_out .= $val . ',';
            }
            if ($tmp_out != '')
            {
                $out .= $space . $space . ">NO:" . substr($tmp_out, 0, -2) . "\n";
            }
        }

//        echo "out here5 <br/>";
//        
//        var_dump($out);


        if (isset($options['ingredients_second']))
        {
            $ing = array();
            foreach ($options['ingredients_second'] as $value)
            {
                $ing[] = implode(',', $value);
            }
            $out .= $space . $space . '>EXTRA:' . implode(',', $ing) . "\n";
        }

        if ($note != '')
        {
            $out .= $space . ">NOTE:" . $note . "\n";
        } else
        {
            // $out .= "\n";
        }

        return $out;
    }

    private function trimLastComa($line)
    {
        for ($i = strlen($line); $i > 0; $i--)
        {
            if ($line[$i] == ',' || $line[$i] == ';')
            {
                $line[$i] = ' ';
                break;
            }
        }
        return $line;
    }

    public function line($str, $pos = 'left')
    {
        $space = "\040";
        $len = 47;
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
                } else
                {
                    $str = '-';
                }
                $out = str_repeat($str, $len);
                break;
            case 'full_line':
                if ($str != '' || strlen($str) > 1)
                {
                    $str = substr($str, 0, 1);
                } else
                {
                    $str = '=';
                }
                $out = str_repeat($str, $len);
                break;
        }

        return $out;
    }

    public function print_footer($contents)
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
        } else
        { //when re-printing the order_at (time) comes in content->date and as a string istead of timestamp
            $time = strtotime($contents->date);
        }

        $footer = $this->line('', 'full_line') . "\n"
                . $this->TXT_NORMAL_SIZE . $this->TXT_CENTER_JUSTIFICATION
                . "Order No.$contents->display_id "
                . " - " . date('g:ia j/n/y', $time) . "\n" . "\n"
                . $this->TXT_BOLD_ON . $RestaurantName->text . $this->TXT_BOLD_OFF . "\n"
                . $RestaurantABN->text . ", "
                . $RestaurantAddress->text . "\n"
                . $RestaurantContact->text . "\n"
                . $PromotionText->text; // . "\n" . "\n"
        //. $PoweredBy->text;

        return $footer;
    }

}
