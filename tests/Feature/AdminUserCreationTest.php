<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

/**
 * The rules behind the Students and Teachers forms.
 *
 * The forms only offer valid combinations now, but the same rules are enforced
 * here: a mismatched role and department misfiles the account in every report
 * and chart afterwards, and nothing downstream can tell it was wrong.
 */
class AdminUserCreationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Http::fake();
    }

    private function admin(): User
    {
        return User::factory()->create(['role' => 'admin', 'email_verified_at' => now()]);
    }

    private function payload(array $overrides = []): array
    {
        return array_merge([
            'firstname' => 'Test',
            'lastname' => 'Account',
            'email' => 'test.account@smcbi.edu.ph',
            'password' => 'Test12345',
            'role' => 'student',
            'department' => 'COLLEGE',
            'birthday' => '2004-05-20',
            'gender' => 'male',
            'year_level' => '4th Year',
            'program' => 'BSIT',
        ], $overrides);
    }

    public function test_a_student_account_is_created_with_a_student_department(): void
    {
        $this->actingAs($this->admin())
            ->postJson('/api/admin/users', $this->payload())
            ->assertCreated();

        $this->assertDatabaseHas('users', [
            'email' => 'test.account@smcbi.edu.ph',
            'role' => 'student',
            'department' => 'COLLEGE',
        ]);
    }

    public function test_a_staff_account_is_created_with_a_staff_department(): void
    {
        $this->actingAs($this->admin())
            ->postJson('/api/admin/users', $this->payload([
                'role' => 'personnel',
                'department' => 'COLLEGE INSTRUCTOR',
                'year_level' => null,
                'program' => null,
            ]))
            ->assertCreated();

        $this->assertDatabaseHas('users', [
            'email' => 'test.account@smcbi.edu.ph',
            'role' => 'personnel',
            'department' => 'COLLEGE INSTRUCTOR',
        ]);
    }

    public function test_staff_cannot_be_filed_under_a_student_cohort(): void
    {
        $this->actingAs($this->admin())
            ->postJson('/api/admin/users', $this->payload([
                'role' => 'personnel',
                'department' => 'COLLEGE',
            ]))
            ->assertStatus(422)
            ->assertJsonValidationErrors('department');

        $this->assertDatabaseMissing('users', ['email' => 'test.account@smcbi.edu.ph']);
    }

    public function test_a_student_cannot_be_filed_under_a_staff_department(): void
    {
        $this->actingAs($this->admin())
            ->postJson('/api/admin/users', $this->payload(['department' => 'NTP']))
            ->assertStatus(422)
            ->assertJsonValidationErrors('department');
    }

    /**
     * The form marked these required and never checked them, so an account was
     * created with both blank and the admin was told it had worked.
     */
    public function test_birthday_and_gender_are_required(): void
    {
        $this->actingAs($this->admin())
            ->postJson('/api/admin/users', $this->payload(['birthday' => null, 'gender' => null]))
            ->assertStatus(422)
            ->assertJsonValidationErrors(['birthday', 'gender']);

        $this->assertDatabaseMissing('users', ['email' => 'test.account@smcbi.edu.ph']);
    }

    public function test_a_barcode_is_issued_when_the_field_is_left_blank(): void
    {
        $this->actingAs($this->admin())
            ->postJson('/api/admin/users', $this->payload())
            ->assertCreated();

        $created = User::where('email', 'test.account@smcbi.edu.ph')->firstOrFail();

        $this->assertNotEmpty($created->barcode, 'the kiosk needs something to scan');
        $this->assertSame($created->barcode, $created->student_id);
    }

    public function test_editing_another_field_leaves_the_barcode_alone(): void
    {
        $admin = $this->admin();
        $this->actingAs($admin)->postJson('/api/admin/users', $this->payload())->assertCreated();

        $created = User::where('email', 'test.account@smcbi.edu.ph')->firstOrFail();
        $barcode = $created->barcode;

        $this->actingAs($admin)
            ->putJson("/api/admin/users/{$created->id}", $this->payload([
                'lastname' => 'Renamed',
                'year_level' => '3rd Year',
            ]))
            ->assertOk();

        $this->assertSame($barcode, $created->fresh()->barcode);
    }

    public function test_an_update_is_held_to_the_same_pairing_rule(): void
    {
        $admin = $this->admin();
        $this->actingAs($admin)->postJson('/api/admin/users', $this->payload())->assertCreated();

        $created = User::where('email', 'test.account@smcbi.edu.ph')->firstOrFail();

        $this->actingAs($admin)
            ->putJson("/api/admin/users/{$created->id}", $this->payload(['department' => 'BED INSTRUCTOR']))
            ->assertStatus(422)
            ->assertJsonValidationErrors('department');

        $this->assertSame('COLLEGE', $created->fresh()->department);
    }

    public function test_a_staff_account_can_use_the_kiosk(): void
    {
        $staff = User::factory()->create([
            'role' => 'personnel',
            'department' => 'NTP',
            'email_verified_at' => now(),
        ]);

        // Created from the Teachers page as `personnel`; the kiosk gate used to
        // allow only student and teacher, locking every such account out.
        $this->actingAs($staff)->getJson('/api/user/dashboard')->assertOk();
    }
}
