<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
// database/migrations/xxxx_add_account_id_to_staff_profiles.php
public function up()
{
Schema::table('staff_profiles', function (Blueprint $table) {
    $table->foreignId('account_id')
          ->nullable()
          ->after('id');
});

}

public function down()
{
    Schema::table('staff_profiles', function (Blueprint $table) {
        $table->dropForeign(['account_id']);
        $table->dropColumn('account_id');
    });
}

};
