<?php
/**
 * Created by PhpStorm.
 * User: gabi
 * Date: 3/28/14
 * Time: 2:50 PM
 */

class Call_handle extends CI_Model{
    public function set_status($status, $number = '') {
        $client = $this->db
                        ->select("userid,address, first_name, last_name, company_name")
                        ->where("mobile",$number)
                        ->where("usertypeid",3) //VV only pos users
                        ->get("users")->row_array();
        if (count($client)>0) {
            $data = array(
                'id'=>$client['userid'],
                'status'    => $status,
                'number'    => $number,
                'name'      => implode(" ", array($client['first_name'], $client['last_name'])),
                'company'   => $client['company_name'],
                'address'   => $client['address'],
                'checkpoint'=> time()
            );
        } else {
            $data = array(
                'id'=>'',
                'status'    => $status,
                'number'    => $number,
                'name'      => '',
                'company'   => '',
                'address'   => '',
                'checkpoint'=> time()
            );
        }

        $file = FCPATH.'call_check.comet';

        $h = fopen($file,"w+");
        fwrite($h, json_encode($data));
        fclose($h);

        touch($file,time()+1000);
    }
}