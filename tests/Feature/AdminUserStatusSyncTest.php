<?php

namespace Tests\Feature;

use App\Models\User;
use App\Services\SupabaseAuthUserService;
use App\Services\SupabaseUserSyncService;
use Illuminate\Auth\Events\Verified;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\Request as ClientRequest;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Http;
use Mockery;
use Tests\TestCase;

class AdminUserStatusSyncTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): User
    {
        return User::factory()->create([
            'role' => 'admin',
            'email_verified_at' => now(),
        ]);
    }

    public function test_new_registration_is_created_as_active_in_companion_auth(): void
    {
        config([
            'services.supabase.url' => 'https://example.supabase.co',
            'services.supabase.secret_key' => 'test-service-key',
        ]);

        $authId = '00000000-0000-0000-0000-000000000001';

        Http::fake(function (ClientRequest $request) use ($authId) {
            if ($request->method() === 'POST' && str_ends_with($request->url(), '/auth/v1/admin/users')) {
                return Http::response(['id' => $authId]);
            }

            if ($request->method() === 'POST' && str_contains($request->url(), '/rest/v1/users')) {
                return Http::response(collect($request->data())->map(
                    fn (array $row) => ['id' => $authId, ...$row],
                )->all());
            }

            return Http::response([], 200);
        });

        $this->postJson('/api/auth/register', [
            'firstname' => 'New',
            'lastname' => 'Student',
            'email' => 'new.student@smcbi.edu.ph',
            'password' => 'StrongPass1!',
            'password_confirmation' => 'StrongPass1!',
            'role' => 'student',
            'department' => 'COLLEGE',
            'birthday' => '2004-05-20',
            'gender' => 'male',
            'year_level' => '4th Year',
            'program' => 'BSIT',
        ])->assertCreated();

        Http::assertSent(fn (ClientRequest $request) => $request->method() === 'POST'
            && str_ends_with($request->url(), '/auth/v1/admin/users')
            && $request->data()['user_metadata']['is_active'] === true
            && $request->data()['ban_duration'] === 'none'
        );

        $this->assertTrue(User::where('email', 'new.student@smcbi.edu.ph')->firstOrFail()->is_active);
    }

    public function test_admin_verification_dispatches_the_same_event_as_email_link_verification(): void
    {
        Http::fake();
        Event::fake([Verified::class]);

        $user = User::factory()->unverified()->create([
            'role' => 'student',
            'department' => 'COLLEGE',
            'supabase_auth_id' => '11111111-1111-1111-1111-111111111111',
        ]);

        $this->actingAs($this->admin())
            ->postJson("/api/admin/users/{$user->id}/verify")
            ->assertOk();

        $this->assertTrue($user->fresh()->hasVerifiedEmail());
        Event::assertDispatched(
            Verified::class,
            fn (Verified $event) => $event->user->is($user),
        );
    }

    public function test_activation_toggle_updates_the_companion_auth_metadata(): void
    {
        Http::fake();

        $user = User::factory()->create([
            'role' => 'student',
            'department' => 'COLLEGE',
            'is_active' => true,
            'supabase_auth_id' => '22222222-2222-2222-2222-222222222222',
        ]);

        $auth = Mockery::mock(SupabaseAuthUserService::class);
        $auth->shouldReceive('updateActiveStatus')
            ->once()
            ->with(Mockery::on(fn (User $syncedUser) => $syncedUser->is($user)), false)
            ->andReturn($user->supabase_auth_id);
        $this->app->instance(SupabaseAuthUserService::class, $auth);

        $profiles = Mockery::mock(SupabaseUserSyncService::class);
        $profiles->shouldReceive('syncUser')
            ->once()
            ->with(Mockery::on(fn (User $syncedUser) => $syncedUser->is($user) && $syncedUser->is_active === false))
            ->andReturn(['local_user_id' => $user->id, 'is_active' => false]);
        $profiles->shouldReceive('syncUsers')->zeroOrMoreTimes()->andReturn([
            'synced_count' => 0,
            'failed_count' => 0,
            'errors' => [],
        ]);
        $this->app->instance(SupabaseUserSyncService::class, $profiles);

        $this->actingAs($this->admin())
            ->postJson("/api/admin/users/{$user->id}/toggle-active")
            ->assertOk()
            ->assertJsonPath('user.is_active', false)
            ->assertJsonPath('cloud_synced', true);

        $this->assertFalse($user->fresh()->is_active);
    }

    public function test_activation_is_not_changed_locally_when_supabase_auth_rejects_it(): void
    {
        Http::fake();

        $user = User::factory()->create([
            'role' => 'student',
            'department' => 'COLLEGE',
            'is_active' => true,
            'supabase_auth_id' => '22222222-2222-2222-2222-222222222223',
        ]);

        $auth = Mockery::mock(SupabaseAuthUserService::class);
        $auth->shouldReceive('updateActiveStatus')
            ->once()
            ->andThrow(new \RuntimeException('Supabase unavailable'));
        $this->app->instance(SupabaseAuthUserService::class, $auth);

        $profiles = Mockery::mock(SupabaseUserSyncService::class);
        $profiles->shouldNotReceive('syncUser');
        $profiles->shouldReceive('syncUsers')->zeroOrMoreTimes()->andReturn([
            'synced_count' => 0,
            'failed_count' => 0,
            'errors' => [],
        ]);
        $this->app->instance(SupabaseUserSyncService::class, $profiles);

        $this->actingAs($this->admin())
            ->postJson("/api/admin/users/{$user->id}/toggle-active")
            ->assertStatus(502);

        $this->assertTrue($user->fresh()->is_active);
    }

    public function test_inactive_accounts_are_banned_and_reactivation_removes_the_ban(): void
    {
        config([
            'services.supabase.url' => 'https://example.supabase.co',
            'services.supabase.secret_key' => 'test-service-key',
        ]);

        $user = User::factory()->create([
            'email' => 'access.control@smcbi.edu.ph',
            'is_active' => true,
            'supabase_auth_id' => '22222222-2222-2222-2222-222222222224',
        ]);

        Http::fake(fn () => Http::response(['id' => $user->supabase_auth_id]));

        $service = app(SupabaseAuthUserService::class);
        $service->updateActiveStatus($user, false);
        $service->updateActiveStatus($user, true);

        $updates = Http::recorded(fn (ClientRequest $request) => $request->method() === 'PUT')->values();

        $this->assertCount(2, $updates);
        $this->assertSame('876000h', $updates[0][0]->data()['ban_duration']);
        $this->assertFalse($updates[0][0]->data()['user_metadata']['is_active']);
        $this->assertSame('none', $updates[1][0]->data()['ban_duration']);
        $this->assertTrue($updates[1][0]->data()['user_metadata']['is_active']);
    }

    public function test_auth_sync_recovers_a_missing_local_auth_id_by_email(): void
    {
        config([
            'services.supabase.url' => 'https://example.supabase.co',
            'services.supabase.secret_key' => 'test-service-key',
        ]);

        $user = User::factory()->create([
            'email' => 'linked.user@smcbi.edu.ph',
            'email_verified_at' => now(),
            'supabase_auth_id' => null,
        ]);
        $authId = '33333333-3333-3333-3333-333333333333';

        Http::fake(function (ClientRequest $request) use ($user, $authId) {
            if ($request->method() === 'GET' && str_ends_with(parse_url($request->url(), PHP_URL_PATH), '/auth/v1/admin/users')) {
                return Http::response([
                    'users' => [
                        ['id' => $authId, 'email' => $user->email],
                    ],
                ]);
            }

            if ($request->method() === 'PUT' && str_ends_with($request->url(), "/auth/v1/admin/users/{$authId}")) {
                return Http::response(['id' => $authId]);
            }

            return Http::response([], 200);
        });

        $result = app(SupabaseAuthUserService::class)->createOrUpdate($user);

        $this->assertSame($authId, $result);
        $this->assertSame($authId, $user->fresh()->supabase_auth_id);
        Http::assertSent(fn (ClientRequest $request) => $request->method() === 'PUT'
            && str_ends_with($request->url(), "/auth/v1/admin/users/{$authId}")
        );

        $updateRequest = Http::recorded(fn (ClientRequest $request) => $request->method() === 'PUT')->first()[0];
        $this->assertTrue((bool) $updateRequest->data()['email_confirm']);
        $this->assertTrue((bool) $updateRequest->data()['user_metadata']['is_active']);
    }
}
