<?php

/**
 * Created by PhpStorm.
 * User: gabi
 * Date: 3/28/14
 * Time: 12:31 PM
 */
class Call_handler extends CI_Controller
{

   public function __construct()
   {
      parent::__construct();

      $this->load->model('call_handle');
      $this->load->library('simple_comet');
   }

   public function capture($phone = '', $status = 'inCall')
   {
      if ($phone != '')
      {
         $phone = trim($phone);
         $phone = str_replace(array(' ','-'), '', $phone);
         $this->call_handle->set_status($status, $phone);
      }
      else
      {
         $this->call_handle->set_status('waiting');
      }
   }

   public function check()
   {
      foreach (filter_var_array($_GET['subscribed'], FILTER_SANITIZE_NUMBER_INT) as $key => $value)
      {
         $this->simple_comet->setVar($key, $value);
      }
      echo $this->simple_comet->run();
   }

}
