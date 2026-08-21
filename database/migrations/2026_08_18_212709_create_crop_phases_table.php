<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('crop_phases', function (Blueprint $table) {
            $table->id();
            $table->foreignId('crop_id')->constrained()->onDelete('cascade');
            $table->string('name');
            $table->integer('sequence');
            $table->integer('days_count');
            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('crop_phases');
    }
};
