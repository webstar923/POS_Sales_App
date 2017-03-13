<?php

/**
 * Created by PhpStorm.
 * User: gabi
 * Date: 3/27/14
 * Time: 4:33 PM
 */
Class Printer
{

    var $CI;
    //for full list of ESC commands see https://drive.google.com/file/d/0B_DC36ENkLf8NHg3dzdsNl91MXc/edit?usp=sharing
    protected $TXT_DOUBLE_SIZE = "\x1d\x21\x22";
    protected $TXT_DOUBLE2_SIZE = "\x1d\x21\x13";
    protected $TXT_NORMAL_SIZE = "\x1d\x21\x00";
    protected $TXT_CENTER_JUSTIFICATION = "\x1b\x61\x01";
    protected $TXT_LEFT_JUSTIFICATION = "\x1b\x61\x00";
    protected $TXT_RIGHT_JUSTIFICATION = "\x1b\x61\x02"; # Right justification
    protected $LINE_SPACING_DEFAULT = "\x1b\x32";
    protected $LINE_SPACING_1 = "\x1b\x33\x10";
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
    protected $DISCOUNT_IDENTIFICATOR = 'discount';
    protected $DISCOUNT_MISCELLANEOUS = 'misc-disc';
    protected $DISCOUNT_EXTRA_CHARGE  = 'extraCharge';

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
            if ($elem['id'] == $this->DISCOUNT_IDENTIFICATOR  || strpos($elem['id'],$this->DISCOUNT_MISCELLANEOUS )!== false 
                    || strpos($elem['id'],$this->DISCOUNT_EXTRA_CHARGE )!== false   )
            {
//                echo " was found";
//                var_dump($elem);                
                unset($arrSourceWithProducts[$key]);
                $arrSourceWithProducts[$key] = $elem;
//                break;
            }
        }
        
        return  $arrSourceWithProducts;
    }

    public function call($data, $contents)
    {

        $return = array();
        $contents = json_decode($contents);
        $products = json_decode($contents->contents, 1);

        $t = file_get_contents(FCPATH . 'application/libraries/printer_template/recipe.template.php');
        //VV

        $fh = fopen('/var/www/html/posapp/application/libraries/printer_template/log.txt', 'w') or die("Can't open file.");
                                
//        echo "all data <br/>";
//        var_dump($data); 
//        echo "content all <br/>";
        
//        var_dump($contents); 
                  
                
        $results = print_r($contents, true);
        $results = str_replace('[date]', '[order_placed_at]', $results);
        
//        var_dump($results);
        
        fwrite($fh, $results);
        fclose($fh);

        //VV
        $delivery_or_table_order = '';
        if (!isset($contents->table))
        {
            $delivery_or_table_order = 'DELIVERY';
        } elseif ($contents->table == 'T')
        {
            $delivery_or_table_order = "TAKEAWAY";
        } else
        {
            $delivery_or_table_order = "TABLE NO." . $contents->table;
        }
        $delivery_or_table_order = $this->TXT_BOLD_ON . $delivery_or_table_order . $this->TXT_BOLD_OFF . ' ORDER:';
        $delivery_or_table_order = $this->TXT_DOUBLE_SIZE . $this->TXT_CENTER_JUSTIFICATION . $delivery_or_table_order
                . $this->TXT_NORMAL_SIZE . $this->TXT_LEFT_JUSTIFICATION;
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
            $cart_contents .=  $this->TXT_FONT_B . $this->TXT_DOUBLE2_SIZE . $this->TXT_BOLD_ON . strtoupper($product['qty']) . ' x ' . $product['name'] . $this->TXT_BOLD_OFF . "\n";
            if (isset($product['extra']))
            {
                $cart_contents .= $this->format_extra(json_decode($product['extra'], 1), $product);
            }
            $cart_contents .= $this->TXT_FONT_B . $this->TXT_DOUBLE2_SIZE . $this->TXT_BOLD_ON . $this->TXT_RIGHT_JUSTIFICATION . ' - $' . $product['tot_price'] . $this->TXT_NORMAL . $this->$TXT_LEFT_JUSTIFICATION ;
            $cart_contents .=  "\n";
            $total += $product['price'];
        }

        //VV$price_calculation = 'Total: $'.number_format($total, 2);
        $price_calculation = $this->TXT_RIGHT_JUSTIFICATION . $this->TXT_DOUBLE_SIZE . $this->TXT_UNDERL2_ON . 'Total:$' . number_format($total, 2)
                . $this->TXT_UNDERL_OFF . $this->TXT_NORMAL_SIZE . $this->TXT_LEFT_JUSTIFICATION;

        if (property_exists($contents, 'order_status') && $contents->order_status != '')
        {
            $price_calculation .= "\n\n" . $this->line($contents->order_status, 'center');
        }

        $this->CI->load->model('sync');
        $customer = $this->CI->sync->getUserByPhone((array) $contents);
        unset($customer['id']);
        $customer_info = implode("\n", $customer);
        if (count($customer) > 0)
        {
            $customer_info = 'CUSTOMER:' . "\n" . $customer_info;
        } else
        {
            $customer_info = '';
        }

        $note = '';
        if ($contents->note != '')
        {
            $note = 'ORDER COMMNETS:' . "\n" . $contents->note;
        }

        //$header = $this->line('ORDER: ' . $contents->order_code, 'center');

        $header = $this->TXT_DOUBLE_SIZE . $this->TXT_CENTER_JUSTIFICATION . $contents->order_code . $this->TXT_NORMAL_SIZE;

        //VV $time = $this->line('TIME:', 'center') . "\n" .
        //VV      $this->line(date("D d/m h:ia"), 'center');

        $time = $this->TXT_DOUBLE_SIZE . $this->TXT_CENTER_JUSTIFICATION . ($contents->order_time == 'asap' ? 'ASAP' : $contents->order_time) . $this->TXT_NORMAL_SIZE . $this->TXT_LEFT_JUSTIFICATION;


        $replace = array(
            '%header%' => $header,
            '%time%' => $time,
            '%cart_content%' => $cart_contents,
            '%price_calculation%' => $price_calculation,
            '%note%' => $note,
            '%footer%' => $this->line('', 'full_line'),
            '%line_separation%' => $this->line('', 'single_line'),
            '%customer_info%' => $customer_info,
            '%delivery_or_table_order%' => $delivery_or_table_order
                //'%footer%'              => "\x1b\x61\x01\x1b\x45\x01\x1b\x2d\x02\x1b\x21\x10\x1b\x21\x20 Test Here \x1b\x2d\x00\x1b\x45\x00\n"
        );

        $text = str_replace(array_keys($replace), array_values($replace), $t);
        $text = stripslashes($text);
        $fh = fopen('/var/www/html/posapp/application/libraries/printer_template/log2.txt', 'w') or die("Can't open file.");
        //$results = print_r($contents, true);
        fwrite($fh, $text);
        fclose($fh);
        /* echo $text;
          die; */

        foreach ($data as $printer_id => $copies)
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
                    //VV fwrite($fp, "\033\100");
                    //VV $out = $text . "\r\n";
                    $out = $text; // . $this->LINE_SPACING_1;
                    fwrite($fp, $out);
                    // fwrite($fp, "\012\012\012\012\012\012\012\012\012\033\151\010\004\001");
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

//        echo "start all data";
//        var_dump($allDataAboutOrder);
//        echo "~~~~~~~~~~~~~~~~";
//
//        echo "pizzas data";
//        var_dump($data);
//        echo "~~~~~~~~~~~~~~~~";

        $out = '';
        $half = '';
        $space = "\040\040";
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
            $out .= $space . ' > ' . $i . ': ' . join(',', $val) . "\n";
        }
        
        
        // bug when there is two parts appeared here
        if (isset($data['default_first']) && !isset($options['half'])  )
        {
            $tmp_out = '';
            foreach ($data['default_first'] as $val)
            {
                $tmp_out .= $val . ', ';
            }
            if ($tmp_out != '')
            {
                $out .= $space . ' > Exclude: ' . substr($tmp_out, 0, -2) . "\n";
            }
        }
              
//        echo "out here2 <br/>";        
//        var_dump($out);        
            
        // bug when there is two parts appeared here
        if (isset($options['ingredients']) && !isset($options['half'])  )
        {                                                
            $ing = array();
            foreach ($options['ingredients'] as $value)
            {
                $ing[] = implode(', ', $value);
            }
            $out .= $space . ' > Extra: ' . implode(', ', $ing) . "\n";
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

            $out .= $space . ' > 1st Half:' . $nameOfFirstPartOfPizza . "\n";

            list($name, ) = explode('-', $options['half']['name']);
            $out .= $space . ' > 2nd Half: ' . $name . "\n";
        }

        
//        echo "out here4 <br/>";
//        
//        var_dump($out);
        
        
        if (isset($data['default_second']))
        {
            $tmp_out = '';
            foreach ($data['default_second'] as $i => $val)
            {
                $tmp_out .= $val . ', ';
            }
            if ($tmp_out != '')
            {
                $out .= $space . $space . " > Exclude: " . substr($tmp_out, 0, -2) . "\n";
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
                $ing[] = implode(', ', $value);
            }
            $out .= $space . $space . ' > Extra: ' . implode(', ', $ing) . "\n";
        }

        if ($note != '')
        {
            $out .= $space . " > Note: " . $note . "\n\n";
        } else
        {
            $out .= "\n";
        }

        return $out;
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

}
