import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'Patinhas na Lua App',
        short_name: 'Patinhas',
        description: 'Gestão de Agendamentos e Clientes',
        start_url: '/admin/appointments',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#2563eb',
        icons: [
            {
                src: '/icon.png',
                sizes: '512x512',
                type: 'image/png',
            },
        ],
    };
}
