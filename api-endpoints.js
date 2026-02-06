// public/js/core/api-endpoints.js — Tum API endpoint sabitleri
// Bu dosya tum frontend dosyalarinda kullanilan API path'lerini merkezi olarak tanimlar.
// Degisiklik yapildiginda sadece bu dosya guncellenir.

const API = {
    // Auth
    AUTH_LOGIN:      'api/auth/login',
    AUTH_ME:         'api/auth/me',
    AUTH_LOGOUT:     'api/auth/logout',

    // Staff
    STAFF:           'api/staff',
    STAFF_ORDER:     'api/staff-order',

    // Week Data & Live
    WEEK_DATA:       'api/week-data',
    LIVE_ALL:        'api/live-all',

    // Shift & Note & Leave
    SHIFT:           'api/shift',
    NOTE:            'api/note',
    LEAVE_RANGE:     'api/leave-range',

    // Tasks
    TASKS:           'api/tasks',

    // Templates
    TEMPLATES:       'api/templates',
    TEMPLATES_REORDER: 'api/templates/reorder',

    // Admin
    ADMIN_USERS:     'api/admin/users',

    // Units
    UNITS:           'api/units',
    UNITS_REORDER:   'api/units/reorder',

    // Logs
    LOGS:            'api/logs',

    // Archive
    ARCHIVE:         'api/archive',

    // Mail
    MAIL_SEND:       'api/mail/sendShift',

    // PDKS
    PDKS_COMPARE:    'api/pdks/compare',

    // Public TV
    PUBLIC_TV:       'api/public/tv',

    // Statistics (stats.js uses shift/ prefix internally)
    STATISTICS:      'api/statistics',
};
