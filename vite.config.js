import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import fs from 'fs';

export default defineConfig({
    server: {
        host: 'underground-ops.test',
        port: 5173,
        https: {
            key: fs.readFileSync('C:/Laragon/etc/ssl/laragon.key'),
            cert: fs.readFileSync('C:/Laragon/etc/ssl/laragon.crt'),
        },
        cors: true,
    },
    plugins: [
        laravel({
            input: [
                'resources/sass/main.scss',
                'resources/js/app.js',
            ],
            refresh: true,
        }),
    ],
});
