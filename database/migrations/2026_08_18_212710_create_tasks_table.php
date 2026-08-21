<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tasks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->onDelete('cascade');
            $table->foreignId('crop_id')->nullable()->constrained()->onDelete('cascade');
            $table->foreignId('crop_phase_id')->nullable()->constrained()->onDelete('cascade');
            $table->string('title');
            $table->date('date')->nullable();
            $table->boolean('is_completed')->default(false);
            $table->string('type')->default('general'); // e.g. 'water', 'scan', 'general'
            $table->boolean('is_schedule')->default(true); // Generated schedule vs manual task
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tasks');
    }
};
