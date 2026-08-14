/**
 * Centralized Demo Data Store for FiveStar Boost
 * Provides rich, realistic data for portfolio presentation and guest demo evaluation.
 */

export const DEMO_HOTEL = {
  id: 'demo-hotel-uuid-5555',
  name: 'Grand Hotel Vista Bahía ★★★★★',
  contact_email: 'gerencia@grandhotelvistabahia.com',
  contact_phone: '+34 912 345 678',
  timezone: 'Europe/Madrid',
  check_in_time: '14:00',
  check_out_time: '11:00',
  google_review_link: 'https://g.page/r/demo-grand-hotel-vista-bahia/review',
  logo_url: null,
  subscription_status: 'SUBSCRIBED',
  trial_started_at: new Date(Date.now() - 5 * 86400000).toISOString(),
  trial_ends_at: new Date(Date.now() + 25 * 86400000).toISOString(),
};

export const DEMO_ACTIVE_STAYS = [
  {
    id: 'stay-demo-1',
    guest_name: 'Carlos Méndez',
    room_number: 'SUITE-402',
    check_in_date: new Date(Date.now() - 24 * 3600000).toISOString(),
    check_out_date: new Date(Date.now() + 48 * 3600000).toISOString(),
  },
  {
    id: 'stay-demo-2',
    guest_name: 'Valentina Rossi',
    room_number: '204',
    check_in_date: new Date(Date.now() - 36 * 3600000).toISOString(),
    check_out_date: new Date(Date.now() + 12 * 3600000).toISOString(),
  },
  {
    id: 'stay-demo-3',
    guest_name: 'Sophie Dubois',
    room_number: '305',
    check_in_date: new Date(Date.now() - 48 * 3600000).toISOString(),
    check_out_date: new Date(Date.now() + 2 * 3600000).toISOString(),
  },
  {
    id: 'stay-demo-4',
    guest_name: 'Alejandro Silva',
    room_number: 'VIP-501',
    check_in_date: new Date(Date.now() - 12 * 3600000).toISOString(),
    check_out_date: new Date(Date.now() + 72 * 3600000).toISOString(),
  },
  {
    id: 'stay-demo-5',
    guest_name: 'Elena Kuznetsova',
    room_number: '114',
    check_in_date: new Date(Date.now() - 18 * 3600000).toISOString(),
    check_out_date: new Date(Date.now() + 30 * 3600000).toISOString(),
  },
  {
    id: 'stay-demo-6',
    guest_name: 'Marcus Vance',
    room_number: '108',
    check_in_date: new Date(Date.now() - 72 * 3600000).toISOString(),
    check_out_date: new Date(Date.now() + 4 * 3600000).toISOString(),
  },
];

export const DEMO_ALERTS = [
  {
    id: 'alert-demo-1',
    guest_name: 'Valentina Rossi',
    room_number: '204',
    message: 'Huésped reportó ruido intermitente en el compresor del aire acondicionado. Intercepción preventiva aplicada.',
    created_at: new Date(Date.now() - 25 * 60000).toISOString(),
    status: 'OPEN' as const,
    type: 'NEGATIVE_FEEDBACK',
  },
  {
    id: 'alert-demo-2',
    guest_name: 'Marcus Vance',
    room_number: '108',
    message: 'URGENTE: Huésped solicitó recambio de toallas y soporte con la tarjeta de acceso magnética.',
    created_at: new Date(Date.now() - 65 * 60000).toISOString(),
    status: 'OPEN' as const,
    type: 'IMMEDIATE_HELP',
  },
];

export const DEMO_RECENT_POSITIVE = [
  {
    id: 'pos-1',
    rating: 'EXCELLENT',
    stars: 5,
    feedback_text: 'El personal de recepción fue extraordinario, especialmente en el check-in temprano. El desayuno buffet con vista a la bahía es una maravilla.',
    created_at: new Date(Date.now() - 3 * 3600000).toISOString(),
    guest_stays: {
      room_number: 'SUITE-402',
      guests: { name: 'Carlos Méndez', email: 'carlos.mendez@example.com' }
    }
  },
  {
    id: 'pos-2',
    rating: 'EXCELLENT',
    stars: 5,
    feedback_text: 'Instalaciones impecables y el servicio de spa superó todas nuestras expectativas. Sin duda volveremos.',
    created_at: new Date(Date.now() - 9 * 3600000).toISOString(),
    guest_stays: {
      room_number: 'VIP-501',
      guests: { name: 'Alejandro Silva', email: 'a.silva@techgroup.com' }
    }
  },
  {
    id: 'pos-3',
    rating: 'GOOD',
    stars: 4,
    feedback_text: 'Muy buena experiencia en general. La habitación era silenciosa y amplia. La piscina climatizada excelente.',
    created_at: new Date(Date.now() - 16 * 3600000).toISOString(),
    guest_stays: {
      room_number: '305',
      guests: { name: 'Sophie Dubois', email: 'sophie.dubois@paris-lux.fr' }
    }
  },
  {
    id: 'pos-4',
    rating: 'EXCELLENT',
    stars: 5,
    feedback_text: 'Increíble vista y excelente gastronomía en el restaurante principal. Todo el staff siempre sonriente y dispuesto.',
    created_at: new Date(Date.now() - 28 * 3600000).toISOString(),
    guest_stays: {
      room_number: 'PH-01',
      guests: { name: 'Lucía Fernández', email: 'l.fernandez@inversiones.es' }
    }
  },
  {
    id: 'pos-5',
    rating: 'EXCELLENT',
    stars: 5,
    feedback_text: 'Camas super cómodas, limpieza diaria de diez puntos. Recomendadísimo para viajes de descanso o ejecutivos.',
    created_at: new Date(Date.now() - 42 * 3600000).toISOString(),
    guest_stays: {
      room_number: '215',
      guests: { name: 'Guillermo Arismendi', email: 'garismendi@corp.cl' }
    }
  },
  {
    id: 'pos-6',
    rating: 'GOOD',
    stars: 4,
    feedback_text: 'Excelente ubicación cerca del centro histórico y muy buen aislamiento acústico de las habitaciones.',
    created_at: new Date(Date.now() - 60 * 3600000).toISOString(),
    guest_stays: {
      room_number: '112',
      guests: { name: 'Camila Torres', email: 'ctorres@innovate.com' }
    }
  }
];

export const DEMO_RECENT_NEGATIVE = [
  {
    id: 'neg-1',
    rating: 'NEEDS_IMPROVEMENT',
    stars: 2,
    feedback_text: 'El aire acondicionado de la 204 hacía un zumbido molesto durante la madrugada. [Bloqueada de Google Reviews - Notificada a Gerencia]',
    created_at: new Date(Date.now() - 25 * 60000).toISOString(),
    guest_stays: {
      room_number: '204',
      guests: { name: 'Valentina Rossi', email: 'valentina.rossi@milan-design.it' }
    }
  },
  {
    id: 'neg-2',
    rating: 'HELP_NEEDED',
    stars: 1,
    feedback_text: 'Pedimos toallas adicionales hace 40 minutos y aún no llegaban. [Alerta enviada de inmediato a Housekeeping]',
    created_at: new Date(Date.now() - 65 * 60000).toISOString(),
    guest_stays: {
      room_number: '108',
      guests: { name: 'Marcus Vance', email: 'mvance@us-advisors.net' }
    }
  },
  {
    id: 'neg-3',
    rating: 'NEEDS_IMPROVEMENT',
    stars: 2,
    feedback_text: 'El agua caliente demoró un poco en salir en la ducha por la mañana.',
    created_at: new Date(Date.now() - 40 * 3600000).toISOString(),
    guest_stays: {
      room_number: '318',
      guests: { name: 'Federico Gómez', email: 'fgomez@empresa.com.ar' }
    }
  }
];

export const DEMO_RECENT_STAYS = [
  {
    id: 'stay-hist-1',
    check_in_date: new Date(Date.now() - 24 * 3600000).toISOString(),
    check_out_date: new Date(Date.now() + 48 * 3600000).toISOString(),
    room_number: 'SUITE-402',
    status: 'ACTIVE',
    guests: { name: 'Carlos Méndez', email: 'carlos.mendez@example.com' }
  },
  {
    id: 'stay-hist-2',
    check_in_date: new Date(Date.now() - 36 * 3600000).toISOString(),
    check_out_date: new Date(Date.now() + 12 * 3600000).toISOString(),
    room_number: '204',
    status: 'ACTIVE',
    guests: { name: 'Valentina Rossi', email: 'valentina.rossi@milan-design.it' }
  },
  {
    id: 'stay-hist-3',
    check_in_date: new Date(Date.now() - 48 * 3600000).toISOString(),
    check_out_date: new Date(Date.now() + 2 * 3600000).toISOString(),
    room_number: '305',
    status: 'ACTIVE',
    guests: { name: 'Sophie Dubois', email: 'sophie.dubois@paris-lux.fr' }
  },
  {
    id: 'stay-hist-4',
    check_in_date: new Date(Date.now() - 12 * 3600000).toISOString(),
    check_out_date: new Date(Date.now() + 72 * 3600000).toISOString(),
    room_number: 'VIP-501',
    status: 'ACTIVE',
    guests: { name: 'Alejandro Silva', email: 'a.silva@techgroup.com' }
  },
  {
    id: 'stay-hist-5',
    check_in_date: new Date(Date.now() - 18 * 3600000).toISOString(),
    check_out_date: new Date(Date.now() + 30 * 3600000).toISOString(),
    room_number: '114',
    status: 'ACTIVE',
    guests: { name: 'Elena Kuznetsova', email: 'elena.k@globaltrade.de' }
  },
  {
    id: 'stay-hist-6',
    check_in_date: new Date(Date.now() - 72 * 3600000).toISOString(),
    check_out_date: new Date(Date.now() + 4 * 3600000).toISOString(),
    room_number: '108',
    status: 'ACTIVE',
    guests: { name: 'Marcus Vance', email: 'mvance@us-advisors.net' }
  },
  {
    id: 'stay-hist-7',
    check_in_date: new Date(Date.now() - 96 * 3600000).toISOString(),
    check_out_date: new Date(Date.now() - 24 * 3600000).toISOString(),
    room_number: 'PH-01',
    status: 'CHECKED_OUT',
    guests: { name: 'Lucía Fernández', email: 'l.fernandez@inversiones.es' }
  },
  {
    id: 'stay-hist-8',
    check_in_date: new Date(Date.now() - 120 * 3600000).toISOString(),
    check_out_date: new Date(Date.now() - 48 * 3600000).toISOString(),
    room_number: '215',
    status: 'CHECKED_OUT',
    guests: { name: 'Guillermo Arismendi', email: 'garismendi@corp.cl' }
  },
  {
    id: 'stay-hist-9',
    check_in_date: new Date(Date.now() - 144 * 3600000).toISOString(),
    check_out_date: new Date(Date.now() - 72 * 3600000).toISOString(),
    room_number: '112',
    status: 'CHECKED_OUT',
    guests: { name: 'Camila Torres', email: 'ctorres@innovate.com' }
  }
];

export function getDemoStats() {
  return {
    total_stays: 148,
    positive_feedback_count: 94,
    negative_feedback_count: 8,
    alerts_open: 2,
    alerts_resolved: 19,
    recent_stays: DEMO_RECENT_STAYS,
    recent_positive: DEMO_RECENT_POSITIVE,
    recent_negative: DEMO_RECENT_NEGATIVE,
    hotel_name: DEMO_HOTEL.name,
    is_super_admin: false,
  };
}

export function getDemoHistoryStays(query?: string) {
  const allStays = [
    {
      id: 'stay-h1',
      check_in_date: new Date(Date.now() - 24 * 3600000).toISOString(),
      check_out_date: new Date(Date.now() + 48 * 3600000).toISOString(),
      room_number: 'SUITE-402',
      status: 'ACTIVE',
      guests: { name: 'Carlos Méndez', email: 'carlos.mendez@example.com' },
      survey_responses: [{ rating: 'EXCELLENT', stars: 5 }]
    },
    {
      id: 'stay-h2',
      check_in_date: new Date(Date.now() - 36 * 3600000).toISOString(),
      check_out_date: new Date(Date.now() + 12 * 3600000).toISOString(),
      room_number: '204',
      status: 'ACTIVE',
      guests: { name: 'Valentina Rossi', email: 'valentina.rossi@milan-design.it' },
      survey_responses: [{ rating: 'NEEDS_IMPROVEMENT', stars: 2 }]
    },
    {
      id: 'stay-h3',
      check_in_date: new Date(Date.now() - 48 * 3600000).toISOString(),
      check_out_date: new Date(Date.now() + 2 * 3600000).toISOString(),
      room_number: '305',
      status: 'ACTIVE',
      guests: { name: 'Sophie Dubois', email: 'sophie.dubois@paris-lux.fr' },
      survey_responses: [{ rating: 'GOOD', stars: 4 }]
    },
    {
      id: 'stay-h4',
      check_in_date: new Date(Date.now() - 12 * 3600000).toISOString(),
      check_out_date: new Date(Date.now() + 72 * 3600000).toISOString(),
      room_number: 'VIP-501',
      status: 'ACTIVE',
      guests: { name: 'Alejandro Silva', email: 'a.silva@techgroup.com' },
      survey_responses: [{ rating: 'EXCELLENT', stars: 5 }]
    },
    {
      id: 'stay-h5',
      check_in_date: new Date(Date.now() - 18 * 3600000).toISOString(),
      check_out_date: new Date(Date.now() + 30 * 3600000).toISOString(),
      room_number: '114',
      status: 'ACTIVE',
      guests: { name: 'Elena Kuznetsova', email: 'elena.k@globaltrade.de' },
      survey_responses: []
    },
    {
      id: 'stay-h6',
      check_in_date: new Date(Date.now() - 72 * 3600000).toISOString(),
      check_out_date: new Date(Date.now() + 4 * 3600000).toISOString(),
      room_number: '108',
      status: 'ACTIVE',
      guests: { name: 'Marcus Vance', email: 'mvance@us-advisors.net' },
      survey_responses: [{ rating: 'HELP_NEEDED', stars: 1 }]
    },
    {
      id: 'stay-h7',
      check_in_date: new Date(Date.now() - 96 * 3600000).toISOString(),
      check_out_date: new Date(Date.now() - 24 * 3600000).toISOString(),
      room_number: 'PH-01',
      status: 'CHECKED_OUT',
      guests: { name: 'Lucía Fernández', email: 'l.fernandez@inversiones.es' },
      survey_responses: [{ rating: 'EXCELLENT', stars: 5 }]
    },
    {
      id: 'stay-h8',
      check_in_date: new Date(Date.now() - 120 * 3600000).toISOString(),
      check_out_date: new Date(Date.now() - 48 * 3600000).toISOString(),
      room_number: '215',
      status: 'CHECKED_OUT',
      guests: { name: 'Guillermo Arismendi', email: 'garismendi@corp.cl' },
      survey_responses: [{ rating: 'EXCELLENT', stars: 5 }]
    },
    {
      id: 'stay-h9',
      check_in_date: new Date(Date.now() - 144 * 3600000).toISOString(),
      check_out_date: new Date(Date.now() - 72 * 3600000).toISOString(),
      room_number: '112',
      status: 'CHECKED_OUT',
      guests: { name: 'Camila Torres', email: 'ctorres@innovate.com' },
      survey_responses: [{ rating: 'GOOD', stars: 4 }]
    },
    {
      id: 'stay-h10',
      check_in_date: new Date(Date.now() - 180 * 3600000).toISOString(),
      check_out_date: new Date(Date.now() - 96 * 3600000).toISOString(),
      room_number: '318',
      status: 'CHECKED_OUT',
      guests: { name: 'Federico Gómez', email: 'fgomez@empresa.com.ar' },
      survey_responses: [{ rating: 'NEEDS_IMPROVEMENT', stars: 2 }]
    },
    {
      id: 'stay-h11',
      check_in_date: new Date(Date.now() - 210 * 3600000).toISOString(),
      check_out_date: new Date(Date.now() - 120 * 3600000).toISOString(),
      room_number: '104',
      status: 'CHECKED_OUT',
      guests: { name: 'Martina Benítez', email: 'mbenitez@viajes.uy' },
      survey_responses: [{ rating: 'EXCELLENT', stars: 5 }]
    },
    {
      id: 'stay-h12',
      check_in_date: new Date(Date.now() - 240 * 3600000).toISOString(),
      check_out_date: new Date(Date.now() - 150 * 3600000).toISOString(),
      room_number: '209',
      status: 'CHECKED_OUT',
      guests: { name: 'Javier Navarro', email: 'jnavarro@consultora.mx' },
      survey_responses: [{ rating: 'GOOD', stars: 4 }]
    }
  ];

  if (!query) return allStays;

  const q = query.toLowerCase();
  return allStays.filter(
    s => s.guests?.name?.toLowerCase().includes(q) ||
         s.guests?.email?.toLowerCase().includes(q) ||
         s.room_number?.toLowerCase().includes(q)
  );
}
