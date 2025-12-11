import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
    base: './', // Vital for Electron: Use relative paths for assets
    build: {
        outDir: 'dist',
        emptyOutDir: true
    },
    plugins: [
        VitePWA({
            registerType: 'autoUpdate',
            includeAssets: ['vite.svg'],
            manifest: {
                name: 'BPMN Editor',
                short_name: 'BPMN',
                description: 'Easy Tool to manipulate BPMN files',
                theme_color: '#ffffff',
                display: 'standalone',
                scope: '/',
                start_url: '/',
                background_color: '#ffffff',
                icons: [
                    {
                        src: 'icon.png',
                        sizes: '192x192',
                        type: 'image/png'
                    },
                    {
                        src: 'icon.png',
                        sizes: '512x512',
                        type: 'image/png'
                    }
                ]
            },
            workbox: {
                // Ensure the SW caches all the built assets
                globPatterns: ['**/*.{js,css,html,ico,png,svg}']
            }
        })
    ]
});
