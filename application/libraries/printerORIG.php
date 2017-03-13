<?php
/**
 * Created by PhpStorm.
 * User: gabi
 * Date: 3/27/14
 * Time: 4:33 PM
 */

Class Printer {
    var $CI;

    public function __construct() {
        $this->CI = &get_instance();
    }

    public function callInvoice($print, $contents) {
        $return = array();

        parse_str($contents, $replace);

        $t = file_get_contents(FCPATH.'application/libraries/printer_template/balance_report.template');

        $text = str_replace(array_keys($replace), array_values($replace),$t);
        $text = stripslashes($text);

        foreach ($print as $printer_id=>$copies) {
            $printer = $this
                ->CI
                ->db
                ->get_where('pos_printers', array('id' => $printer_id))
                ->row();


            for ($i=0;$i<$copies;$i++) {
                $fp = @fsockopen($printer->ip, $printer->port, $errno, $errstr, 10);
                if ($fp && is_resource($fp)) {
                    fwrite($fp, "\033\100");
                    $out = $text . "\r\n";
                    fwrite($fp, $out);
                    fwrite($fp, "\012\012\012\012\012\012\012\012\012\033\151\010\004\001");
                    fclose($fp);
                    $return[$printer_id] = array(
                        'status'    => 'printed'
                    );
                } else {
                    $return[$printer_id] = array(
                        'status' => 'error',
                        'error' => array(
                            'status' => $errstr,
                            'no'    => $errno
                        )
                    );
                }
            }
        }

        return $return;
    }

    public function call($data, $contents) {
        $return = array();
        $contents = json_decode($contents);
        $products = json_decode($contents->contents,1);

        $t = file_get_contents(FCPATH.'application/libraries/printer_template/recipe.template');

        $cart_contents = '';
        $total = 0;
        foreach ($products as $product) {
            $cart_contents .=  $product['qty'] . ' x ' . $product['name'] . ' $' . $product['tot_price'] . "\n";
            if (isset($product['extra'])) {
                $cart_contents .=  $this->format_extra(json_decode($product['extra'],1));
            }
            $cart_contents .=  "\n";
            $total += $product['price'];
        }

        $price_calculation = 'Total: $'.number_format($total, 2);
        if (property_exists($contents, 'order_status') && $contents->order_status != '') {
            $price_calculation .= "\n\n" . $this->line($contents->order_status,'center');
        }

        $this->CI->load->model('sync');
        $customer = $this->CI->sync->getUserByPhone((array)$contents);
        unset($customer['id']);
        $customer_info = implode("\n",$customer);
        if (count($customer) > 0) {
            $customer_info = 'CUSTOMER:' . "\n" . $customer_info;
        } else {
            $customer_info = '';
        }

        $note = '';
        if ($contents->note != '') {
            $note = 'ORDER COMMNETS:' . "\n" . $contents->note;
        }

        $header = $this->line('ORDER: ' . $contents->order_code, 'center');

        $time = $this->line('TIME:', 'center') . "\n" .
            $this->line(date("D d/m h:ia"), 'center');


        $replace = array(
            '%header%'              => $header,
            '%time%'                => $time,
            '%cart_content%'        => $cart_contents,
            '%price_calculation%'   => $price_calculation,
            '%note%'                => $note,
            '%footer%'              => $this->line('','full_line'),
            '%customer_info%'       => $customer_info
            //'%footer%'              => "\x1b\x61\x01\x1b\x45\x01\x1b\x2d\x02\x1b\x21\x10\x1b\x21\x20 Test Here \x1b\x2d\x00\x1b\x45\x00\n"
        );

        $text = str_replace(array_keys($replace), array_values($replace),$t);
        $text = stripslashes($text);

        /*echo $text;
        die;*/

        foreach ($data as $printer_id=>$copies) {
            $printer = $this
                ->CI
                ->db
                ->get_where('pos_printers', array('id' => $printer_id))
                ->row();


            for ($i=0;$i<$copies;$i++) {
                $fp = @fsockopen($printer->ip, $printer->port, $errno, $errstr, 10);
                if ($fp && is_resource($fp)) {
                    fwrite($fp, "\033\100");
                    $out = $text . "\r\n";
                    fwrite($fp, $out);
                    fwrite($fp, "\012\012\012\012\012\012\012\012\012\033\151\010\004\001");
                    fclose($fp);
                    $return[$printer_id] = array(
                        'status'    => 'printed'
                    );
                } else {
                    $return[$printer_id] = array(
                        'status' => 'error',
                        'error' => array(
                            'status' => $errstr,
                            'no'    => $errno
                        )
                    );
                }
            }
        }

        return $return;
    }

    public function format_extra($data) {
        $out = '';
        $half = '';
        $space = "\040\040";
        $note = $data['product_note'];
        $options = array();
        unset($data['product_note']);

        foreach ($data as $key=>$value) {
            if (strstr($key,'[') > -1) {
                preg_match('/(.*)\[(.*)?\]/', $key, $tmp);
                if ($tmp[1] == 'ingredients' || $tmp[1] == 'ingredients_second' || $tmp[1] == 'variation') {
                    if ($tmp[1] != 'variation') {
                        $tmp[2] = 'Extra';
                    }
                    if (!isset($value['name'])) {
                        foreach ($value as $j=>$valueb) {
                            if (!isset($options[$tmp[1]])) {
                                $options[$tmp[1]] = array();
                            }
                            if (!isset($options[$tmp[1]][$tmp[2]])) {
                                $options[$tmp[1]][$tmp[2]] = array();
                            }
                            $options[$tmp[1]][$tmp[2]][] = $valueb['name'];
                        }
                    } else {
                        if (!isset($options[$tmp[1]])) {
                            $options[$tmp[1]] = array();
                        }
                        if (!isset($options[$tmp[1]][$tmp[2]])) {
                            $options[$tmp[1]][$tmp[2]] = array();
                        }
                        $options[$tmp[1]][$tmp[2]][] = $value['name'];
                    }
                }
                if ($tmp[1] == 'half') {
                    if ($value['id'] != '') {
                        $options['half'] = $value;
                    }
                }
            }
        }

        foreach ($options['variation'] as $i=>$val) {
            $out .= $space.'> ' . $i . ': ' . join(',', $val) . "\n";
        }

        if (isset($data['default_first'])) {
            $tmp_out = '';
            foreach ($data['default_first'] as $val) {
                $tmp_out .= $val . ', ';
            }
            if ($tmp_out != '') {
                $out .= $space.'> Exclude: ' . substr($tmp_out, 0, -2) . "\n";
            }
        }

        if (isset($options['ingredients'])) {
            $ing = array();
            foreach ($options['ingredients'] as $value) {
                $ing[] = implode(', ', $value);
            }
            $out .= $space.'> Extra: ' . implode(', ',$ing) . "\n";
        }

        if (isset($options['half'])) {
            list($name,) = explode('-', $options['half']['name']);
            $out .= $space.'> 2nd Half: '. $name ."\n";
        }

        if (isset($data['default_second'])) {
           $tmp_out = '';
            foreach ($data['default_second'] as $i=>$val) {
                $tmp_out .= $val . ', ';
            }
            if ($tmp_out != '') {
                $out .= $space.$space."> Exclude: ". substr($tmp_out,0,-2) ."\n";
            }
        }

        if (isset($options['ingredients_second'])) {
            $ing = array();
            foreach ($options['ingredients_second'] as $value) {
                $ing[] = implode(', ', $value);
            }
            $out .= $space.$space.'> Extra: ' . implode(', ',$ing) . "\n";
        }

        if ($note != '') {
            $out .= $space."> Note: ".$note."\n\n";
        } else {
            $out .= "\n";
        }

        return $out;
    }

    public function line($str, $pos = 'left') {
        $space = "\040";
        $len = 47;
        $print_len = strlen($str);
        $out = '';


        switch ($pos) {
            case 'center':
                $l = $len - $print_len;
                $l = floor($l/2);
                $out = str_repeat($space,$l) . $str . str_repeat($space,$l);
                break;
            case 'full_line':
                if ($str != '' || strlen($str) > 1) {
                    $str = substr($str,0,1);
                } else {
                    $str = '=';
                }
                $out = str_repeat($str,$len);
                break;
        }

        return $out;
    }

}