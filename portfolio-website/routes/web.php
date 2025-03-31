<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\TaskController;

Route::get('/', function () {
    return view('welcome');
});

Auth::routes();

Route::get('/home', [App\Http\Controllers\HomeController::class, 'index'])->name('home');

// Route to render the Blade template
Route::get('/tasks/view', function () {
    return view('tasks');
})->name('tasks.view');

// API routes
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/api/tasks', [TaskController::class, 'index'])->name('tasks.index');
    Route::post('/api/tasks', [TaskController::class, 'store'])->name('tasks.store');
    Route::put('/api/tasks/{task}', [TaskController::class, 'update'])->name('tasks.update');
    Route::delete('/api/tasks/{task}', [TaskController::class, 'destroy'])->name('tasks.destroy');
});