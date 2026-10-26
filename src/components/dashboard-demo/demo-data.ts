import type {DailyPoint} from '@/server/db/repos';

/**
 * Static showcase data for `/dashboard-demo/*` — no session, no tenant, no
 * writes. Names live in `dashboardDemo.mock.*` so every locale renders its
 * own copy; only ids, counts and piastre amounts live here.
 */

export type DemoOrderStatus = 'pending' | 'accepted' | 'ready' | 'completed';

export type DemoOrderLine = {
  id: string;
  quantity: number;
  dishKey: string;
  optionKeys?: string[];
};

export type DemoOrder = {
  id: string;
  number: number;
  status: DemoOrderStatus;
  /** Null = takeaway; otherwise a `mock.tableLabels.*` key. */
  tableLabelKey: string | null;
  minutesAgo: number;
  paymentMethod: 'cash' | 'instapay';
  totalPiastres: number;
  customerNameKey?: string;
  noteKey?: string;
  lines: DemoOrderLine[];
};

export type DemoOptionGroup = {nameKey: string; choiceCount: number};

export type DemoMenuItem = {
  id: string;
  dishKey: string;
  descriptionKey?: string;
  pricePiastres: number;
  isAvailable: boolean;
  optionGroups?: DemoOptionGroup[];
};

export type DemoMenuCategory = {id: string; categoryKey: string; items: DemoMenuItem[]};

export type DemoTable = {id: string; labelKey: string; token: string; isActive: boolean};

export type DemoMember = {
  id: string;
  nameKey: string;
  emailKey: string;
  role: 'owner' | 'manager' | 'staff';
};

/** Overview headline numbers (shared with the demo orders page stats). */
export const DEMO_STATS = {
  todayOrders: 24,
  activeNow: 4,
  revenuePiastres: 318000,
  activeTables: 2,
  totalTables: 3,
  avgPrepMinutes: 11.5
};

export const DEMO_ORDERS: DemoOrder[] = [
  {
    id: 'o-1028',
    number: 1028,
    status: 'pending',
    tableLabelKey: 'mock.tableLabels.t1',
    minutesAgo: 2,
    paymentMethod: 'cash',
    totalPiastres: 31000,
    lines: [
      {id: 'l-1', quantity: 1, dishKey: 'mock.dishes.grill', optionKeys: ['mock.optionNames.size']},
      {id: 'l-2', quantity: 2, dishKey: 'mock.dishes.pudding'}
    ]
  },
  {
    id: 'o-1027',
    number: 1027,
    status: 'pending',
    tableLabelKey: null,
    minutesAgo: 6,
    paymentMethod: 'instapay',
    totalPiastres: 7500,
    customerNameKey: 'mock.customers.maged',
    lines: [
      {
        id: 'l-3',
        quantity: 1,
        dishKey: 'mock.dishes.koshary',
        optionKeys: ['mock.optionNames.size', 'mock.optionNames.addons']
      }
    ]
  },
  {
    id: 'o-1026',
    number: 1026,
    status: 'accepted',
    tableLabelKey: 'mock.tableLabels.t2',
    minutesAgo: 14,
    paymentMethod: 'cash',
    totalPiastres: 9500,
    lines: [
      {id: 'l-4', quantity: 1, dishKey: 'mock.dishes.hawawshi', optionKeys: ['mock.optionNames.spice']}
    ]
  },
  {
    id: 'o-1025',
    number: 1025,
    status: 'ready',
    tableLabelKey: null,
    minutesAgo: 22,
    paymentMethod: 'cash',
    totalPiastres: 22000,
    customerNameKey: 'mock.customers.sara',
    noteKey: 'mock.notes.cutlery',
    lines: [{id: 'l-5', quantity: 1, dishKey: 'mock.dishes.grill', optionKeys: ['mock.optionNames.size']}]
  },
  {
    id: 'o-1024',
    number: 1024,
    status: 'completed',
    tableLabelKey: 'mock.tableLabels.t3',
    minutesAgo: 38,
    paymentMethod: 'cash',
    totalPiastres: 22000,
    lines: [{id: 'l-6', quantity: 1, dishKey: 'mock.dishes.grill'}]
  },
  {
    id: 'o-1023',
    number: 1023,
    status: 'completed',
    tableLabelKey: 'mock.tableLabels.t1',
    minutesAgo: 55,
    paymentMethod: 'instapay',
    totalPiastres: 9000,
    lines: [{id: 'l-7', quantity: 2, dishKey: 'mock.dishes.pudding'}]
  }
];

export const DEMO_MENU: DemoMenuCategory[] = [
  {
    id: 'cat-main',
    categoryKey: 'mock.categories.main',
    items: [
      {
        id: 'item-koshary',
        dishKey: 'mock.dishes.koshary',
        descriptionKey: 'mock.descriptions.koshary',
        pricePiastres: 7500,
        isAvailable: true,
        optionGroups: [
          {nameKey: 'mock.optionNames.size', choiceCount: 2},
          {nameKey: 'mock.optionNames.addons', choiceCount: 3}
        ]
      },
      {
        id: 'item-hawawshi',
        dishKey: 'mock.dishes.hawawshi',
        descriptionKey: 'mock.descriptions.hawawshi',
        pricePiastres: 9500,
        isAvailable: true,
        optionGroups: [{nameKey: 'mock.optionNames.spice', choiceCount: 3}]
      }
    ]
  },
  {
    id: 'cat-grills',
    categoryKey: 'mock.categories.grills',
    items: [
      {
        id: 'item-grill',
        dishKey: 'mock.dishes.grill',
        descriptionKey: 'mock.descriptions.grill',
        pricePiastres: 22000,
        isAvailable: true,
        optionGroups: [
          {nameKey: 'mock.optionNames.size', choiceCount: 2},
          {nameKey: 'mock.optionNames.addons', choiceCount: 3}
        ]
      }
    ]
  },
  {
    id: 'cat-desserts',
    categoryKey: 'mock.categories.desserts',
    items: [
      {
        id: 'item-pudding',
        dishKey: 'mock.dishes.pudding',
        descriptionKey: 'mock.descriptions.pudding',
        pricePiastres: 4500,
        isAvailable: true
      },
      {
        id: 'item-mango',
        dishKey: 'mock.dishes.mango',
        descriptionKey: 'mock.descriptions.mango',
        pricePiastres: 3000,
        isAvailable: false
      }
    ]
  }
];

export const DEMO_TABLES: DemoTable[] = [
  {id: 't-1', labelKey: 'mock.tableLabels.t1', token: 'a1b2c3d4', isActive: true},
  {id: 't-2', labelKey: 'mock.tableLabels.t2', token: 'e5f6g7h8', isActive: true},
  {id: 't-3', labelKey: 'mock.tableLabels.t3', token: 'i9j0k1l2', isActive: false}
];

export const DEMO_TEAM: DemoMember[] = [
  {id: 'm-1', nameKey: 'mock.team.ownerName', emailKey: 'mock.team.ownerEmail', role: 'owner'},
  {id: 'm-2', nameKey: 'mock.team.managerName', emailKey: 'mock.team.managerEmail', role: 'manager'},
  {id: 'm-3', nameKey: 'mock.team.staffName', emailKey: 'mock.team.staffEmail', role: 'staff'}
];

/** 14 days of views vs. orders ending "today" (2026-10-26). */
export const DEMO_SERIES: DailyPoint[] = [
  {day: '2026-10-13', views: 48, orders: 9},
  {day: '2026-10-14', views: 52, orders: 11},
  {day: '2026-10-15', views: 61, orders: 12},
  {day: '2026-10-16', views: 58, orders: 10},
  {day: '2026-10-17', views: 74, orders: 16},
  {day: '2026-10-18', views: 81, orders: 19},
  {day: '2026-10-19', views: 66, orders: 14},
  {day: '2026-10-20', views: 71, orders: 15},
  {day: '2026-10-21', views: 79, orders: 17},
  {day: '2026-10-22', views: 88, orders: 21},
  {day: '2026-10-23', views: 95, orders: 24},
  {day: '2026-10-24', views: 108, orders: 27},
  {day: '2026-10-25', views: 103, orders: 25},
  {day: '2026-10-26', views: 96, orders: 22}
];

/** Best sellers over "the last 30 days" — names resolve at render time. */
export const DEMO_TOP_DISH_KEYS: {dishKey: string; quantity: number; revenuePiastres: number}[] = [
  {dishKey: 'mock.dishes.koshary', quantity: 86, revenuePiastres: 645000},
  {dishKey: 'mock.dishes.grill', quantity: 54, revenuePiastres: 1188000},
  {dishKey: 'mock.dishes.hawawshi', quantity: 41, revenuePiastres: 389500},
  {dishKey: 'mock.dishes.pudding', quantity: 33, revenuePiastres: 148500},
  {dishKey: 'mock.dishes.mango', quantity: 29, revenuePiastres: 87000}
];

/** Settings showcase: addresses + opening hours rows. */
export const DEMO_ADDRESSES: {id: string; labelKey: string; addressKey: string}[] = [
  {id: 'ad-1', labelKey: 'mock.addresses.label1', addressKey: 'mock.addresses.address1'},
  {id: 'ad-2', labelKey: 'mock.addresses.label2', addressKey: 'mock.addresses.address2'}
];

/** Six days open 12:00–23:00, Friday closed — mirrored as static rows. */
export const DEMO_HOURS: {id: string; weekday: number}[] = [
  {id: 'h-0', weekday: 0},
  {id: 'h-1', weekday: 1},
  {id: 'h-2', weekday: 2},
  {id: 'h-3', weekday: 3},
  {id: 'h-4', weekday: 4},
  {id: 'h-6', weekday: 6}
];
