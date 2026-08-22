<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;
use App\Models\Task;
use App\Models\Notification;
use App\Services\FirebasePushService;
use Illuminate\Support\Facades\Http;
use Carbon\Carbon;

class ProcessNotifications extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:process-notifications';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Check daily tasks and weather for users and send push notifications';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $users = User::whereNotNull('device_token')->get();
        
        $todayStr = Carbon::now()->format('Y-m-d');
        
        foreach ($users as $user) {
            $this->checkTasks($user, $todayStr);
            if ($user->lat && $user->lon) {
                $this->checkWeather($user);
            }
        }
    }

    private function checkTasks($user, $todayStr)
    {
        // Find if user has any pending tasks for today
        // Assuming tasks are linked to crops, which are linked to user (wait, tasks table has crop_id, crop has user_id)
        // Let's get tasks directly for this user. Wait, does tasks have user_id?
        // Actually, tasks are linked to crops. Let's assume we fetch crops then tasks.
        $hasPendingTasks = \App\Models\Task::whereHas('crop', function ($query) use ($user) {
                $query->where('user_id', $user->id);
            })
            ->whereDate('time', '<=', $todayStr)
            ->where('done', false)
            ->exists();

        if ($hasPendingTasks) {
            // Check if we already sent a task reminder today
            $alreadySent = Notification::where('user_id', $user->id)
                ->where('type', 'task')
                ->whereDate('created_at', Carbon::today())
                ->exists();

            if (!$alreadySent) {
                $title = "Farm Tasks Reminder";
                $body = "You have pending tasks for today! Please check your Foshol dashboard.";
                
                Notification::create([
                    'user_id' => $user->id,
                    'title' => $title,
                    'body' => $body,
                    'type' => 'task',
                ]);

                FirebasePushService::send($user->device_token, $title, $body, ['type' => 'task']);
                $this->info("Sent task reminder to user {$user->id}");
            }
        }
    }

    private function checkWeather($user)
    {
        $apiKey = env('NEXT_PUBLIC_OPENWEATHER_API_KEY') ?: env('OPENWEATHER_API_KEY');
        if (!$apiKey) return;

        try {
            $response = Http::get("https://api.openweathermap.org/data/2.5/forecast", [
                'lat' => $user->lat,
                'lon' => $user->lon,
                'appid' => $apiKey,
                'units' => 'metric',
                'cnt' => 4 // next 12 hours approx
            ]);

            if ($response->successful()) {
                $data = $response->json();
                $rainPossibility = false;

                if (isset($data['list'])) {
                    foreach ($data['list'] as $forecast) {
                        if (isset($forecast['pop']) && $forecast['pop'] > 0.5) { // 50% chance of rain
                            $rainPossibility = true;
                            break;
                        }
                    }
                }

                if ($rainPossibility) {
                    // Check if we sent a rain alert in the last 6 hours
                    $alreadySent = Notification::where('user_id', $user->id)
                        ->where('type', 'rain')
                        ->where('created_at', '>=', Carbon::now()->subHours(6))
                        ->exists();

                    if (!$alreadySent) {
                        $title = "Rain Alert";
                        $body = "There is a high possibility of rain in your area soon. Plan your field tasks accordingly!";
                        
                        Notification::create([
                            'user_id' => $user->id,
                            'title' => $title,
                            'body' => $body,
                            'type' => 'rain',
                        ]);

                        FirebasePushService::send($user->device_token, $title, $body, ['type' => 'rain']);
                        $this->info("Sent rain alert to user {$user->id}");
                    }
                }
            }
        } catch (\Exception $e) {
            $this->error("Weather check failed for user {$user->id}: " . $e->getMessage());
        }
    }
}
