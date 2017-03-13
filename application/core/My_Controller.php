<?php

/**
 * Created by PhpStorm.
 * User: Gabriel Colita
 * Date: 04.02.2014
 * Time: 13:44
 */
class MY_Controller extends CI_Controller
{

    function __construct()
    {

        parent::__construct();

        /** Set Twig Global Variables */
        $this->twiggy
                ->set('base_url', $this->config->base_url())
                ->set('current_url', uri_string())
                ->set('author', 'WMD Solution Romania');


        if($this->config->item('reload_js')){
          $this->twiggy->set('js_version_reload',time());
        }
        else{
          $this->twiggy->set('js_version_reload', 1);
        }

        /**
         * Default Page Properties
         */
        $this->twiggy->set('page', array(
            'role' => 'page',
            'title' => '',
            'backButton' => false,
        ));
    }

}
