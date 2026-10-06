<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">

<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">

    <title>Health Kiosk | Capstone System</title>

    {{-- The chosen theme has to be on <html> before the first paint.
         React applies it on mount, but in dev the stylesheet and the bundle
         both arrive after the document, so every refresh flashed the dark
         body colour even when Light was the saved preference. This runs
         synchronously in <head>, so the page is never painted in the wrong
         theme. Keep the storage key in sync with THEME_STORAGE_KEY in
         resources/js/Global/ThemeToggle.jsx. --}}
    <script>
        (function () {
            var root = document.documentElement;
            var mode = 'system';

            // The three original modes resolve exactly as before; the five
            // named themes below are additional modes that pass straight
            // through (same as 'light'/'dark' do), never resolved as if they
            // were 'system'.
            var validModes = [
                'light', 'dark', 'system',
                'valentine', 'lemonade', 'caramellatte', 'aqua', 'emerald',
                'cupcake', 'retro', 'garden', 'halloween', 'lofi', 'luxury', 'autumn', 'abyss'
            ];

            try {
                var stored = window.localStorage.getItem('health-kiosk-theme');
                if (validModes.indexOf(stored) !== -1) mode = stored;
            } catch (e) {
                /* storage blocked - fall back to the system preference */
            }

            var resolved = mode;
            if (mode === 'system') {
                resolved = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
                    ? 'dark'
                    : 'light';
            }

            root.setAttribute('data-theme', resolved);
            root.setAttribute('data-theme-mode', mode);
        })();
    </script>

    {{-- Paints the page ground before app.css loads, so the boot frame already
         matches the resolved theme instead of showing a slab of dark. --}}
    <style>
        html { color-scheme: light; background: #ffffff; }
        html[data-theme="dark"] { color-scheme: dark; background: #000000; }
        html[data-theme="valentine"] { background: oklch(97% 0.014 343.198); }
        html[data-theme="lemonade"] { background: oklch(98.71% 0.02 123.72); }
        html[data-theme="caramellatte"] { background: oklch(98% 0.016 73.684); }
        html[data-theme="aqua"] { color-scheme: dark; background: oklch(37% 0.146 265.522); }
        html[data-theme="emerald"] { background: oklch(100% 0 0); }
        html[data-theme="cupcake"] { background: oklch(97.788% 0.004 56.375); }
        html[data-theme="retro"] { background: oklch(91.637% 0.034 90.515); }
        html[data-theme="garden"] { background: oklch(92.951% 0.002 17.197); }
        html[data-theme="halloween"] { color-scheme: dark; background: oklch(21% 0.006 56.043); }
        html[data-theme="lofi"] { background: oklch(100% 0 0); }
        html[data-theme="luxury"] { color-scheme: dark; background: oklch(14.076% 0.004 285.822); }
        html[data-theme="autumn"] { background: oklch(95.814% 0 0); }
        html[data-theme="abyss"] { color-scheme: dark; background: oklch(20% 0.08 209); }
        body { background: inherit; }
    </style>

    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&display=swap"
        rel="stylesheet">
</head>

<body class="antialiased">
    <div id="app"></div>

    @viteReactRefresh
    @vite(['resources/css/app.css', 'resources/js/main.jsx'])
</body>

</html>