<?php

namespace App\Http\Controllers;

use App\Models\Task;
use Illuminate\Http\Request;

class TaskController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $tasks = Task::all();
        return response()->json($tasks);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
{
    error_log("Store function called"); // Test log entry

    $request->validate([
        'title' => 'required|string|max:255',
        'description' => 'required|string|max:255',
    ]);

    error_log("Validation passed"); // Log after validation

    try {
        $task = auth()->user()->tasks()->create($request->all());
        error_log('Task passed'); // Log the created task
        return response()->json($task, 201);
    } catch (\Exception $e) {
        error_log("Exception during task creation: " . $e->getMessage());
        return response()->json(['error' => 'An error occurred during task creation'], 500);
    }
}

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Task $task)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'required|string|max:255',
        ]);

        $task->update($request->all());
        return response()->json($task);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Task $task)
    {
        $task->delete();
        return response()->json(null, 204);
    }
}