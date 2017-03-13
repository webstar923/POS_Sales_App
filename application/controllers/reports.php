<?php
/**
 * Created by PhpStorm.
 * User: gabi
 * Date: 3/11/14
 * Time: 2:17 PM
 */

class Reports extends CI_Controller {

    public function __construct() {
        parent::__construct();
        //$this->load->model('sync');
    	$this->load->model('sync');
    }

    public function index() {
        $this->twiggy->template('layout_admin')->display();
    }

    public function cleanDBS () {
    	//run this on logout/login or via cron/mysql events
    	$number_of_days=5;
		$result=$this->sync->cleanTokensAndSyncData($number_of_days);
		if ($result==true) {
			//echo "DBS CLEARED OK";
		}
		else {
			//echo "SOMETHING WENT WRONG";
		}
    }


}