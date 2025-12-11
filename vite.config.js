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
                background_color: '#ffffff',
                icons: [
                    {
                        src: 'vite.svg',
                        sizes: 'any',
                        type: 'image/svg+xml'
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
