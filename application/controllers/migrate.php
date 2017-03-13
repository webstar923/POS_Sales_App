<?php

// php index.php migrate 1   // where 1 is the number of migration

if (!defined('BASEPATH'))
   exit("No direct script access allowed");

class Migrate extends CI_Controller
{

   public function __construct()
   {
      parent::__construct();
      $this->input->is_cli_request() or exit("Execute via command line: php index.php migrate");
      $this->load->library('migration');
//        $this->migration->version(1);
   }

   public function index()
   {

      if (!$this->migration->current())
      {
         show_error($this->migration->error_string());
      }
   }

}
