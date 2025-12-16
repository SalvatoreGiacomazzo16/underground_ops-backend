<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('event_staff', function (Blueprint $table) {
            $table->id();
            $table->foreignId('event_id')->constrained('events')->cascadeOnDelete();
            $table->foreignId('staff_profile_id')->constrained('staff_profiles')->cascadeOnDelete();
            $table->string('role_in_event'); // DJ, Fonico, Sicurezza
            $table->decimal('fee', 8, 2)->nullable();
            $table->dateTime('checkin_time')->nullable();
            $table->dateTime('checkout_time')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('event_staff');
    }
};
