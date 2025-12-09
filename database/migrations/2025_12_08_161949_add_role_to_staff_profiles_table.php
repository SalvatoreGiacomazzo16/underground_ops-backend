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
        $table->string('role')->nullable()->after('stage_name');
    });
}

public function down()
{
    Schema::table('staff_profiles', function (Blueprint $table) {
        $table->dropColumn('role');
    });
}
};
