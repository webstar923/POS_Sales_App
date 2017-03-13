<?php

if (!defined('BASEPATH'))
   exit('No direct script access allowed');

class Welcome extends MY_Controller
{

   public function __construct()
   {
      /* if($_SERVER["HTTPS"] != "on") {
        header("Location: https://" . $_SERVER["HTTP_HOST"] . $_SERVER["REQUEST_URI"]);
        exit();
        } */
      parent::__construct();
   }

   /**
    * Index Controller
    */
   public function index()
   {
      /* if ($this->input->cookie('b_cookie')) {
        $this->twiggy->template('layout')->display();
        } else {
        redirect('/login');
        } */
      $data  = array();
      $tmp   = array();
      $query = $this->db->like('name', 'button', 'after')->get('pos_settings')->result_array();
      foreach ($query as $value)
      {
         $tmp[$value['name']] = $value['value'];
      }
      foreach ($tmp as $k => $v)
      {
         if (strstr($k, '_enable'))
         {

            if ($v == 1)
            {
               $t = explode('_', $k);
               if ($t[2] == 'enable')
               {
                 //$data[] = array('data' => 'price' . $t[2], 'label' => $tmp['button_price_' . $t[2] . '_label']);
                 $data[] = array('data' => 'price', 'label' => $tmp['button_price_label'], 'pricegroup'=> strtolower(preg_replace("/[^A-Za-z0-9]/", "", $tmp['button_price_label'])) );
               }
               else
               {
                 //$data[] = array('data' => 'price' . $t[2], 'label' => $tmp['button_price_' . $t[2] . '_label']);
                  $data[] = array('data' => 'price' . $t[2], 'label' => $tmp['button_price_' . $t[2] . '_label'], 'pricegroup'=> strtolower(preg_replace("/[^A-Za-z0-9]/", "", $tmp['button_price_' . $t[2] . '_label'])) );
               }
            }
         }
         else
         {
            continue;
         }
      }
      //var_dump($data);die;
      $this->twiggy->set('priceBtns', $data)->template('layout')->display();
   }

   public function login()
   {
      /* if ($this->input->cookie('currentUser')) {
        redirect('/');
        } else {
        $this->twiggy->template('layout_login')->display();
        } */
      $this->twiggy->template('layout_login')->display();
   }

   public function glympse()
   {
      $this->twiggy->template('layout_glympse')->display();
   }

   /* public function asd($pass, $seed) {
     echo $pass;
     echo '<hr />';
     echo $seed;
     echo '<hr />';
     $salt = 3;
     $chars = preg_split("//", $seed, -1, PREG_SPLIT_NO_EMPTY);
     $time = substr(time(),-5);
     $out = $time;
     foreach ($chars as $char) {
     $out .= '-' . pow(ord($char),$salt) + $time;
     }

     echo $out;
     $out = str_replace('=','',base64_encode($out));
     echo '<hr />';
     echo $out;
     } */
}

/* End of file welcome.php */
/* Location: ./application/controllers/welcome.php */