<?php

namespace Tests\Feature;

use App\Models\HealthRecord;
use App\Models\KioskSession;
use App\Models\User;
use App\Models\UserNotification;
use App\Services\Health\UserNotificationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class UserNotificationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // Creating a user fires UserObserver, which reaches out to Supabase.
        Http::fake();
    }

    private function student(): User
    {
        return User::factory()->create(['role' => 'student', 'email_verified_at' => now()]);
    }

    private function recordFor(User $user, array $values): HealthRecord
    {
        $session = KioskSession::create([
            'user_id' => $user->id,
            'session_number' => KioskSession::max('session_number') + 1,
            'status' => 'active',
            'started_at' => now(),
        ]);

        return HealthRecord::create([
            'user_id' => $user->id,
            'kiosk_session_id' => $session->id,
            ...$values,
        ]);
    }

    private function sync(HealthRecord $record): void
    {
        app(UserNotificationService::class)->syncForRecord($record);
    }

    public function test_an_abnormal_reading_is_written_to_the_database(): void
    {
        $user = $this->student();
        $this->sync($this->recordFor($user, ['temperature' => 38.5]));

        $this->assertDatabaseHas('user_notifications', [
            'user_id' => $user->id,
            'key' => 'temp-high',
            'read_at' => null,
        ]);
    }

    public function test_a_normal_reading_produces_nothing(): void
    {
        $user = $this->student();
        $this->sync($this->recordFor($user, ['temperature' => 36.5, 'heart_rate' => 80, 'spo2' => 99]));

        $this->assertSame(0, UserNotification::where('user_id', $user->id)->count());
    }

    public function test_the_quoted_range_comes_from_the_admin_settings(): void
    {
        $user = $this->student();
        $this->sync($this->recordFor($user, ['temperature' => 38.5]));

        $this->assertStringContainsString(
            '35-37.2',
            UserNotification::where('user_id', $user->id)->value('message'),
        );
    }

    public function test_a_reading_that_returns_to_normal_takes_its_notification_away(): void
    {
        $user = $this->student();
        $record = $this->recordFor($user, ['temperature' => 38.5]);
        $this->sync($record);

        $record->update(['temperature' => 36.5]);
        $this->sync($record->fresh());

        $this->assertSame(0, UserNotification::where('user_id', $user->id)->count());
    }

    public function test_opening_the_list_does_not_mark_anything_read(): void
    {
        $user = $this->student();
        $this->sync($this->recordFor($user, ['temperature' => 38.5]));

        $response = $this->actingAs($user)->getJson('/api/user/notifications');

        $response->assertOk()->assertJsonPath('unread_count', 1);
        $this->assertDatabaseHas('user_notifications', ['user_id' => $user->id, 'read_at' => null]);
    }

    public function test_opening_one_notification_marks_only_that_one_read(): void
    {
        $user = $this->student();
        $this->sync($this->recordFor($user, ['temperature' => 38.5, 'heart_rate' => 130]));

        $this->assertSame(2, UserNotification::where('user_id', $user->id)->count());

        $first = UserNotification::where('user_id', $user->id)->orderBy('id')->first();

        $this->actingAs($user)
            ->postJson('/api/user/notifications/read', ['ids' => [$first->id]])
            ->assertOk()
            ->assertJsonPath('unread_count', 1);

        $this->assertNotNull($first->fresh()->read_at);
    }

    public function test_a_read_notification_is_still_there_after_signing_out(): void
    {
        $user = $this->student();
        $this->sync($this->recordFor($user, ['temperature' => 38.5]));

        $notification = UserNotification::where('user_id', $user->id)->firstOrFail();
        $this->actingAs($user)->postJson('/api/user/notifications/read', ['ids' => [$notification->id]]);
        $this->actingAs($user)->postJson('/api/auth/logout');

        $response = $this->actingAs($user->fresh())->getJson('/api/user/notifications');

        $response->assertOk()
            ->assertJsonPath('unread_count', 0)
            ->assertJsonPath('notifications.0.read', true);
    }

    public function test_a_new_reading_behind_the_same_heading_becomes_unread_again(): void
    {
        $user = $this->student();
        $record = $this->recordFor($user, ['temperature' => 38.5]);
        $this->sync($record);

        $notification = UserNotification::where('user_id', $user->id)->firstOrFail();
        $notification->update(['read_at' => now()]);

        $record->update(['temperature' => 39.2]);
        $this->sync($record->fresh());

        $this->assertNull($notification->fresh()->read_at);
    }

    public function test_a_user_never_sees_another_users_notifications(): void
    {
        $hans = $this->student();
        $newcomer = $this->student();

        $this->sync($this->recordFor($hans, ['temperature' => 38.0]));

        $this->actingAs($newcomer)
            ->getJson('/api/user/notifications')
            ->assertOk()
            ->assertJsonPath('unread_count', 0)
            ->assertJsonCount(0, 'notifications');
    }

    public function test_marking_all_read_clears_the_badge(): void
    {
        $user = $this->student();
        $this->sync($this->recordFor($user, ['temperature' => 38.5, 'heart_rate' => 130]));

        $this->actingAs($user)
            ->postJson('/api/user/notifications/read-all')
            ->assertOk()
            ->assertJsonPath('unread_count', 0);

        $this->assertSame(0, UserNotification::where('user_id', $user->id)->whereNull('read_at')->count());
    }
}
