<?php

namespace App\Console\Commands;

use Database\Seeders\DemoHealthJourneySeeder;
use Illuminate\Console\Command;

/**
 * Add or remove the demonstration Health Journey history.
 *
 * A command rather than seeder arguments because `db:seed --class=X` treats
 * everything after the class as part of the class name, so there is no way to
 * pass it a --clear flag.
 */
class DemoJourneyCommand extends Command
{
    protected $signature = 'demo:journey {--clear : Remove the demo records instead of adding them}';

    protected $description = 'Seed or clear the demo Grade 7 → 4th Year College health journey';

    public function handle(): int
    {
        $seeder = new DemoHealthJourneySeeder();
        $seeder->setCommand($this);

        if ($this->option('clear')) {
            $seeder->clear();

            return self::SUCCESS;
        }

        $seeder->run();

        return self::SUCCESS;
    }
}
