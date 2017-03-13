<?php

class Migration_Extend_halfgroups extends CI_Migration
{

    public function up()
    {
      $this->db->query("ALTER TABLE half_pizza_group ADD half_pizza_multiple BOOLEAN DEFAULT '0' NOT NULL");
    }

    public function down()
    {
      $this->db->query("ALTER TABLE half_pizza_group DROP COLUMN half_pizza_multiple");
    }

}
