<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
   public function up()
{
    Schema::table('staff_profiles', function (Blueprint $table) {
        $table->foreign('account_id')
              ->references('id')
              ->on('users')
              ->cascadeOnDelete();
    });
}

public function down()
{
    Schema::table('staff_profiles', function (Blueprint $table) {
        $table->dropForeign(['account_id']);
    });
}

};