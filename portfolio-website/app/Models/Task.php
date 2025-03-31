<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Task extends Model
{
    protected $table = 'tasks';

    protected $fillable = ['title', 'description', 'completed'];

    // Define the relationship with the User model
    public function user()
    {
        return $this->belongsTo(User::class);
    }
}