<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('events', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->string('slug')->unique();
            $table->text('description')->nullable();

            $table->enum('event_type', ['live', 'djset', 'party', 'festival']);
            $table->dateTime('start_datetime');
            $table->dateTime('end_datetime')->nullable();

            $table->foreignId('location_id')->constrained('locations')->cascadeOnDelete();
            $table->enum('status', ['draft', 'published', 'cancelled', 'archived'])->default('draft');
            $table->enum('visibility', ['public', 'private'])->default('public');

            $table->integer('max_capacity')->nullable();
            $table->integer('min_age')->nullable();
            $table->decimal('base_ticket_price', 8, 2)->nullable();

            $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('events');
    }
};