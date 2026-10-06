<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class KioskSessionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'session_number' => $this->session_number,
            'status' => $this->status,
            'started_at' => $this->started_at,
            'ended_at' => $this->ended_at,
            'login_method' => $this->login_method,
            'user' => $this->whenLoaded('user', fn () => [
                'id' => $this->user->id,
                'firstname' => $this->user->firstname,
                'lastname' => $this->user->lastname,
                'name' => $this->user->full_name,
                'email' => $this->user->email,
                'student_id' => $this->user->student_id,
                'barcode' => $this->user->barcode,
                'role' => $this->user->role,
                'department' => $this->user->department,
            ]),
            'health_record' => new HealthRecordResource($this->whenLoaded('healthRecord')),
            'activities' => SessionActivityResource::collection($this->whenLoaded('activities')),
        ];
    }
}
